#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

let __filename = fileURLToPath(import.meta.url)
let __dirname = path.dirname(__filename)

function printUsageAndExit() {
	console.error(
		"usage: node scripts/process-mock-data.js --template <path> --output <path>",
	)
	process.exit(1)
}

let args = process.argv.slice(2)
let templateFlagIndex = args.indexOf("--template")
let outputFlagIndex = args.indexOf("--output")

if (templateFlagIndex === -1 || outputFlagIndex === -1) {
	printUsageAndExit()
}

let templatePath = args[templateFlagIndex + 1]
let outputPath = args[outputFlagIndex + 1]

if (!templatePath || !outputPath) {
	printUsageAndExit()
}

if (!fs.existsSync(templatePath)) {
	console.error(`Template not found: ${templatePath}`)
	process.exit(1)
}

let template = JSON.parse(fs.readFileSync(templatePath, "utf8"))

function imageToDataURL(imagePath) {
	try {
		let imageBuffer = fs.readFileSync(imagePath)
		let imageBase64 = imageBuffer.toString("base64")
		let ext = path.extname(imagePath).toLowerCase()
		let mimeType =
			ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png"
		return `data:${mimeType};base64,${imageBase64}`
	} catch (error) {
		console.warn(`Warning: Could not read avatar image ${imagePath}`)
		return null
	}
}

function processTimestamp(value) {
	if (typeof value !== "string") return value

	let now = new Date()

	if (value === "TODAY") {
		return now.toISOString()
	}

	if (value.startsWith("DAYS_AGO:")) {
		let daysAgo = parseInt(value.replace("DAYS_AGO:", ""))
		let date = new Date(now)
		date.setDate(date.getDate() + daysAgo)
		return date.toISOString()
	}

	if (value.startsWith("DAYS_FROM_NOW:")) {
		let daysFromNow = parseInt(value.replace("DAYS_FROM_NOW:", ""))
		let date = new Date(now)
		date.setDate(date.getDate() + daysFromNow)
		return date.toISOString()
	}

	return value
}

function processAvatar(avatarFilename) {
	if (!avatarFilename) return null

	let avatarPath = path.join(__dirname, "data", "avatars", avatarFilename)
	let dataURL = imageToDataURL(avatarPath)

	return dataURL ? { dataURL } : null
}

function processObject(obj) {
	if (Array.isArray(obj)) {
		return obj.map(processObject)
	}

	if (obj && typeof obj === "object") {
		let processed = {}

		for (let [key, value] of Object.entries(obj)) {
			if (
				key === "avatar" &&
				typeof value === "string" &&
				(value.endsWith(".jpg") || value.endsWith(".png"))
			) {
				processed[key] = processAvatar(value)
			} else if (key.endsWith("At") || key === "dueAtDate") {
				processed[key] = processTimestamp(value)
			} else {
				processed[key] = processObject(value)
			}
		}

		return processed
	}

	return obj
}

console.log("Processing mock data template...")
let processedData = processObject(template)

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2))

console.log(`✅ Mock data generated successfully!`)
console.log(`📁 Output: ${outputPath}`)
console.log(
	`👥 Generated ${processedData.people.length} people with realistic data`,
)

let totalNotes = 0
let totalReminders = 0
let dueReminders = 0
let completedReminders = 0
let deletedPeople = 0

processedData.people.forEach(person => {
	if (person.deleted) deletedPeople++
	totalNotes += person.notes?.length || 0
	if (person.reminders) {
		totalReminders += person.reminders.length
		person.reminders.forEach(reminder => {
			if (reminder.done) completedReminders++
			if (
				!reminder.done &&
				!reminder.deleted &&
				new Date(reminder.dueAtDate) <= new Date()
			) {
				dueReminders++
			}
		})
	}
})

console.log(`📝 ${totalNotes} notes, ${totalReminders} reminders`)
console.log(`⏰ ${dueReminders} due reminders, ${completedReminders} completed`)
console.log(`🗑️  ${deletedPeople} deleted people`)
console.log(`\n💡 Import this file through your app's data import feature`)
