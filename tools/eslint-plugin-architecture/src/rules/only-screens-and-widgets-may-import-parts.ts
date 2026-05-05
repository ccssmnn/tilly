import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	isSameFeature,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
	type AliasMap,
	type FeatureRootConfig,
	type Zone,
} from "../utils/path-classification.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const LEAF_ZONES: Set<Zone> = new Set(["part", "feature-lib", "hook"])
const ALLOWED_ZONES: Set<Zone> = new Set([
	"screen",
	"widget",
	"handler",
	"operation",
	"middleware",
	"app",
])

export default createRule({
	name: "only-screens-and-widgets-may-import-parts",
	meta: {
		type: "problem",
		docs: {
			description:
				"Only composition-layer modules (screens, widgets, handlers, operations) may import leaf modules (parts, lib, hooks).",
		},
		messages: {
			forbidden:
				"Only screens, widgets, handlers, and operations may import leaf modules (parts, lib, hooks). Current file is in '{{zone}}'.",
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

		function check(
			node:
				| TSESTree.ImportDeclaration
				| TSESTree.ExportNamedDeclaration
				| TSESTree.ExportAllDeclaration,
			source: string,
			isTypeOnly: boolean,
		) {
			if (isTypeOnly) return

			let imported = classifyImport(
				source,
				context.filename,
				aliases,
				featureRoots,
			)
			if (!LEAF_ZONES.has(imported.zone)) return

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
		}

		return {
			ImportDeclaration(node) {
				check(node, node.source.value, node.importKind === "type")
			},
			ExportNamedDeclaration(node) {
				if (!node.source) return
				check(node, node.source.value, node.exportKind === "type")
			},
			ExportAllDeclaration(node) {
				check(node, node.source.value, node.exportKind === "type")
			},
		}
	},
})
