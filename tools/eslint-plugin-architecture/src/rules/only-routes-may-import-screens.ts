import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
	type AliasMap,
	type FeatureRootConfig,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const ALLOWED_ZONES = new Set(["route", "feature-index"])

export default createRule({
	name: "only-routes-may-import-screens",
	meta: {
		type: "problem",
		docs: {
			description: "Only route files may import screens.",
		},
		messages: {
			forbidden: "Only route files may import screens.",
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
				if (imported.zone !== "screen") return
				if (ALLOWED_ZONES.has(currentFile.zone)) return

				context.report({ node, messageId: "forbidden" })
			},
		}
	},
})
