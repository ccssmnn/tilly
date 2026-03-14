import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
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
	name: "no-feature-part-composition",
	meta: {
		type: "problem",
		docs: {
			description:
				"Parts must not render other parts. Compose in screens or widgets.",
		},
		messages: {
			noPartComposition:
				"Parts must not render other parts. Compose parts in screens or widgets instead.",
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

		if (currentFile.zone !== "part") return {}

		let importClassifications = new Map<string, Classification>()

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration) {
				if (node.importKind === "type") return

				let classification = classifyImport(
					node.source.value,
					context.filename,
					aliases,
				)
				if (classification.zone !== "part") return

				for (let specifier of node.specifiers) {
					importClassifications.set(specifier.local.name, classification)
				}
			},

			JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
				let name = getJSXComponentName(node)
				if (!name) return
				if (importClassifications.has(name)) {
					context.report({ node, messageId: "noPartComposition" })
				}
			},
		}
	},
})
