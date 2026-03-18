import fs from "node:fs"
import path from "node:path"
import { ESLintUtils } from "@typescript-eslint/utils"
import {
	resolveImportPath,
	DEFAULT_ALIASES,
	type AliasMap,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const FEATURES_DIRECT_IMPORT_PATTERN =
	/^src\/(?:app|server)\/features\/([^/]+)$/

function findProjectRoot(filename: string): string | null {
	let dir = path.dirname(filename)
	while (dir !== path.dirname(dir)) {
		if (fs.existsSync(path.join(dir, "src"))) return dir
		dir = path.dirname(dir)
	}
	return null
}

function isDirectory(projectRoot: string, resolved: string): boolean {
	let absolute = path.join(projectRoot, resolved)
	return fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()
}

export default createRule({
	name: "no-loose-feature-module-imports",
	meta: {
		type: "problem",
		docs: {
			description:
				"Only allow importing feature folders from the features directory. Loose modules must be moved into a feature folder or into shared.",
		},
		messages: {
			noLooseImport:
				"'{{module}}' is a loose module in the features directory. Move it into a feature folder or into shared.",
		},
		schema: [
			{
				type: "object",
				properties: {
					aliases: {
						type: "object",
						additionalProperties: { type: "string" },
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [{ aliases: undefined as AliasMap | undefined }],
	create(context, [options]) {
		let aliases = options.aliases ?? DEFAULT_ALIASES
		let projectRoot = findProjectRoot(context.filename)

		return {
			ImportDeclaration(node) {
				if (node.importKind === "type") return
				if (!projectRoot) return

				let resolved = resolveImportPath(
					node.source.value,
					context.filename,
					aliases,
				)
				if (!resolved) return

				let match = resolved.match(FEATURES_DIRECT_IMPORT_PATTERN)
				if (!match) return

				if (isDirectory(projectRoot, resolved)) return

				context.report({
					node,
					messageId: "noLooseImport",
					data: { module: match[1] },
				})
			},
		}
	},
})
