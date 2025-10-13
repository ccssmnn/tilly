import { useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "#shared/ui/button"
import { Textarea } from "#shared/ui/textarea"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"

import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { T } from "#shared/intl/setup"

export { TextMessageDialog }

type TextMessageDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (message: string) => void
	disabled?: boolean
	placeholder?: string
}

function TextMessageDialog({
	open,
	onOpenChange,
	onSubmit,
	disabled = false,
	placeholder,
}: TextMessageDialogProps) {
	let textareaRef = useRef<HTMLTextAreaElement>(null)
	let autoFocusRef = useAutoFocusInput()

	let form = useForm({
		resolver: zodResolver(z.object({ prompt: z.string() })),
		defaultValues: { prompt: "" },
	})

	function handleSubmit(data: { prompt: string }) {
		if (!data.prompt.trim()) return

		onSubmit(data.prompt)
		form.setValue("prompt", "")
		onOpenChange(false)

		if (textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = ""
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key !== "Enter") return

		let shouldSubmit = e.metaKey || e.ctrlKey || e.shiftKey
		if (!shouldSubmit) return

		e.preventDefault()

		if (!form.formState.isSubmitting && form.getValues("prompt").trim()) {
			form.handleSubmit(handleSubmit)()
			textareaRef.current?.blur()
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>
								<T k="assistant.newMessage.title" />
							</DialogTitle>
						</DialogHeader>
					}
				>
					<Form {...form}>
						<form
							onSubmit={e => {
								e.preventDefault()
								form.handleSubmit(handleSubmit)()
							}}
						>
							<div className="flex gap-3">
								<FormField
									control={form.control}
									name="prompt"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Textarea
													placeholder={placeholder}
													rows={1}
													className="max-h-[9rem] min-h-10 resize-none overflow-y-auto rounded-lg"
													style={{ height: "auto" }}
													autoResize={false}
													disabled={disabled}
													onInput={e => {
														let target = e.target as HTMLTextAreaElement
														target.style.height = "auto"
														let scrollHeight = target.scrollHeight
														let maxHeight = 2.5 * 6 // 6 rows * 2.5rem per row
														target.style.height =
															Math.min(scrollHeight, maxHeight * 16) + "px" // 16px = 1rem
													}}
													onKeyDown={handleKeyDown}
													{...field}
													ref={r => {
														textareaRef.current = r
														autoFocusRef.current = r
														field.ref(r)
													}}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex flex-col justify-end">
									<Button
										type="submit"
										disabled={disabled || !form.formState.isValid}
										className="h-10"
									>
										<T k="assistant.newMessage.send" />
									</Button>
								</div>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	)
}
