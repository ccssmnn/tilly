import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import { classifyFile } from "../utils/path-classification.js"
import { isPascalCase } from "../utils/component-detection.js"

const createRule = ESLintUtils.RuleCreator(
	name =>
		`https://github.com/ccssmnn/tilly/blob/main/tools/eslint-plugin-architecture/README.md#${name}`,
)

const APP_ZONES = new Set(["screen", "widget", "part"])
const SERVER_ZONES = new Set(["handler"])

function isServerFile(filename: string): boolean {
	return filename.replace(/\\/g, "/").includes("/src/server/")
}

export default createRule({
	name: "no-utility-definitions-in-ui-modules",
	meta: {
		type: "problem",
		docs: {
			description:
				"Structural modules (screens, widgets, parts, handlers) must not define utility functions or hooks. Use hooks/ and lib/ instead.",
		},
		messages: {
			noUtility:
				"Move '{{name}}' to lib/. Structural modules should only contain wiring, not utility logic.",
			noHook:
				"Move '{{name}}' to hooks/. Structural modules should only contain wiring, not hook definitions.",
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		let currentFile = classifyFile(context.filename)
		let zones = isServerFile(context.filename) ? SERVER_ZONES : APP_ZONES
		if (!zones.has(currentFile.zone)) return {}

		function reportFunction(name: string, node: TSESTree.Node) {
			if (isPascalCase(name)) return
			if (name.startsWith("use")) {
				context.report({ node, messageId: "noHook", data: { name } })
			} else {
				context.report({ node, messageId: "noUtility", data: { name } })
			}
		}

		function checkStatement(stmt: TSESTree.ProgramStatement) {
			if (stmt.type === "FunctionDeclaration" && stmt.id) {
				reportFunction(stmt.id.name, stmt)
			}

			if (stmt.type === "VariableDeclaration") {
				checkVariableDeclaration(stmt)
			}

			if (
				stmt.type === "ExportNamedDeclaration" ||
				stmt.type === "ExportDefaultDeclaration"
			) {
				let decl = stmt.declaration
				if (!decl) return
				if (decl.type === "FunctionDeclaration" && decl.id) {
					reportFunction(decl.id.name, decl)
				}
				if (decl.type === "VariableDeclaration") {
					checkVariableDeclaration(decl)
				}
			}
		}

		function checkVariableDeclaration(node: TSESTree.VariableDeclaration) {
			for (let decl of node.declarations) {
				if (decl.id.type !== "Identifier") continue
				let name = decl.id.name
				if (isPascalCase(name)) continue
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
				for (let stmt of node.body) {
					checkStatement(stmt)
				}
			},
		}
	},
})
