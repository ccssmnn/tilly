import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	DEFAULT_FEATURE_ROOTS,
} from "../utils/path-classification.js"
import {
	collectLocalComponents,
	getJSXComponentName,
} from "../utils/component-detection.js"
const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)
const ZONES_WITH_NO_LOCAL_SUBCOMPONENTS = new Set(["screen", "widget", "part"])
const EXTRACTION_HINT = {
	screen: "Extract '{{name}}' to a widget or part.",
	widget: "Extract '{{name}}' to a part.",
	part: "Extract '{{name}}' to its own part or move composition to a screen/widget.",
}
export default createRule({
	name: "no-local-subcomponents",
	meta: {
		type: "problem",
		docs: {
			description:
				"Screen, widget, and part files must not define sub-components that render each other.",
		},
		messages: {
			noSubcomponent:
				"{{zone}} files must not contain sub-components. {{hint}}",
		},
		schema: [
			{
				type: "object",
				properties: {
					featureRoots: {
						type: "array",
						items: {
							type: "object",
							properties: {
								path: { type: "string" },
								allowedZones: { type: "array", items: { type: "string" } },
							},
							required: ["path"],
							additionalProperties: false,
						},
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [
		{
			featureRoots: undefined,
		},
	],
	create(context, [options]) {
		let featureRoots = options.featureRoots ?? DEFAULT_FEATURE_ROOTS
		let currentFile = classifyFile(context.filename, featureRoots)
		if (!ZONES_WITH_NO_LOCAL_SUBCOMPONENTS.has(currentFile.zone)) return {}
		let zone = currentFile.zone
		return {
			Program(node) {
				let components = collectLocalComponents(node.body)
				if (components.length <= 1) return
				let componentNames = new Set(components.map(c => c.name))
				let renderedLocals = new Map()
				for (let component of components) {
					let rendered = new Set()
					visitJSX(component.node, jsxNode => {
						let name = getJSXComponentName(jsxNode)
						if (name && componentNames.has(name) && name !== component.name) {
							rendered.add(name)
						}
					})
					if (rendered.size > 0) {
						renderedLocals.set(component.name, rendered)
					}
				}
				if (renderedLocals.size === 0) return
				let reportedNames = new Set()
				for (let [, rendered] of renderedLocals) {
					for (let name of rendered) {
						reportedNames.add(name)
					}
				}
				let zoneLabel = zone.charAt(0).toUpperCase() + zone.slice(1)
				let hintTemplate = EXTRACTION_HINT[zone]
				for (let component of components) {
					if (reportedNames.has(component.name)) {
						context.report({
							node: component.node,
							messageId: "noSubcomponent",
							data: {
								zone: zoneLabel,
								name: component.name,
								hint: hintTemplate.replace("{{name}}", component.name),
							},
						})
					}
				}
			},
		}
	},
})
const SKIP_KEYS = new Set([
	"parent",
	"loc",
	"range",
	"typeAnnotation",
	"returnType",
	"typeParameters",
])
function visitJSX(node, callback) {
	if (node.type === "JSXOpeningElement") {
		callback(node)
	}
	for (let key of Object.keys(node)) {
		if (SKIP_KEYS.has(key)) continue
		let value = node[key]
		if (Array.isArray(value)) {
			for (let child of value) {
				if (child && typeof child === "object" && "type" in child) {
					visitJSX(child, callback)
				}
			}
		} else if (value && typeof value === "object" && "type" in value) {
			visitJSX(value, callback)
		}
	}
}
