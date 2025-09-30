import { type ReactNode, useState } from "react"
import { T, useIntl } from "#shared/intl/setup"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "#shared/ui/button"
import { Alert, AlertDescription } from "#shared/ui/alert"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shared/ui/card"
import { TypographyMuted } from "#shared/ui/typography"
import { QuestionCircle } from "react-bootstrap-icons"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import {
	userQuestionExecute,
	userQuestionTool,
} from "#shared/tools/user-question"
import type { InferUITool } from "ai"

export { UserQuestionConfirmation, UserQuestionResult }

type UserQuestionToolUI = InferUITool<typeof userQuestionTool>

function UserQuestionConfirmation({
	part,
	addToolResult,
}: {
	part: {
		toolCallId: string
		input: UserQuestionToolUI["input"]
		state: "input-available"
	}
	addToolResult: Function
}) {
	let [isResponding, setIsResponding] = useState(false)
	let t = useIntl()

	let form = useForm({
		resolver: zodResolver(
			z.object({
				selectedValue: z.string().min(1, t("tool.userQuestion.selectOption")),
			}),
		),
		defaultValues: { selectedValue: "" },
	})

	let handleAnswer = async (answer: boolean | string, answerLabel?: string) => {
		setIsResponding(true)
		try {
			let result = await userQuestionExecute(part.input, answer, answerLabel)
			addToolResult({
				tool: "userQuestion",
				toolCallId: part.toolCallId,
				output: result,
			})
		} catch (error) {
			addToolResult({
				tool: "userQuestion",
				toolCallId: part.toolCallId,
				output: {
					error:
						error instanceof Error
							? error.message
							: t("tool.userQuestion.failedToProcess"),
				},
			})
		} finally {
			setIsResponding(false)
		}
	}

	let handleSubmitForm = (data: { selectedValue: string }) => {
		let selectedOption = part.input.options?.find(
			opt => opt.value === data.selectedValue,
		)
		handleAnswer(data.selectedValue, selectedOption?.label)
	}

	let handleCancel = () => {
		addToolResult({
			tool: "userQuestion",
			toolCallId: part.toolCallId,
			output: {
				cancelled: true,
				reason: t("tool.userQuestion.cancelled"),
			},
		})
	}

	let isYesNo = !part.input.options
	let hasOptions = part.input.options && part.input.options.length > 0

	return (
		<Card className="border-primary">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 font-medium">
					<QuestionCircle className="h-4 w-4" />
					Question
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TypographyMuted className="text-foreground text-base font-medium">
					{part.input.question}
				</TypographyMuted>
			</CardContent>
			{hasOptions && (
				<CardContent className="pt-0">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmitForm)}>
							<FormField
								control={form.control}
								name="selectedValue"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={t(
															"tool.userQuestion.selectPlaceholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{part.input.options!.map(option => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</CardContent>
			)}
			<CardFooter className="flex justify-end gap-3">
				{isYesNo ? (
					<div className="flex w-full gap-3 md:justify-end">
						<Button
							variant="secondary"
							onClick={() => handleAnswer(false)}
							disabled={isResponding}
							className="flex-1 md:flex-none"
						>
							<T k="tool.userQuestion.no" />
						</Button>
						<Button
							variant="default"
							onClick={() => handleAnswer(true)}
							disabled={isResponding}
							className="flex-1 md:flex-none"
						>
							<T k="tool.userQuestion.yes" />
						</Button>
					</div>
				) : hasOptions ? (
					<div className="flex w-full gap-3 md:justify-end">
						<Button
							variant="secondary"
							onClick={handleCancel}
							disabled={isResponding}
							className="flex-1 md:flex-none"
						>
							<T k="tool.userQuestion.cancel" />
						</Button>
						<Button
							type="button"
							variant="default"
							onClick={form.handleSubmit(handleSubmitForm)}
							disabled={isResponding || !form.watch("selectedValue")}
							className="flex-1 md:flex-none"
						>
							<T k="tool.userQuestion.submit" />
						</Button>
					</div>
				) : (
					<Button
						variant="secondary"
						onClick={handleCancel}
						disabled={isResponding}
					>
						Cancel
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

function UserQuestionResult({
	result,
}: {
	result: UserQuestionToolUI["output"]
}) {
	let t = useIntl()
	if ("error" in result) {
		return (
			<ToolMessageWrapper>
				❌ {typeof result.error === "string" ? result.error : result.error}
			</ToolMessageWrapper>
		)
	}

	if ("cancelled" in result) {
		return (
			<ToolMessageWrapper>
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
		<ToolMessageWrapper>
			<div className="space-y-1">
				<div className="text-muted-foreground text-sm">
					Q: {result.question}
				</div>
				<div className="font-medium">A: {answerDisplay}</div>
			</div>
		</ToolMessageWrapper>
	)
}

function ToolMessageWrapper({ children }: { children: ReactNode }) {
	return (
		<Alert>
			<QuestionCircle className="h-4 w-4" />
			<AlertDescription className="text-sm">{children}</AlertDescription>
		</Alert>
	)
}
