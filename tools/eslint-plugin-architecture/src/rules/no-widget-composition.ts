import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	type AliasMap,
	type Classification,
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
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [{ aliases: undefined as AliasMap | undefined }],
	create(context, [options]) {
		let aliases = options.aliases ?? DEFAULT_ALIASES
		let currentFile = classifyFile(context.filename)

		if (currentFile.zone !== "widget") return {}

		let importClassifications = new Map<string, Classification>()

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration) {
				if (node.importKind === "type") return

				let classification = classifyImport(
					node.source.value,
					context.filename,
					aliases,
				)
				if (classification.zone !== "widget") return
				if (isSameFeature(classification, currentFile)) return

				for (let specifier of node.specifiers) {
					importClassifications.set(specifier.local.name, classification)
				}
			},

			JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
				let name = getJSXComponentName(node)
				if (!name) return
				if (importClassifications.has(name)) {
					context.report({ node, messageId: "noWidgetComposition" })
				}
			},
		}
	},
})
