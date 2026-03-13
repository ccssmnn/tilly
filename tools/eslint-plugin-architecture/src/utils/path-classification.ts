import path from "node:path"

export type Zone =
	| "screen"
	| "widget"
	| "part"
	| "hook"
	| "feature-lib"
	| "feature-index"
	| "app-component"
	| "shared-ui"
	| "route"
	| "handler"
	| "use-case"
	| "operation"
	| "unknown"

export type Classification = {
	zone: Zone
	feature: string | null
}

export type AliasMap = Record<string, string>

export const DEFAULT_ALIASES: AliasMap = {
	"#app": "src/app",
	"#shared": "src/shared",
	"#server": "src/server",
	"#www": "src/www",
}

const FEATURE_ZONE_MAP: Record<string, Zone> = {
	screens: "screen",
	widgets: "widget",
	parts: "part",
	hooks: "hook",
	lib: "feature-lib",
	handlers: "handler",
	"use-cases": "use-case",
	operations: "operation",
}

function normalize(filePath: string): string {
	return filePath.replace(/\\/g, "/")
}

function findSrcRelativePath(absolutePath: string): string | null {
	let normalized = normalize(absolutePath)
	let srcIndex = normalized.lastIndexOf("/src/")
	if (srcIndex === -1) {
		if (normalized.startsWith("src/")) return normalized
		return null
	}
	return normalized.slice(srcIndex + 1)
}

export function classifyFile(absolutePath: string): Classification {
	let rel = findSrcRelativePath(absolutePath)
	if (!rel) return { zone: "unknown", feature: null }
	return classifyStructuralPath(rel)
}

export function classifyStructuralPath(structuralPath: string): Classification {
	let p = normalize(structuralPath)

	// src/app/features/<feature>/index.ts (or just src/app/features/<feature>)
	let featureIndexMatch = p.match(
		/^src\/app\/features\/([^/]+)(\/index(\.\w+)?)?$/,
	)
	if (featureIndexMatch) {
		return { zone: "feature-index", feature: featureIndexMatch[1] }
	}

	// src/app/features/<feature>/...
	let appFeatureMatch = p.match(
		/^src\/app\/features\/([^/]+)\/(.+)$/,
	)
	if (appFeatureMatch) {
		let feature = appFeatureMatch[1]
		let rest = appFeatureMatch[2]

		for (let [dir, zone] of Object.entries(FEATURE_ZONE_MAP)) {
			if (dir === "handlers" || dir === "use-cases" || dir === "operations") continue
			if (rest.startsWith(dir + "/") || rest === dir) {
				return { zone, feature }
			}
		}

		return { zone: "unknown", feature }
	}

	// src/server/features/<feature>/...
	let serverFeatureMatch = p.match(
		/^src\/server\/features\/([^/]+)\/(.+)$/,
	)
	if (serverFeatureMatch) {
		let feature = serverFeatureMatch[1]
		let rest = serverFeatureMatch[2]

		for (let [dir, zone] of Object.entries(FEATURE_ZONE_MAP)) {
			if (rest.startsWith(dir + "/") || rest === dir) {
				return { zone, feature }
			}
		}

		return { zone: "unknown", feature }
	}

	// src/app/components/**
	if (p.startsWith("src/app/components/")) {
		return { zone: "app-component", feature: null }
	}

	// src/shared/ui/**
	if (p.startsWith("src/shared/ui/")) {
		return { zone: "shared-ui", feature: null }
	}

	// src/app/routes/**
	if (p.startsWith("src/app/routes/")) {
		return { zone: "route", feature: null }
	}

	return { zone: "unknown", feature: null }
}

export function resolveImportPath(
	importSource: string,
	currentFilePath: string,
	aliases: AliasMap = DEFAULT_ALIASES,
): string | null {
	// Alias imports
	for (let [alias, target] of Object.entries(aliases)) {
		if (importSource === alias) return target
		if (importSource.startsWith(alias + "/")) {
			return target + importSource.slice(alias.length)
		}
	}

	// Relative imports
	if (importSource.startsWith(".")) {
		let currentDir = findSrcRelativePath(currentFilePath)
		if (!currentDir) return null
		let dir = path.posix.dirname(currentDir)
		return path.posix.join(dir, importSource)
	}

	// Package imports — not classifiable
	return null
}

export function classifyImport(
	importSource: string,
	currentFilePath: string,
	aliases: AliasMap = DEFAULT_ALIASES,
): Classification {
	let resolved = resolveImportPath(importSource, currentFilePath, aliases)
	if (!resolved) return { zone: "unknown", feature: null }

	// Bare feature import: src/app/features/<name> or src/app/features/<name>/index
	let bareFeature = resolved.match(
		/^src\/app\/features\/([^/]+)(\/index)?$/,
	)
	if (bareFeature) {
		return { zone: "feature-index", feature: bareFeature[1] }
	}

	return classifyStructuralPath(resolved)
}

export function isSameFeature(a: Classification, b: Classification): boolean {
	return a.feature !== null && b.feature !== null && a.feature === b.feature
}
