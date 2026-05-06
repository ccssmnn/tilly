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
const LEAF_ZONES = new Set(["part", "feature-lib", "hook"])
const COMPOSITION_ZONES = new Set([
	"screen",
	"widget",
	"handler",
	"operation",
	"middleware",
	"app",
])
// `feature-lib` and `hook` are leaves but form part of the public surface, so
// the feature index may re-export them. `part` is strictly private and may
// only be reached from the same feature's composition layer.
const BARREL_REEXPORTABLE = new Set(["feature-lib", "hook"])
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
			aliases: undefined,
			featureRoots: undefined,
		},
	],
	create(context, [options]) {
		let aliases = options.aliases ?? DEFAULT_ALIASES
		let featureRoots = options.featureRoots ?? DEFAULT_FEATURE_ROOTS
		let currentFile = classifyFile(context.filename, featureRoots)
		function check(node, source, isTypeOnly, isReexport) {
			if (isTypeOnly) return
			let imported = classifyImport(
				source,
				context.filename,
				aliases,
				featureRoots,
			)
			if (!LEAF_ZONES.has(imported.zone)) return
			if (
				COMPOSITION_ZONES.has(currentFile.zone) &&
				isSameFeature(currentFile, imported)
			) {
				return
			}
			if (
				isReexport &&
				currentFile.zone === "feature-index" &&
				BARREL_REEXPORTABLE.has(imported.zone) &&
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
				check(node, node.source.value, node.importKind === "type", false)
			},
			ExportNamedDeclaration(node) {
				if (!node.source) return
				check(node, node.source.value, node.exportKind === "type", true)
			},
			ExportAllDeclaration(node) {
				check(node, node.source.value, node.exportKind === "type", true)
			},
		}
	},
})
