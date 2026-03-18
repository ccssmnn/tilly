import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/only-router-may-import-handlers.js"

ruleTester.run("only-router-may-import-handlers", rule, {
	valid: [
		{
			// router (outside features) imports handler
			code: `import { pushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/main.ts",
		},
		{
			// non-handler import from within feature
			code: `import { db } from "#server/lib/db"`,
			filename: "/project/src/server/features/push/parts/send-notification.ts",
		},
		{
			// type-only import of handler is fine
			code: `import type { PushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/features/push/parts/send-notification.ts",
		},
		{
			// feature index re-exports handler
			code: `import { pushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/features/push/index.ts",
		},
	],
	invalid: [
		{
			// part imports handler
			code: `import { pushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/features/push/parts/send-notification.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// lib imports handler
			code: `import { pushHandler } from "#server/features/push/handlers/push-handler"`,
			filename: "/project/src/server/features/push/lib/utils.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// handler imports another handler (same feature)
			code: `import { otherHandler } from "./other-handler"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
