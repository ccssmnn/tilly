import { describe, test, expect } from "vitest"
import { createIntl } from "@ccssmnn/intl"
import { messagesEn, messagesDe } from "./messages"

describe("messages parsing", () => {
	test("all English messages can be parsed without errors", () => {
		let compilationErrors: string[] = []

		// Capture console.warn calls to detect MessageFormat compilation errors
		let originalWarn = console.warn
		let originalTable = console.table
		console.warn = (message: string) => {
			if (
				message.includes("MessageFormat compilation completed with") &&
				message.includes("error")
			) {
				compilationErrors.push(message)
			}
		}
		let compilationDetails: any[] = []
		console.table = (data: any) => {
			compilationDetails.push(...(Array.isArray(data) ? data : [data]))
		}

		try {
			// Just creating the intl function tests message compilation
			createIntl(messagesEn, "en")

			// If no compilation errors were logged, all messages parsed successfully
			if (compilationErrors.length > 0) {
				console.log("Compilation details:", compilationDetails)
			}
			expect(compilationErrors).toEqual([])
		} finally {
			console.warn = originalWarn
			console.table = originalTable
		}
	})

	test("all German messages can be parsed without errors", () => {
		let compilationErrors: string[] = []

		// Capture console.warn calls to detect MessageFormat compilation errors
		let originalWarn = console.warn
		let originalTable = console.table
		console.warn = (message: string) => {
			if (
				message.includes("MessageFormat compilation completed with") &&
				message.includes("error")
			) {
				compilationErrors.push(message)
			}
		}
		let compilationDetails: any[] = []
		console.table = (data: any) => {
			compilationDetails.push(...(Array.isArray(data) ? data : [data]))
		}

		try {
			// Just creating the intl function tests message compilation
			createIntl(messagesDe, "de")

			// If no compilation errors were logged, all messages parsed successfully
			if (compilationErrors.length > 0) {
				console.log("Compilation details:", compilationDetails)
			}
			expect(compilationErrors).toEqual([])
		} finally {
			console.warn = originalWarn
			console.table = originalTable
		}
	})
})
