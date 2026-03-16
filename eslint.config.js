import js from "@eslint/js"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
import reactHooks from "eslint-plugin-react-hooks"
import react from "eslint-plugin-react"
import globals from "globals"
import astro from "eslint-plugin-astro"
import architecture from "eslint-plugin-architecture"

let commonRules = {
	"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
	"@typescript-eslint/no-explicit-any": "error",
}

let reactRules = {
	...react.configs.recommended.rules,
	...reactHooks.configs.recommended.rules,
	"react/react-in-jsx-scope": "off",
}

let browserGlobals = {
	...globals.browser,
	...globals.serviceworker,
	React: "readonly",
	NotificationPermission: "readonly",
}

export default [
	js.configs.recommended,
	{
		files: ["src/**/*.{ts,tsx,js,jsx}"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { ecmaVersion: "latest", sourceType: "module", jsx: true },
			globals: browserGlobals,
		},
		plugins: {
			"@typescript-eslint": tseslint,
			"react-hooks": reactHooks,
			react,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			...reactRules,
			...commonRules,
		},
		settings: { react: { version: "detect" } },
	},
	...astro.configs.recommended,
	{
		files: ["src/**/*.astro"],
		languageOptions: {
			parser: astro.parser,
			parserOptions: { parser: tsparser, extraFileExtensions: [".astro"] },
			globals: { ...browserGlobals, Astro: "readonly" },
		},
		plugins: { "@typescript-eslint": tseslint },
		rules: { ...tseslint.configs.recommended.rules, ...commonRules },
	},
	{
		files: ["scripts/**/*.{js,ts,tsx}", "vitest.config.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { ecmaVersion: "latest", sourceType: "module" },
			globals: { ...globals.node, URL: "readonly" },
		},
		plugins: { "@typescript-eslint": tseslint },
		rules: commonRules,
	},
	{
		files: ["src/app/features/{reminders,notes,assistant}/**/*.{ts,tsx}"],
		plugins: { architecture },
		rules: {
			"architecture/no-feature-part-composition": "error",
			"architecture/no-local-part-subcomponents": "error",
			"architecture/no-deep-feature-imports": "error",
			"architecture/only-screens-and-widgets-may-import-parts": "error",
			"architecture/only-routes-may-import-screens": "error",
			"architecture/only-use-cases-may-compose-operations": "error",
		},
	},
	{
		files: ["tools/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { ecmaVersion: "latest", sourceType: "module" },
			globals: globals.node,
		},
		plugins: { "@typescript-eslint": tseslint },
		rules: { ...tseslint.configs.recommended.rules, ...commonRules },
	},
	{
		ignores: [
			"**/dist/",
			"build/",
			"node_modules/",
			"*.config.{js,mjs,ts}",
			"vercel.ts",
			".vercel/",
			".astro/",
		],
	},
]
