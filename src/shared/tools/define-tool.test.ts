import { describe, expect, test } from "vitest"
import { z } from "zod"
import {
	defineTool,
	operationSchema,
	deletedSchema,
	mutationSchema,
	type Worker,
} from "#shared/tools/define-tool"

let stubWorker = undefined as unknown as Worker

describe("defineTool — server tool", () => {
	let buildEcho = () =>
		defineTool({
			description: "echo",
			input: z.object({ value: z.string() }),
			output: z.object({ echoed: z.string() }),
			serverOp: async (_worker, input) => ({ echoed: input.value }),
		})

	test("returns a worker-bound factory with execute", () => {
		let tool = buildEcho()(stubWorker)
		expect(typeof tool.execute).toBe("function")
	})

	test("execute passes success through", async () => {
		let tool = buildEcho()(stubWorker)
		let out = await tool.execute!({ value: "hi" }, fakeOptions())
		expect(out).toEqual({ echoed: "hi" })
	})

	test("execute wraps thrown errors as { error }", async () => {
		let tool = defineTool({
			description: "boom",
			input: z.object({}),
			output: z.object({ ok: z.boolean() }),
			serverOp: async () => {
				throw new Error("kaboom")
			},
		})(stubWorker)
		let out = await tool.execute!({}, fakeOptions())
		expect(out).toEqual({ error: "kaboom" })
	})

	test("output schema unions error branch with success", () => {
		let tool = buildEcho()(stubWorker)
		let schema = tool.outputSchema as unknown as z.ZodType
		expect(schema.safeParse({ error: "nope" }).success).toBe(true)
	})
})

describe("defineTool — client tool", () => {
	test("omitting serverOp yields a tool without execute", () => {
		let clientTool = defineTool({
			description: "client-side",
			input: z.object({ q: z.string() }),
			output: z.object({ a: z.string() }),
		})
		expect(clientTool.execute).toBeUndefined()
	})

	test("cancellable adds the cancelled branch", () => {
		let clientTool = defineTool({
			description: "ask",
			input: z.object({ q: z.string() }),
			output: z.object({ answer: z.string() }),
			cancellable: true,
		})
		let schema = clientTool.outputSchema as unknown as z.ZodType
		expect(
			schema.safeParse({ cancelled: true, reason: "user closed" }).success,
		).toBe(true)
	})

	test("non-cancellable rejects cancelled output", () => {
		let clientTool = defineTool({
			description: "no-cancel",
			input: z.object({}),
			output: z.object({ ok: z.boolean() }),
		})
		let schema = clientTool.outputSchema as unknown as z.ZodType
		expect(schema.safeParse({ cancelled: true, reason: "x" }).success).toBe(
			false,
		)
	})
})

describe("operationSchema / deletedSchema", () => {
	let current = z.object({ id: z.string(), name: z.string() })

	test("operationSchema accepts create with current", () => {
		let parsed = operationSchema(current).safeParse({
			operation: "create",
			current: { id: "1", name: "Ada" },
		})
		expect(parsed.success).toBe(true)
	})

	test("operationSchema accepts update with current + previous", () => {
		let parsed = operationSchema(current).safeParse({
			operation: "update",
			current: { id: "1", name: "Ada" },
			previous: { id: "1", name: "Adelaide" },
		})
		expect(parsed.success).toBe(true)
	})

	test("deletedSchema accepts delete with previous only", () => {
		let parsed = deletedSchema(current).safeParse({
			operation: "delete",
			previous: { id: "1", name: "Ada" },
		})
		expect(parsed.success).toBe(true)
	})

	test("mutationSchema accepts all three operations", () => {
		let schema = mutationSchema(current)
		expect(
			schema.safeParse({
				operation: "create",
				current: { id: "1", name: "x" },
			}).success,
		).toBe(true)
		expect(
			schema.safeParse({
				operation: "update",
				current: { id: "1", name: "x" },
				previous: { id: "1", name: "y" },
			}).success,
		).toBe(true)
		expect(
			schema.safeParse({
				operation: "delete",
				previous: { id: "1", name: "x" },
			}).success,
		).toBe(true)
	})
})

function fakeOptions() {
	return {
		toolCallId: "test",
		messages: [],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any
}
