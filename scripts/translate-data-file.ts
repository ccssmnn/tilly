import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { readFile, writeFile } from "fs/promises"
import { z } from "zod"
import {
	FileDataSchema,
	type FileData,
	type FileNote,
	type FilePerson,
	type FileReminder,
} from "../src/app/features/data-file-schema"

export { translateDataFile }

async function translateDataFile(
	inputPath: string,
	outputPath: string,
	targetLanguage: string,
) {
	let fileContent = await readFile(inputPath, "utf-8")
	let data = FileDataSchema.parse(JSON.parse(fileContent))

	let entries = extractTranslatableEntries(data)
	let translations = await translateInBatches(entries, targetLanguage)
	let translatedData = applyTranslations(data, translations)

	await writeFile(outputPath, JSON.stringify(translatedData, null, 2))
}

function extractTranslatableEntries(data: FileData): TranslatableEntry[] {
	let entries: TranslatableEntry[] = []

	for (let personIndex = 0; personIndex < data.people.length; personIndex++) {
		let person = data.people[personIndex]

		if (person.summary) {
			entries.push({
				type: "person-summary",
				personIndex,
				text: person.summary,
			})
		}

		if (person.notes) {
			for (let noteIndex = 0; noteIndex < person.notes.length; noteIndex++) {
				entries.push({
					type: "note-content",
					personIndex,
					noteIndex,
					text: person.notes[noteIndex].content,
				})
			}
		}

		if (person.reminders) {
			for (
				let reminderIndex = 0;
				reminderIndex < person.reminders.length;
				reminderIndex++
			) {
				entries.push({
					type: "reminder-text",
					personIndex,
					reminderIndex,
					text: person.reminders[reminderIndex].text,
				})
			}
		}
	}

	return entries
}

async function translateInBatches(
	entries: TranslatableEntry[],
	targetLanguage: string,
): Promise<Map<string, string>> {
	let google = createGoogleGenerativeAI({
		apiKey: process.env.GOOGLE_AI_API_KEY,
	})
	let translations = new Map<string, string>()

	let batches = createBatches(entries, 50)

	for (let batch of batches) {
		let kvObject: Record<string, string> = {}
		for (let i = 0; i < batch.length; i++) {
			kvObject[`entry_${i}`] = batch[i].text
		}

		let schemaProperties: Record<string, z.ZodString> = {}
		for (let key of Object.keys(kvObject)) {
			schemaProperties[key] = z.string()
		}

		let result = await generateObject({
			model: google("gemini-2.0-flash-exp"),
			schema: z.object({
				translations: z.object(schemaProperties),
			}),
			prompt: `Translate the following texts to ${targetLanguage}. Return a JSON object with the same keys, but with translated values. Preserve the tone and meaning.

Input:
${JSON.stringify(kvObject, null, 2)}`,
		})

		for (let i = 0; i < batch.length; i++) {
			let key = createEntryKey(batch[i])
			let translatedText = result.object.translations[`entry_${i}`]
			if (translatedText) {
				translations.set(key, translatedText)
			}
		}
	}

	return translations
}

function applyTranslations(
	data: FileData,
	translations: Map<string, string>,
): FileData {
	let translatedData: FileData = {
		...data,
		people: data.people.map((person, personIndex) => {
			let translatedPerson: FilePerson = { ...person }

			let summaryKey = createEntryKey({
				type: "person-summary",
				personIndex,
				text: "",
			})
			if (translations.has(summaryKey)) {
				translatedPerson.summary = translations.get(summaryKey)
			}

			if (person.notes) {
				translatedPerson.notes = person.notes.map((note, noteIndex) => {
					let noteKey = createEntryKey({
						type: "note-content",
						personIndex,
						noteIndex,
						text: "",
					})
					let translatedNote: FileNote = { ...note }
					if (translations.has(noteKey)) {
						translatedNote.content = translations.get(noteKey)!
					}
					return translatedNote
				})
			}

			if (person.reminders) {
				translatedPerson.reminders = person.reminders.map(
					(reminder, reminderIndex) => {
						let reminderKey = createEntryKey({
							type: "reminder-text",
							personIndex,
							reminderIndex,
							text: "",
						})
						let translatedReminder: FileReminder = { ...reminder }
						if (translations.has(reminderKey)) {
							translatedReminder.text = translations.get(reminderKey)!
						}
						return translatedReminder
					},
				)
			}

			return translatedPerson
		}),
	}

	return translatedData
}

function createBatches<T>(items: T[], batchSize: number): T[][] {
	let batches: T[][] = []
	for (let i = 0; i < items.length; i += batchSize) {
		batches.push(items.slice(i, i + batchSize))
	}
	return batches
}

function createEntryKey(entry: TranslatableEntry): string {
	if (entry.type === "person-summary") {
		return `person-${entry.personIndex}-summary`
	}
	if (entry.type === "note-content") {
		return `person-${entry.personIndex}-note-${entry.noteIndex}`
	}
	if (entry.type === "reminder-text") {
		return `person-${entry.personIndex}-reminder-${entry.reminderIndex}`
	}
	throw new Error("Unknown entry type")
}

type TranslatableEntry =
	| {
			type: "person-summary"
			personIndex: number
			text: string
	  }
	| {
			type: "note-content"
			personIndex: number
			noteIndex: number
			text: string
	  }
	| {
			type: "reminder-text"
			personIndex: number
			reminderIndex: number
			text: string
	  }

if (import.meta.url === `file://${process.argv[1]}`) {
	let [inputPath, outputPath, targetLanguage] = process.argv.slice(2)

	if (!inputPath || !outputPath || !targetLanguage) {
		console.error(
			"Usage: tsx translate-data-file.ts <input-path> <output-path> <target-language>",
		)
		process.exit(1)
	}

	translateDataFile(inputPath, outputPath, targetLanguage)
		.then(() => {
			console.log(`Translated file saved to ${outputPath}`)
		})
		.catch(error => {
			console.error("Translation failed:", error)
			process.exit(1)
		})
}
