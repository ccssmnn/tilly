import { useState } from "react"
import { T, useIntl } from "#shared/intl/setup"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "#shared/ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shared/ui/card"
import { TypographyMuted } from "#shared/ui/typography"
import { HugeiconsIcon } from "@hugeicons/react"
import { QuestionIcon } from "@hugeicons/core-free-icons"
import { RadioGroup, RadioGroupItem } from "#shared/ui/radio-group"
import { Label } from "#shared/ui/label"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import {
	userQuestionExecute,
	userQuestionTool,
} from "#shared/tools/user-question"
import type { AddToolResultFunction } from "#shared/tools/tools"
import type { InferUITool } from "ai"

export { UserQuestionConfirmation }

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
	addToolResult: AddToolResultFunction
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

	let selectedValue = useWatch({
		control: form.control,
		name: "selectedValue",
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
					<HugeiconsIcon icon={QuestionIcon} className="h-4 w-4" />
					<T k="tool.userQuestion.title" />
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
											<RadioGroup
												value={field.value}
												onValueChange={field.onChange}
											>
												{part.input.options!.map(option => (
													<div
														key={option.value}
														className="flex items-start gap-3"
													>
														<RadioGroupItem
															value={option.value}
															id={option.value}
														/>
														<Label
															htmlFor={option.value}
															className="leading-normal font-normal"
														>
															{option.label}
														</Label>
													</div>
												))}
											</RadioGroup>
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
							disabled={isResponding || !selectedValue}
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
						<T k="tool.userQuestion.cancel" />
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
