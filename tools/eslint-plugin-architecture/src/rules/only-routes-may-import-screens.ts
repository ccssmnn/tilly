import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	DEFAULT_ALIASES,
	type AliasMap,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
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

				let imported = classifyImport(node.source.value, context.filename, aliases)
				if (imported.zone !== "screen") return
				if (ALLOWED_ZONES.has(currentFile.zone)) return

				context.report({ node, messageId: "forbidden" })
			},
		}
	},
})
