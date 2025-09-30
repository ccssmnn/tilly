import { readdirSync, statSync, readFileSync } from "fs"
import { join } from "path"

main()

function main() {
	let directories = process.argv.slice(2)

	if (directories.length === 0) {
		console.error("usage: node myscript.js <dir1> [dir2] ...")
		process.exit(1)
	}

	directories.forEach(dir => processDirectory(dir))
}

function processDirectory(dir) {
	try {
		let files = getFilesRecursive(dir)
		files.forEach(file => printFileWithLineNumbers(file))
	} catch (err) {
		console.error(`error processing ${dir}: ${err.message}`)
	}
}

function getFilesRecursive(dir) {
	let files = []
	let items = readdirSync(dir)

	items.forEach(item => {
		let fullPath = join(dir, item)
		let stat = statSync(fullPath)

		if (stat.isDirectory()) {
			files = files.concat(getFilesRecursive(fullPath))
		} else if (stat.isFile()) {
			files.push(fullPath)
		}
	})

	return files
}

function printFileWithLineNumbers(filePath) {
	try {
		let content = readFileSync(filePath, "utf8")
		let lines = content.split("\n")

		console.log(filePath)
		lines.forEach((line, index) => {
			console.log(`${index + 1} ${line.trim()}`)
		})
	} catch (err) {
		console.error(`error reading ${filePath}: ${err.message}`)
	}
}
