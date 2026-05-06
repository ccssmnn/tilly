import type { KnipConfig } from "knip"

const config: KnipConfig = {
	entry: [
		"src/pages/**/*.astro",
		"src/pages/**/*.ts",
		"src/middleware.ts",
		"src/content.config.ts",
		"src/app/main.tsx",
		"src/app/sw.ts",
		"src/server/**/*.ts",
		"src/www/**/*.tsx",
		"scripts/*.ts",
		"scripts/*.tsx",
		"scripts/*.js",
	],
	project: ["src/**/*", "scripts/**/*"],
	ignore: ["src/shared/ui/**"],
	ignoreDependencies: [
		"@astrojs/check",
		"@fontsource/inter",
		"@tanstack/react-router-devtools",
		"@tanstack/router-cli",
		"@testing-library/jest-dom",
		"@testing-library/react",
		"@vercel/config",
		"babel-plugin-react-compiler",
		"cmdk",
		"tsx",
		"vercel",
		"workbox-strategies",
		"workbox-window",
	],
	// Ignore Astro Props interfaces - they're used for type checking
	ignoreExportsUsedInFile: true,
	astro: true,
	vitest: true,
}

export default config
