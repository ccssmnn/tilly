export function isPascalCase(name) {
	return /^[A-Z]/.test(name)
}
export function getJSXComponentName(node) {
	if (node.name.type === "JSXIdentifier" && isPascalCase(node.name.name)) {
		return node.name.name
	}
	return null
}
export function collectLocalComponents(body) {
	let components = []
	for (let stmt of body) {
		if (
			stmt.type === "FunctionDeclaration" &&
			stmt.id &&
			isPascalCase(stmt.id.name)
		) {
			components.push({ name: stmt.id.name, node: stmt })
		}
		if (stmt.type === "VariableDeclaration") {
			for (let decl of stmt.declarations) {
				if (
					decl.id.type === "Identifier" &&
					isPascalCase(decl.id.name) &&
					decl.init &&
					(decl.init.type === "ArrowFunctionExpression" ||
						decl.init.type === "FunctionExpression" ||
						decl.init.type === "CallExpression")
				) {
					components.push({ name: decl.id.name, node: decl })
				}
			}
		}
		if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) {
			let decl = stmt.declaration
			if (
				decl.type === "FunctionDeclaration" &&
				decl.id &&
				isPascalCase(decl.id.name)
			) {
				components.push({ name: decl.id.name, node: decl })
			}
			if (decl.type === "VariableDeclaration") {
				for (let vd of decl.declarations) {
					if (
						vd.id.type === "Identifier" &&
						isPascalCase(vd.id.name) &&
						vd.init &&
						(vd.init.type === "ArrowFunctionExpression" ||
							vd.init.type === "FunctionExpression")
					) {
						components.push({ name: vd.id.name, node: vd })
					}
				}
			}
		}
		if (stmt.type === "ExportDefaultDeclaration") {
			let decl = stmt.declaration
			if (
				decl.type === "FunctionDeclaration" &&
				decl.id &&
				isPascalCase(decl.id.name)
			) {
				components.push({ name: decl.id.name, node: decl })
			}
		}
	}
	return components
}
