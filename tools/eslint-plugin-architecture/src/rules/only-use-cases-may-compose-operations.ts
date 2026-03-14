import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	DEFAULT_ALIASES,
	type AliasMap,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

export default createRule({
	name: "only-use-cases-may-compose-operations",
	meta: {
		type: "problem",
		docs: {
			description: "Only use-cases may import operations.",
		},
		messages: {
			operationChain:
				"Operations must not import other operations. Use a use-case to orchestrate.",
			forbidden: "Only use-cases may import operations.",
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
				let imported = classifyImport(
					node.source.value,
					context.filename,
					aliases,
				)
				if (imported.zone !== "operation") return
				if (currentFile.zone === "use-case") return

				context.report({
					node,
					messageId:
						currentFile.zone === "operation" ? "operationChain" : "forbidden",
				})
			},
		}
	},
})
