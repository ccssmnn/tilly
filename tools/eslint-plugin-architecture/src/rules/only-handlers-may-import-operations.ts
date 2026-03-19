import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
	type AliasMap,
	type FeatureRootConfig,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

export default createRule({
	name: "only-handlers-may-import-operations",
	meta: {
		type: "problem",
		docs: {
			description:
				"Only handlers may import operations. Operations must not import other operations.",
		},
		messages: {
			operationChain:
				"Operations must not import other operations. Keep the dependency tree flat.",
			forbidden:
				"Only handlers may import operations. Current file is in '{{zone}}'.",
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
			aliases: undefined as AliasMap | undefined,
			featureRoots: undefined as FeatureRootConfig[] | undefined,
		},
	],
	create(context, [options]) {
		let aliases = options.aliases ?? DEFAULT_ALIASES
		let featureRoots = options.featureRoots ?? DEFAULT_FEATURE_ROOTS
		let currentFile = classifyFile(context.filename, featureRoots)

		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return

				let imported = classifyImport(
					node.source.value,
					context.filename,
					aliases,
					featureRoots,
				)
				if (imported.zone !== "operation") return
				if (currentFile.zone === "feature-index") return

				if (
					(currentFile.zone === "handler" || currentFile.zone === "app") &&
					isSameFeature(currentFile, imported)
				) {
					return
				}

				context.report({
					node,
					messageId:
						currentFile.zone === "operation" ? "operationChain" : "forbidden",
					data: { zone: currentFile.zone },
				})
			},
		}
	},
})
