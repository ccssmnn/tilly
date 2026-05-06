import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
} from "../utils/path-classification.js"
const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)
export default createRule({
	name: "only-router-may-import-handlers",
	meta: {
		type: "problem",
		docs: {
			description: "Only the router may import handlers.",
		},
		messages: {
			forbidden: "Only the router may import handlers.",
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
		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return
				let imported = classifyImport(
					node.source.value,
					context.filename,
					aliases,
					featureRoots,
				)
				if (imported.zone !== "handler" && imported.zone !== "app") return
				if (currentFile.zone === "feature-index") return
				if (currentFile.feature === null) return
				context.report({ node, messageId: "forbidden" })
			},
		}
	},
})
