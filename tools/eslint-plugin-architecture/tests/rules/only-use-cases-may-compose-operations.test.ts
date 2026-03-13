import { ruleTester } from "../rule-tester.js"
import rule from "../../src/rules/only-use-cases-may-compose-operations.js"

ruleTester.run("only-use-cases-may-compose-operations", rule, {
	valid: [
		{
			// use-case imports operation
			code: `import { createToken } from "#server/features/push/operations/create-token"`,
			filename: "/project/src/server/features/push/use-cases/send-push.ts",
		},
		{
			// handler imports use-case (not operation)
			code: `import { sendPush } from "#server/features/push/use-cases/send-push"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
		{
			// non-operation import from handler
			code: `import { db } from "#server/lib/db"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
		},
	],
	invalid: [
		{
			// operation imports another operation
			code: `import { validate } from "#server/features/push/operations/validate-token"`,
			filename: "/project/src/server/features/push/operations/create-token.ts",
			errors: [{ messageId: "operationChain" }],
		},
		{
			// handler directly imports operation
			code: `import { createToken } from "#server/features/push/operations/create-token"`,
			filename: "/project/src/server/features/push/handlers/push-handler.ts",
			errors: [{ messageId: "forbidden" }],
		},
	],
})
