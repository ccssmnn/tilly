import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	type AliasMap,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const ALLOWED_ZONES = new Set(["screen", "widget"])

export default createRule({
	name: "only-screens-and-widgets-may-import-parts",
	meta: {
		type: "problem",
		docs: {
			description: "Only screens and widgets may import feature parts.",
		},
		messages: {
			forbidden:
				"Only screens and widgets may import parts. Current file is in '{{zone}}'.",
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

				let imported = classifyImport(
					node.source.value,
					context.filename,
					aliases,
				)
				if (imported.zone !== "part") return

				if (
					ALLOWED_ZONES.has(currentFile.zone) &&
					isSameFeature(currentFile, imported)
				) {
					return
				}

				context.report({
					node,
					messageId: "forbidden",
					data: { zone: currentFile.zone },
				})
			},
		}
	},
})
