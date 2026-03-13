import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	type AliasMap,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

export default createRule({
	name: "no-deep-feature-imports",
	meta: {
		type: "problem",
		docs: {
			description: "Forbid cross-feature deep imports. Use the feature index instead.",
		},
		messages: {
			noDeepImport:
				"Import from '{{featurePath}}' instead of deep importing into another feature's internals.",
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

		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return

				let source = node.source.value
				let imported = classifyImport(source, context.filename, aliases)

				if (imported.feature === null) return
				if (imported.zone === "feature-index") return
				if (imported.zone === "unknown") return
				if (isSameFeature(currentFile, imported)) return

				// Routes are allowed to deep-import screens (that's their job)
				if (currentFile.zone === "route" && imported.zone === "screen") return

				let alias = Object.entries(aliases).find(([, v]) =>
					source.startsWith(v) || source.startsWith(v.replace("src/", "")),
				)
				let featurePath = alias
					? `${alias[0]}/features/${imported.feature}`
					: `features/${imported.feature}`

				context.report({
					node,
					messageId: "noDeepImport",
					data: { featurePath },
				})
			},
		}
	},
})
