// Polyfill navigator for test environment (used in UserAccount migration)
if (typeof navigator === "undefined") {
	// @ts-expect-error - polyfill for test environment
	globalThis.navigator = {
		language: "en-US",
	}
}

// Setup Jazz test sync globally (must be called before any test account creation)
import { setupJazzTestSync } from "jazz-tools/testing"
await setupJazzTestSync()
