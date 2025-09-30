import satori from "satori"
import { Resvg } from "@resvg/resvg-js"
import fs from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"

let WIDTH = 1200
let HEIGHT = 630

let DEFAULT_HEADING = "Tilly.social"
let DEFAULT_TAGLINE = "Be the Friend Who Remembers"

let FONT_FAMILY =
	"Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

let nodeRequire = createRequire(import.meta.url)

type CliArgs = {
	heading: string
	tagline: string
	out: string
}

type TemplateInput = {
	heading: string
	tagline: string
	iconSrc: string
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

type OgFont = {
	name: string
	data: ArrayBuffer
	weight?: FontWeight
	style?: "normal" | "italic"
	lang?: string
}

async function main() {
	let args = parseCliArguments(process.argv)
	let [fonts, iconSrc] = await Promise.all([loadInterFonts(), loadIcon()])
	let svg = await satori(
		renderOgTree({ heading: args.heading, tagline: args.tagline, iconSrc }),
		{
			width: WIDTH,
			height: HEIGHT,
			fonts,
		},
	)
	let resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
	let png = resvg.render().asPng()
	let outPath = await writeOutput(args.out, png)
	// eslint-disable-next-line no-console
	console.log(`OG image written to ${outPath}`)
}

main().catch(error => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})

function parseCliArguments(argv: Array<string>): CliArgs {
	let pairs: Record<string, string> = {}
	for (let raw of argv.slice(2)) {
		if (!raw.startsWith("--")) continue
		let body = raw.slice(2)
		let [key, ...rest] = body.split("=")
		if (!key) continue
		let value = rest.length > 0 ? rest.join("=") : ""
		pairs[key] = value
	}
	let heading = pairs.heading?.trim() ?? ""
	if (heading.length === 0) heading = DEFAULT_HEADING
	let tagline = pairs.tagline?.trim() ?? ""
	if (tagline.length === 0) tagline = DEFAULT_TAGLINE
	let out = pairs.out?.trim() ?? ""
	if (out.length === 0) {
		throw new Error("--out is required (example: --out=public/og.png)")
	}
	return { heading, tagline, out }
}

async function loadInterFonts(): Promise<Array<OgFont>> {
	let fontDir = path.dirname(
		nodeRequire.resolve("@fontsource/inter/package.json"),
	)
	let [regular, bold] = await Promise.all([
		fs.readFile(path.join(fontDir, "files", "inter-latin-400-normal.woff")),
		fs.readFile(path.join(fontDir, "files", "inter-latin-700-normal.woff")),
	])
	let fonts: Array<OgFont> = [
		{
			name: "Inter",
			data: bufferToArrayBuffer(regular),
			weight: 400,
			style: "normal",
		},
		{
			name: "Inter",
			data: bufferToArrayBuffer(bold),
			weight: 700,
			style: "normal",
		},
	]
	return fonts
}

async function loadIcon(): Promise<string> {
	let iconPath = path.join(
		process.cwd(),
		"public",
		"app",
		"icons",
		"icon-512x512.png",
	)
	let buffer = await fs.readFile(iconPath)
	let base64 = Buffer.from(buffer).toString("base64")
	return `data:image/png;base64,${base64}`
}

function renderOgTree(input: TemplateInput) {
	// AI: The layout has been updated to place the icon on the left and the heading and tagline stacked vertically to its right, as per the TODO instruction.
	// This is achieved by setting the main container to `flexDirection: "row"` and introducing a nested flex container for the text elements with `flexDirection: "column"`.
	return (
		<div
			style={{
				width: `${WIDTH}px`,
				height: `${HEIGHT}px`,
				display: "flex",
				flexDirection: "row", // Align icon and text container horizontally
				alignItems: "center", // Vertically center the icon and the text block
				padding: "80px",
				color: "#050e0d",
				background: "#f8fdfc",
				fontFamily: FONT_FAMILY,
				gap: "60px", // Space between the icon and the text content
			}}
		>
			<img
				src={input.iconSrc}
				alt="Tilly icon"
				style={{
					width: "264px",
					height: "264px",
					borderRadius: "10px",
					flexShrink: 0,
				}} // Ensure icon does not shrink
			/>
			<div // Container for heading and tagline
				style={{
					display: "flex",
					flexDirection: "column", // Stack heading and tagline vertically
					alignItems: "flex-start", // Align text to the left within its container
					justifyContent: "center", // Vertically center content if extra space exists
					flexGrow: 1, // Allow text container to take available horizontal space
				}}
			>
				<div
					style={{
						fontSize: "96px",
						fontWeight: 700,
						lineHeight: 1.05,
					}}
				>
					{input.heading}
				</div>
				<div
					style={{
						fontSize: "48px",
						fontWeight: 700,
						color: "#465a57",
						marginTop: "24px", // Add vertical space between heading and tagline
					}}
				>
					{input.tagline}
				</div>
			</div>
		</div>
	)
}

async function writeOutput(outPath: string, data: Uint8Array): Promise<string> {
	let resolved = path.resolve(process.cwd(), outPath)
	let folder = path.dirname(resolved)
	await fs.mkdir(folder, { recursive: true })
	await fs.writeFile(resolved, data)
	return resolved
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
	let view = new Uint8Array(buffer.length)
	view.set(buffer)
	return view.buffer
}
