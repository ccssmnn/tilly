import { ESLintUtils } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
} from "../utils/path-classification.js"
const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)
export default createRule({
	name: "no-deep-feature-imports",
	meta: {
		type: "problem",
		docs: {
			description:
				"Forbid cross-feature deep imports. Use the feature index instead.",
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
				let source = node.source.value
				let imported = classifyImport(
					source,
					context.filename,
					aliases,
					featureRoots,
				)
				if (imported.feature === null) return
				if (imported.zone === "feature-index") return
				if (imported.zone === "unknown") return
				if (isSameFeature(currentFile, imported)) return
				// Routes deep-import screens, router deep-imports handlers
				if (currentFile.zone === "route" && imported.zone === "screen") return
				if (currentFile.feature === null && imported.zone === "handler") return
				let featurePath = imported.root
					? findAliasedPath(imported.root, imported.feature, aliases)
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
function findAliasedPath(root, feature, aliases) {
	let fullPath = `${root}/${feature}`
	for (let [alias, target] of Object.entries(aliases)) {
		if (fullPath.startsWith(target + "/") || fullPath === target) {
			return alias + fullPath.slice(target.length)
		}
	}
	return fullPath
}
