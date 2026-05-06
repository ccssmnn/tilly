// Polyfill navigator.language for test environment (used in UserAccount migration)
if (typeof navigator === "undefined") {
	// @ts-expect-error - polyfill for test environment
	globalThis.navigator = {
		language: "en-US",
	}
} else if (typeof navigator.language === "undefined") {
	Object.defineProperty(navigator, "language", {
		value: "en-US",
		configurable: true,
	})
}

// Setup Jazz test sync globally (must be called before any test account creation)
import { setupJazzTestSync } from "jazz-tools/testing"
await setupJazzTestSync()
