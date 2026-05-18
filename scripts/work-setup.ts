#!/usr/bin/env bun

import { execFileSync, spawn, type ChildProcess } from "child_process"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { createConnection } from "net"
import { join } from "path"

let workRoot = readRequiredEnv("WORK_ROOT")
let sourceRoot = readRequiredEnv("WORK_SOURCE_ROOT")
let workspace = readRequiredEnv("WORK_WORKSPACE")
let syncServer = `wss://sync.${workspace}.tilly.localhost`
let sourceEnvPath = join(sourceRoot, ".env")
let workspaceEnvPath = join(workRoot, ".env")

await main()

async function main() {
	if (!existsSync(sourceEnvPath)) {
		throw new Error(`Missing source .env at ${sourceEnvPath}`)
	}

	let envFile = readFileSync(sourceEnvPath, "utf-8")
	envFile = setEnvValue(envFile, "PUBLIC_JAZZ_SYNC_SERVER", syncServer)
	writeFileSync(workspaceEnvPath, envFile)

	execFileSync("bun", ["install"], { cwd: workRoot, stdio: "inherit" })

	let worker = await createWorkspaceJazzWorker()

	envFile = readFileSync(workspaceEnvPath, "utf-8")
	envFile = setEnvValue(envFile, "PUBLIC_JAZZ_WORKER_ACCOUNT", worker.accountId)
	envFile = setEnvValue(envFile, "JAZZ_WORKER_SECRET", worker.accountSecret)
	writeFileSync(workspaceEnvPath, envFile)

	console.log(`Workspace ready: ${workspace}`)
}

function readRequiredEnv(key: string): string {
	let value = process.env[key]
	if (!value) throw new Error(`Missing ${key}`)
	return value
}

function setEnvValue(content: string, key: string, value: string): string {
	let lines = content.split("\n")
	let nextLine = `${key}=${value}`
	let replaced = false

	lines = lines.map(line => {
		if (!line.startsWith(`${key}=`)) return line

		replaced = true
		return nextLine
	})

	if (!replaced) {
		if (lines.at(-1) !== "") lines.push("")
		lines.push(nextLine)
	}

	return lines.join("\n")
}

type JazzWorkerCredentials = { accountId: string; accountSecret: string }

async function createWorkspaceJazzWorker(): Promise<JazzWorkerCredentials> {
	let port = 45000 + Math.floor(Math.random() * 10000)
	let peer = `ws://127.0.0.1:${port}`
	let jazzRun = join(workRoot, "node_modules", ".bin", "jazz-run")
	let syncProcess = spawn(
		jazzRun,
		["sync", "--port", String(port), "--host", "127.0.0.1"],
		{ cwd: workRoot, stdio: "ignore" },
	)

	try {
		await waitForPort(port)

		let output = execFileSync(
			jazzRun,
			[
				"account",
				"create",
				"--name",
				`Tilly Worker (${workspace})`,
				"--peer",
				peer,
				"--json",
			],
			{ cwd: workRoot, encoding: "utf-8" },
		)

		return parseJazzWorkerCredentials(output)
	} finally {
		stopProcess(syncProcess)
	}
}

async function waitForPort(port: number) {
	let deadline = Date.now() + 15_000

	while (Date.now() < deadline) {
		let result = await tryConnect(port)
		if (result) return
		await sleep(200)
	}

	throw new Error(`Timed out waiting for Jazz sync server on port ${port}`)
}

function tryConnect(port: number): Promise<boolean> {
	return new Promise(resolve => {
		let socket = createConnection({ host: "127.0.0.1", port })
		let done = false

		let finish = (result: boolean) => {
			if (done) return

			done = true
			socket.destroy()
			resolve(result)
		}

		socket.setTimeout(500)
		socket.on("connect", () => finish(true))
		socket.on("error", () => finish(false))
		socket.on("timeout", () => finish(false))
	})
}

function parseJazzWorkerCredentials(output: string): JazzWorkerCredentials {
	let parsed: unknown = JSON.parse(output.trim())
	if (!isRecord(parsed)) throw new Error("Invalid Jazz account output")

	let accountId = parsed.accountID
	let accountSecret = parsed.agentSecret

	if (typeof accountId !== "string" || typeof accountSecret !== "string") {
		throw new Error("Jazz account output is missing credentials")
	}

	return { accountId, accountSecret }
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

function stopProcess(process: ChildProcess) {
	if (process.pid) process.kill()
}

function sleep(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}
