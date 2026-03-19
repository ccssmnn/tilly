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
	| "operation"
	| "middleware"
	| "app"
	| "unknown"

export type Classification = {
	zone: Zone
	feature: string | null
	root: string | null
}

export type AliasMap = Record<string, string>

export type FeatureRootConfig = {
	path: string
	allowedZones?: string[]
}

export const DEFAULT_ALIASES: AliasMap = {
	"#app": "src/app",
	"#shared": "src/shared",
	"#server": "src/server",
	"#www": "src/www",
}

export const DEFAULT_FEATURE_ROOTS: FeatureRootConfig[] = [
	{
		path: "src/app/features",
		allowedZones: ["screens", "widgets", "parts", "hooks", "lib"],
	},
	{
		path: "src/server/features",
		allowedZones: ["handlers", "operations", "lib", "middleware", "apps"],
	},
]

const FEATURE_ZONE_MAP: Record<string, Zone> = {
	screens: "screen",
	widgets: "widget",
	parts: "part",
	hooks: "hook",
	lib: "feature-lib",
	handlers: "handler",
	operations: "operation",
	middleware: "middleware",
	apps: "app",
}

function normalize(filePath: string): string {
	return filePath.replace(/\\/g, "/")
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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

export function classifyFile(
	absolutePath: string,
	featureRoots: FeatureRootConfig[] = DEFAULT_FEATURE_ROOTS,
): Classification {
	let rel = findSrcRelativePath(absolutePath)
	if (!rel) return { zone: "unknown", feature: null, root: null }
	return classifyStructuralPath(rel, featureRoots)
}

export function classifyStructuralPath(
	structuralPath: string,
	featureRoots: FeatureRootConfig[] = DEFAULT_FEATURE_ROOTS,
): Classification {
	let p = normalize(structuralPath)

	for (let rootConfig of featureRoots) {
		let rootPath = normalize(rootConfig.path)

		// feature index: root/<feature>/index.ts or root/<feature>
		let indexPattern = new RegExp(
			`^${escapeRegex(rootPath)}/([^/]+)(/index(\\.\\w+)?)?$`,
		)
		let indexMatch = p.match(indexPattern)
		if (indexMatch) {
			return { zone: "feature-index", feature: indexMatch[1], root: rootPath }
		}

		// feature subpath: root/<feature>/...
		let featurePattern = new RegExp(
			`^${escapeRegex(rootPath)}/([^/]+)/(.+)$`,
		)
		let featureMatch = p.match(featurePattern)
		if (featureMatch) {
			let feature = featureMatch[1]
			let rest = featureMatch[2]
			let allowedDirs = rootConfig.allowedZones
				? new Set(rootConfig.allowedZones)
				: new Set(Object.keys(FEATURE_ZONE_MAP))

			for (let [dir, zone] of Object.entries(FEATURE_ZONE_MAP)) {
				if (!allowedDirs.has(dir)) continue
				if (rest.startsWith(dir + "/") || rest === dir) {
					return { zone, feature, root: rootPath }
				}
			}

			return { zone: "unknown", feature, root: rootPath }
		}
	}

	// src/app/components/**
	if (p.startsWith("src/app/components/")) {
		return { zone: "app-component", feature: null, root: null }
	}

	// src/shared/ui/**
	if (p.startsWith("src/shared/ui/")) {
		return { zone: "shared-ui", feature: null, root: null }
	}

	// src/app/routes/**
	if (p.startsWith("src/app/routes/")) {
		return { zone: "route", feature: null, root: null }
	}

	return { zone: "unknown", feature: null, root: null }
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
	featureRoots: FeatureRootConfig[] = DEFAULT_FEATURE_ROOTS,
): Classification {
	let resolved = resolveImportPath(importSource, currentFilePath, aliases)
	if (!resolved) return { zone: "unknown", feature: null, root: null }

	// Bare feature import: root/<name> or root/<name>/index
	for (let rootConfig of featureRoots) {
		let rootPath = normalize(rootConfig.path)
		let pattern = new RegExp(
			`^${escapeRegex(rootPath)}/([^/]+)(/index)?$`,
		)
		let match = resolved.match(pattern)
		if (match) {
			return { zone: "feature-index", feature: match[1], root: rootPath }
		}
	}

	return classifyStructuralPath(resolved, featureRoots)
}

export function isSameFeature(a: Classification, b: Classification): boolean {
	return a.feature !== null && b.feature !== null && a.feature === b.feature
}
