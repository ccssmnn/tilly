import { z } from "zod"
import { defineTool } from "#shared/tools/define-tool"

export { userQuestionTool, userQuestionExecute }

let userQuestionInput = z.object({
	question: z.string().describe("The question to ask the user"),
	options: z
		.array(
			z.object({
				value: z
					.string()
					.describe("The value to return when this option is selected"),
				label: z.string().describe("The human-readable label for this option"),
			}),
		)
		.optional()
		.describe(
			"Multiple choice options. If not provided, presents a yes/no question.",
		),
})

let userQuestionOutput = z.object({
	question: z.string(),
	answer: z.union([z.boolean(), z.string()]),
	answerLabel: z.string().optional(),
	answeredAt: z.string(),
})

let userQuestionTool = defineTool({
	description:
		"Ask the user a question and wait for their response. Can be a yes/no question or multiple choice.",
	input: userQuestionInput,
	output: userQuestionOutput,
	cancellable: true,
})

async function userQuestionExecute(
	input: z.infer<typeof userQuestionInput>,
	answer: boolean | string,
	answerLabel?: string,
): Promise<z.infer<typeof userQuestionOutput>> {
	return {
		question: input.question,
		answer,
		answerLabel,
		answeredAt: new Date().toISOString(),
	}
}
