import { useIntl } from "#shared/intl/setup"
import {
	ToolMessageSummary,
	ToolMessageWrapper,
} from "#shared/ui/tool-message-wrapper"
import { QuestionIcon } from "@hugeicons/core-free-icons"
import { userQuestionTool } from "#shared/tools/user-question"
import type { InferUITool } from "ai"

export { UserQuestionResult }

type UserQuestionToolUI = InferUITool<typeof userQuestionTool>

function UserQuestionResult({
	result,
}: {
	result: UserQuestionToolUI["output"]
}) {
	let t = useIntl()

	if ("error" in result) {
		return (
			<ToolMessageWrapper icon={QuestionIcon}>
				❌ {typeof result.error === "string" ? result.error : result.error}
			</ToolMessageWrapper>
		)
	}

	if ("cancelled" in result) {
		return (
			<ToolMessageWrapper icon={QuestionIcon}>
				<span className="text-muted-foreground">🚫 {result.reason}</span>
			</ToolMessageWrapper>
		)
	}

	let answerDisplay =
		typeof result.answer === "boolean"
			? result.answer
				? t("tool.userQuestion.yes")
				: t("tool.userQuestion.no")
			: result.answerLabel || result.answer

	return (
		<ToolMessageSummary icon={QuestionIcon}>
			<span>
				{t("tool.userQuestion.result.questionLabel")} {result.question} -{" "}
				<span className="text-foreground font-medium">
					{t("tool.userQuestion.result.answerLabel")} {answerDisplay}
				</span>
			</span>
		</ToolMessageSummary>
	)
}
