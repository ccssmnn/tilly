import { tool, type InferUITool } from "ai"
import { z } from "zod"

export { userQuestionTool, userQuestionExecute }
export type { QuestionOption, UserQuestionResult }

type QuestionOption = {
	value: string
	label: string
}

type UserQuestionResult = {
	question: string
	answer: boolean | string
	answerLabel?: string
	answeredAt: string
}

let userQuestionTool = tool({
	description:
		"Ask the user a question and wait for their response. Can be a yes/no question or multiple choice.",
	inputSchema: z.object({
		question: z.string().describe("The question to ask the user"),
		options: z
			.array(
				z.object({
					value: z
						.string()
						.describe("The value to return when this option is selected"),
					label: z
						.string()
						.describe("The human-readable label for this option"),
				}),
			)
			.optional()
			.describe(
				"Multiple choice options. If not provided, presents a yes/no question.",
			),
	}),
	outputSchema: z.union([
		z.object({
			error: z.string(),
		}),
		z.object({
			cancelled: z.literal(true),
			reason: z.string(),
		}),
		z.object({
			question: z.string(),
			answer: z.union([z.boolean(), z.string()]),
			answerLabel: z.string().optional(),
			answeredAt: z.string(),
		}),
	]),
})

type _UserQuestionTool = InferUITool<typeof userQuestionTool>

async function userQuestionExecute(
	input: _UserQuestionTool["input"],
	answer: boolean | string,
	answerLabel?: string,
): Promise<_UserQuestionTool["output"]> {
	return {
		question: input.question,
		answer,
		answerLabel,
		answeredAt: new Date().toISOString(),
	}
}
