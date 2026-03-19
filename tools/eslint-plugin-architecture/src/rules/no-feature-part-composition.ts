import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import {
	classifyFile,
	classifyImport,
	DEFAULT_ALIASES,
	DEFAULT_FEATURE_ROOTS,
	type AliasMap,
	type Classification,
	type FeatureRootConfig,
	type Zone,
} from "../utils/path-classification.js"
import { getJSXComponentName } from "../utils/component-detection.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const LEAF_ZONES: Set<Zone> = new Set(["part", "feature-lib", "hook"])

export default createRule({
	name: "no-feature-part-composition",
	meta: {
		type: "problem",
		docs: {
			description:
				"Leaf modules (parts, lib, hooks) must not compose other modules of the same kind.",
		},
		messages: {
			noPartComposition:
				"Leaf modules (parts, lib, hooks) must not compose other modules of the same kind. Compose in screens, widgets, handlers, or operations instead.",
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

		if (!LEAF_ZONES.has(currentFile.zone)) return {}

		let importClassifications = new Map<string, Classification>()

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration) {
				if (node.importKind === "type") return

				let classification = classifyImport(
					node.source.value,
					context.filename,
					aliases,
					featureRoots,
				)
				if (classification.zone !== currentFile.zone) return

				// Non-UI leaf zones: block the import directly
				if (currentFile.zone !== "part") {
					context.report({ node, messageId: "noPartComposition" })
					return
				}

				// Frontend parts (UI): track for JSX rendering check
				for (let specifier of node.specifiers) {
					importClassifications.set(specifier.local.name, classification)
				}
			},

			JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
				let name = getJSXComponentName(node)
				if (!name) return
				if (importClassifications.has(name)) {
					context.report({ node, messageId: "noPartComposition" })
				}
			},
		}
	},
})
