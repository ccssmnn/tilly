import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import { classifyFile } from "../utils/path-classification.js"
import { collectLocalComponents, getJSXComponentName } from "../utils/component-detection.js"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

export default createRule({
	name: "no-local-part-subcomponents",
	meta: {
		type: "problem",
		docs: {
			description:
				"Part files must not define sub-components that render each other.",
		},
		messages: {
			noSubcomponent:
				"Part files must not contain sub-components. Extract '{{name}}' to its own part or move composition to a screen/widget.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let currentFile = classifyFile(context.filename)
		if (currentFile.zone !== "part") return {}

		return {
			Program(node: TSESTree.Program) {
				let components = collectLocalComponents(node.body)
				if (components.length <= 1) return

				let componentNames = new Set(components.map((c) => c.name))
				let renderedLocals = new Map<string, Set<string>>()

				for (let component of components) {
					let rendered = new Set<string>()
					visitJSX(component.node, (jsxNode) => {
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

				let reportedNames = new Set<string>()
				for (let [, rendered] of renderedLocals) {
					for (let name of rendered) {
						reportedNames.add(name)
					}
				}

				for (let component of components) {
					if (reportedNames.has(component.name)) {
						context.report({
							node: component.node,
							messageId: "noSubcomponent",
							data: { name: component.name },
						})
					}
				}
			},
		}
	},
})

const SKIP_KEYS = new Set(["parent", "loc", "range", "typeAnnotation", "returnType", "typeParameters"])

function visitJSX(
	node: TSESTree.Node,
	callback: (node: TSESTree.JSXOpeningElement) => void,
) {
	if (node.type === "JSXOpeningElement") {
		callback(node)
	}
	for (let key of Object.keys(node)) {
		if (SKIP_KEYS.has(key)) continue
		let value = (node as unknown as Record<string, unknown>)[key]
		if (Array.isArray(value)) {
			for (let child of value) {
				if (child && typeof child === "object" && "type" in child) {
					visitJSX(child as TSESTree.Node, callback)
				}
			}
		} else if (value && typeof value === "object" && "type" in value) {
			visitJSX(value as TSESTree.Node, callback)
		}
	}
}
