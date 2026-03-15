/* global Bun */

import { createServer } from "node:net"

function findFreePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		let server = createServer()
		server.listen(0, "127.0.0.1", () => {
			let address = server.address()
			if (!address || typeof address === "string") {
				reject(new Error("Failed to get port"))
				return
			}
			let port = address.port
			server.close(() => resolve(port))
		})
		server.on("error", reject)
	})
}

let [syncPort, devPort] = await Promise.all([findFreePort(), findFreePort()])

console.log(`Starting Jazz sync server on port ${syncPort}`)
console.log(`Starting Astro dev server on port ${devPort}`)
console.log()

let syncProcess = Bun.spawn(
	["bunx", "jazz-run", "sync", "--port", String(syncPort)],
	{
		stdio: ["inherit", "inherit", "inherit"],
		env: { ...process.env },
	},
)

let devProcess = Bun.spawn(["astro", "dev", "--port", String(devPort)], {
	stdio: ["inherit", "inherit", "inherit"],
	env: {
		...process.env,
		PUBLIC_JAZZ_SYNC_SERVER: `ws://localhost:${syncPort}`,
	},
})

function cleanup() {
	syncProcess.kill()
	devProcess.kill()
	process.exit()
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)

await Promise.race([syncProcess.exited, devProcess.exited])
cleanup()
