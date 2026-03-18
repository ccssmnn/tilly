import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/only-handlers-may-import-operations.js"

ruleTester.run("only-handlers-may-import-operations", rule, {
	valid: [
		{
			// handler imports operation — same feature
			code: `import { sendPush } from "#server/features/push/operations/send-push"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// handler imports operation via relative path
			code: `import { sendPush } from "../operations/send-push"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// feature index re-exports operation
			code: `import { sendPush } from "#server/features/push/operations/send-push"`,
			filename: "/project/src/server/features/push/index.ts",
		},
		{
			// non-operation import from anywhere
			code: `import { db } from "#server/lib/db"`,
			filename: "/project/src/server/features/push/operations/send-push.ts",
		},
		{
			// type-only import of operation is fine
			code: `import type { PushPayload } from "#server/features/push/operations/send-push"`,
			filename: "/project/src/server/features/push/parts/format-payload.ts",
		},
	],
	invalid: [
		{
			// operation imports another operation — flat tree violation
			code: `import { validateToken } from "./validate-token"`,
			filename:
				"/project/src/server/features/push/operations/send-push.ts",
			errors: [{ messageId: "operationChain" }],
		},
		{
			// operation imports operation via alias
			code: `import { validateToken } from "#server/features/push/operations/validate-token"`,
			filename:
				"/project/src/server/features/push/operations/send-push.ts",
			errors: [{ messageId: "operationChain" }],
		},
		{
			// part imports operation
			code: `import { sendPush } from "#server/features/push/operations/send-push"`,
			filename:
				"/project/src/server/features/push/parts/format-payload.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// lib imports operation
			code: `import { sendPush } from "#server/features/push/operations/send-push"`,
			filename: "/project/src/server/features/push/lib/utils.ts",
			errors: [{ messageId: "forbidden" }],
		},
		{
			// handler from another feature imports operation directly (cross-feature)
			code: `import { sendPush } from "#server/features/push/operations/send-push"`,
			filename:
				"/project/src/server/features/chat/handlers/chat-handler.ts",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
