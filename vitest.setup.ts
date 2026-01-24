// Polyfill navigator for test environment (used in UserAccount migration)
if (typeof navigator === "undefined") {
	// @ts-expect-error - polyfill for test environment
	globalThis.navigator = {
		language: "en-US",
	}
}
