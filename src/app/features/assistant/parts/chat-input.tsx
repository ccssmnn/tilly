import { useRef } from "react"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { nanoid } from "nanoid"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "#shared/ui/input-group"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import { Send, Pause } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useInputFocusState } from "#app/hooks/use-input-focus-state"
import { cn } from "#app/lib/utils"
import type { LoadedAssistantAccount } from "../lib/data"
import type { TillyUIMessage } from "#shared/tools/tools"

export { ChatInput }

function ChatInput(props: {
	me: LoadedAssistantAccount
	onSubmit: (message: TillyUIMessage) => void
	chatSize: number
	stopGeneratingResponse?: () => void
	placeholder: string
	disabled?: boolean
}) {
	let me = props.me
	let form = useForm({
		resolver: zodResolver(z.object({ prompt: z.string() })),
		defaultValues: { prompt: "" },
	})

	let promptValue = useWatch({
		control: form.control,
		name: "prompt",
		defaultValue: "",
	})

	let inputFocused = useInputFocusState()
	let autoFocusRef = useAutoFocusInput()

	let textareaRef = useRef<HTMLTextAreaElement>(null)

	function handleSubmit(data: { prompt: string }) {
		if (!me.$isLoaded) return
		if (!data.prompt.trim()) return

		let metadata = {
			userName: me.profile?.name || "Anonymous",
			timezone: me.root.notificationSettings?.timezone || "UTC",
			locale: me.root.language || "en",
			// eslint-disable-next-line react-hooks/purity
			timestamp: Date.now(),
		}

		let newMessage: TillyUIMessage = {
			id: nanoid(),
			role: "user",
			parts: [{ type: "text", text: data.prompt }],
			metadata,
		}

		props.onSubmit(newMessage)
		form.reset()
	}

	function submitOnKeyCtrlEnter(
		event: React.KeyboardEvent<HTMLTextAreaElement>,
	) {
		if (event.key !== "Enter") return

		let shouldSubmit = event.metaKey || event.ctrlKey || event.shiftKey
		if (!shouldSubmit) return

		if (!promptValue.trim()) return
		if (form.formState.isSubmitting) return

		event.preventDefault()

		form.handleSubmit(handleSubmit)()
		textareaRef.current?.blur()
	}

	return (
		<div
			className={cn(
				"bg-background/50 border-border fixed z-1 rounded-4xl border p-2 backdrop-blur-xl transition-[bottom,background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none max-md:inset-x-3 md:bottom-3 md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2",
				inputFocused && "bg-background bottom-1",
				!inputFocused &&
					"bottom-[calc(max(calc(var(--spacing)*3),calc(env(safe-area-inset-bottom)-var(--spacing)*4))+var(--spacing)*19)]",
			)}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<p id="assistant-chat-input-hint" className="sr-only">
						Press Cmd, Ctrl, or Shift plus Enter to send.
					</p>
					<FormField
						control={form.control}
						name="prompt"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<InputGroup className="h-auto border-0 bg-transparent shadow-none">
										<InputGroupTextarea
											placeholder={props.placeholder}
											rows={1}
											maxHeight={240}
											className="max-h-36 min-h-11 overflow-y-auto text-base md:text-sm"
											aria-describedby="assistant-chat-input-hint"
											disabled={props.disabled}
											{...field}
											onKeyDown={submitOnKeyCtrlEnter}
											ref={(r: HTMLTextAreaElement | null) => {
												textareaRef.current = r
												autoFocusRef.current = r
												field.ref(r)
											}}
										/>
										<InputGroupAddon align="block-end" className="justify-end">
											{props.stopGeneratingResponse ? (
												<InputGroupButton
													type="button"
													variant="destructive"
													onClick={props.stopGeneratingResponse}
													size="icon-sm"
													aria-label="Stop response generation"
													title="Stop response generation"
												>
													<Pause />
												</InputGroupButton>
											) : (
												<InputGroupButton
													type="submit"
													size="icon-sm"
													disabled={props.disabled}
													aria-label="Send message"
													variant="default"
													title="Send message"
												>
													<Send />
												</InputGroupButton>
											)}
										</InputGroupAddon>
									</InputGroup>
								</FormControl>
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	)
}
