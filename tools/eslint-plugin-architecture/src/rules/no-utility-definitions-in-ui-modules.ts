import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import {
	classifyFile,
	DEFAULT_FEATURE_ROOTS,
	type FeatureRootConfig,
	type Zone,
} from "../utils/path-classification.js"
import { isPascalCase } from "../utils/component-detection.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const DEFAULT_STRUCTURAL_ZONES: Zone[] = [
	"screen",
	"widget",
	"part",
	"handler",
	"operation",
]

export default createRule({
	name: "no-utility-definitions-in-ui-modules",
	meta: {
		type: "problem",
		docs: {
			description:
				"Structural modules (screens, widgets, parts, handlers, operations) must not define utility functions or hooks. Use hooks/ and lib/ instead.",
		},
		messages: {
			noUtility:
				"Move '{{name}}' to lib/. Structural modules should only contain wiring, not utility logic.",
			noHook:
				"Move '{{name}}' to hooks/. Structural modules should only contain wiring, not hook definitions.",
		},
		schema: [
			{
				type: "object",
				properties: {
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
					structuralZones: {
						type: "array",
						items: { type: "string" },
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [
		{
			featureRoots: undefined as FeatureRootConfig[] | undefined,
			structuralZones: undefined as Zone[] | undefined,
		},
	],
	create(context, [options]) {
		let featureRoots = options.featureRoots ?? DEFAULT_FEATURE_ROOTS
		let structuralZones = new Set(
			options.structuralZones ?? DEFAULT_STRUCTURAL_ZONES,
		)
		let currentFile = classifyFile(context.filename, featureRoots)
		if (!structuralZones.has(currentFile.zone)) return {}

		function collectReexportedNames(program: TSESTree.Program): Set<string> {
			let names = new Set<string>()
			for (let stmt of program.body) {
				if (stmt.type === "ExportNamedDeclaration" && !stmt.declaration) {
					for (let spec of stmt.specifiers) {
						if (spec.local.type === "Identifier") {
							names.add(spec.local.name)
						}
					}
				}
			}
			return names
		}

		function reportFunction(
			name: string,
			node: TSESTree.Node,
			reexportedNames: Set<string>,
		) {
			if (isPascalCase(name)) return
			if (reexportedNames.has(name)) return
			if (name.startsWith("use")) {
				context.report({ node, messageId: "noHook", data: { name } })
			} else {
				context.report({ node, messageId: "noUtility", data: { name } })
			}
		}

		function checkStatement(
			stmt: TSESTree.ProgramStatement,
			reexportedNames: Set<string>,
		) {
			if (stmt.type === "FunctionDeclaration" && stmt.id) {
				reportFunction(stmt.id.name, stmt, reexportedNames)
			}

			if (stmt.type === "VariableDeclaration") {
				checkVariableDeclaration(stmt, reexportedNames)
			}

			if (
				stmt.type === "ExportNamedDeclaration" ||
				stmt.type === "ExportDefaultDeclaration"
			) {
				let decl = stmt.declaration
				if (!decl) return
				if (decl.type === "FunctionDeclaration" && decl.id) {
					reportFunction(decl.id.name, decl, reexportedNames)
				}
				if (decl.type === "VariableDeclaration") {
					checkVariableDeclaration(decl, reexportedNames)
				}
			}
		}

		function checkVariableDeclaration(
			node: TSESTree.VariableDeclaration,
			reexportedNames: Set<string>,
		) {
			for (let decl of node.declarations) {
				if (decl.id.type !== "Identifier") continue
				let name = decl.id.name
				if (isPascalCase(name)) continue
				if (reexportedNames.has(name)) continue
				if (!decl.init) continue
				if (
					decl.init.type === "ArrowFunctionExpression" ||
					decl.init.type === "FunctionExpression"
				) {
					if (name.startsWith("use")) {
						context.report({ node: decl, messageId: "noHook", data: { name } })
					} else {
						context.report({
							node: decl,
							messageId: "noUtility",
							data: { name },
						})
					}
				}
			}
		}

		return {
			Program(node: TSESTree.Program) {
				let reexportedNames = collectReexportedNames(node)
				for (let stmt of node.body) {
					checkStatement(stmt, reexportedNames)
				}
			},
		}
	},
})
