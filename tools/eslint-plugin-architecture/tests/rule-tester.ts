import { RuleTester } from "@typescript-eslint/rule-tester"
import * as vitest from "vitest"

RuleTester.afterAll = vitest.afterAll
RuleTester.describe = vitest.describe
RuleTester.it = vitest.it
RuleTester.itOnly = vitest.it.only

export const ruleTester = new RuleTester({
	languageOptions: {
		parser: (await import("@typescript-eslint/parser")) as never,
		parserOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			ecmaFeatures: { jsx: true },
		},
	},
})
