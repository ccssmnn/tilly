import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
} from "../utils/path-classification.js"
import { getJSXComponentName } from "../utils/component-detection.js"
const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)
export default createRule({
	name: "no-widget-composition",
	meta: {
		type: "problem",
		docs: {
			description:
				"Widgets must not render other widgets. Compose widgets in screens.",
		},
		messages: {
			noWidgetComposition:
				"Widgets must not render other widgets. Compose widgets in screens instead.",
		},
		schema: [
			{
				type: "object",
				properties: {
					aliases: { type: "object", additionalProperties: { type: "string" } },
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
			aliases: undefined,
			featureRoots: undefined,
		},
	],
	create(context, [options]) {
		let aliases = options.aliases ?? DEFAULT_ALIASES
		let featureRoots = options.featureRoots ?? DEFAULT_FEATURE_ROOTS
		let currentFile = classifyFile(context.filename, featureRoots)
		if (currentFile.zone !== "widget") return {}
		let importClassifications = new Map()
		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return
				let classification = classifyImport(
					node.source.value,
					context.filename,
					aliases,
					featureRoots,
				)
				if (classification.zone !== "widget") return
				if (isSameFeature(classification, currentFile)) return
				for (let specifier of node.specifiers) {
					importClassifications.set(specifier.local.name, classification)
				}
			},
			JSXOpeningElement(node) {
				let name = getJSXComponentName(node)
				if (!name) return
				if (importClassifications.has(name)) {
					context.report({ node, messageId: "noWidgetComposition" })
				}
			},
		}
	},
})
