export { consumeUntil }

/**
 * Consumes a readable stream but resolves as soon as a marker string
 * appears in a chunk. The stream continues being drained after resolution.
 */
async function consumeUntil(
	reader: ReadableStreamDefaultReader,
	marker: string,
) {
	let decoder = new TextDecoder()
	let found = false

	let readStream = async (resolve: () => void) => {
		while (true) {
			let { done, value } = await reader.read()
			if (done) break

			let chunk = decoder.decode(value, { stream: true })
			if (!found && chunk.includes(marker)) {
				found = true
				resolve()
			}
		}
	}
	return new Promise<void>(readStream)
}
