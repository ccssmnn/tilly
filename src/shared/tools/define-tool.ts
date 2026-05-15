/* eslint-disable no-redeclare */
import { tool, type Tool } from "ai"
import { z, type ZodType } from "zod"
import type { Loaded } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"
import { tryCatch } from "#shared/lib/trycatch"

export {
	defineTool,
	createdSchema,
	updatedSchema,
	deletedSchema,
	operationSchema,
	mutationSchema,
}

export type { Created, Updated, Worker }

type Worker = Loaded<typeof UserAccount>

type Created<T> = { operation: "create"; current: T }
type Updated<T> = { operation: "update"; current: T; previous: T }

type Cancelled = { cancelled: true; reason: string }
type ToolError = { error: string }

type WrappedOutput<TOut, Cancellable extends boolean> = Cancellable extends true
	? TOut | ToolError | Cancelled
	: TOut | ToolError

function createdSchema<T extends ZodType>(current: T) {
	return z.object({
		operation: z.literal("create"),
		current,
	})
}

function updatedSchema<T extends ZodType>(current: T) {
	return z.object({
		operation: z.literal("update"),
		current,
		previous: current,
	})
}

function operationSchema<T extends ZodType>(current: T) {
	return z.union([createdSchema(current), updatedSchema(current)])
}

function deletedSchema<T extends ZodType>(current: T) {
	return z.object({
		operation: z.literal("delete"),
		previous: current,
	})
}

function mutationSchema<T extends ZodType>(current: T) {
	return z.union([operationSchema(current), deletedSchema(current)])
}

function defineTool<
	TInput extends ZodType,
	TOutput extends ZodType,
	Cancellable extends boolean = false,
>(args: {
	description: string
	input: TInput
	output: TOutput
	serverOp: (
		worker: Worker,
		input: z.infer<TInput>,
	) => Promise<z.infer<TOutput>>
	cancellable?: Cancellable
}): (
	worker: Worker,
) => Tool<z.infer<TInput>, WrappedOutput<z.infer<TOutput>, Cancellable>>

function defineTool<
	TInput extends ZodType,
	TOutput extends ZodType,
	Cancellable extends boolean = false,
>(args: {
	description: string
	input: TInput
	output: TOutput
	serverOp?: undefined
	cancellable?: Cancellable
}): Tool<z.infer<TInput>, WrappedOutput<z.infer<TOutput>, Cancellable>>

function defineTool<TInput extends ZodType, TOutput extends ZodType>(args: {
	description: string
	input: TInput
	output: TOutput
	serverOp?: (
		worker: Worker,
		input: z.infer<TInput>,
	) => Promise<z.infer<TOutput>>
	cancellable?: boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
	let outputSchema = wrapOutputSchema(args.output, args.cancellable ?? false)

	if (!args.serverOp) {
		return tool({
			description: args.description,
			inputSchema: args.input,
			outputSchema,
		})
	}

	let serverOp = args.serverOp
	return (worker: Worker) =>
		tool({
			description: args.description,
			inputSchema: args.input,
			outputSchema,
			execute: async (input: z.infer<TInput>) => {
				let res = await tryCatch(serverOp(worker, input))
				if (!res.ok) return { error: errorMessage(res.error) }
				return res.data
			},
		})
}

function wrapOutputSchema(success: ZodType, cancellable: boolean) {
	let errorBranch = z.object({ error: z.string() })
	if (cancellable) {
		let cancelledBranch = z.object({
			cancelled: z.literal(true),
			reason: z.string(),
		})
		return z.union([errorBranch, cancelledBranch, success])
	}
	return z.union([errorBranch, success])
}

function errorMessage(error: unknown): string {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return String(error)
}
