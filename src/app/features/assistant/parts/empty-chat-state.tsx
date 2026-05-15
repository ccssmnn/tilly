import { useRef } from "react"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { nanoid } from "nanoid"
import { Button } from "#shared/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "#shared/ui/input-group"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { TypographyH2, TypographyMuted } from "#shared/ui/typography"
import { Send, Pause, Arrow90degUp } from "react-bootstrap-icons"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useIntl } from "#shared/intl/setup"
import { T } from "#shared/intl/setup"
import type { AssistantAccount } from "../lib/data"
import type { StarterPrompt } from "../hooks/use-starter-prompts"
import type { TillyUIMessage } from "#shared/tools/tools"

export { EmptyChatState }

function EmptyChatState({
	me,
	starters,
	onSubmit,
	isOnline,
	isBusy,
	abort,
}: {
	me: AssistantAccount
	starters: StarterPrompt[]
	onSubmit: (message: TillyUIMessage) => void
	isOnline: boolean
	isBusy: boolean
	abort?: () => void
}) {
	let t = useIntl()

	let form = useForm({
		resolver: zodResolver(z.object({ prompt: z.string() })),
		defaultValues: { prompt: "" },
	})

	let promptValue = useWatch({
		control: form.control,
		name: "prompt",
		defaultValue: "",
	})

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

		onSubmit(newMessage)
		form.reset()
	}

	function submitOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== "Enter") return
		let hasPhysicalKeyboard = window.matchMedia(
			"(hover: hover) and (pointer: fine)",
		).matches
		if (event.shiftKey || !hasPhysicalKeyboard) return

		event.preventDefault()

		if (!promptValue.trim()) return
		if (form.formState.isSubmitting) return

		form.handleSubmit(handleSubmit)()
		textareaRef.current?.blur()
	}

	function prefillStarter(text: string) {
		form.setValue("prompt", text)
		textareaRef.current?.focus()
	}

	return (
		<div className="flex flex-col items-center gap-6 py-12 text-center">
			<div className="space-y-4">
				<Avatar className="mx-auto size-20 rounded-3xl after:rounded-3xl">
					<AvatarImage
						src="/app/icons/icon-192x192.png"
						alt="Tilly"
						className="rounded-3xl"
					/>
					<AvatarFallback>T</AvatarFallback>
				</Avatar>
				<div className="space-y-2">
					<TypographyH2>
						<T k="assistant.emptyState.welcome" />
					</TypographyH2>
					<TypographyMuted className="max-w-md">
						<T k="assistant.emptyState.description" />
					</TypographyMuted>
				</div>
			</div>

			<div className="w-full max-w-xl">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<p id="assistant-empty-input-hint" className="sr-only">
							<T k="assistant.input.hint" />
						</p>
						<FormField
							control={form.control}
							name="prompt"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<InputGroup className="h-auto rounded-3xl">
											<InputGroupTextarea
												placeholder={
													!isOnline
														? t("assistant.placeholder.offline")
														: t("assistant.placeholder.initial")
												}
												rows={2}
												maxHeight={240}
												className="min-h-20 max-w-full overflow-x-hidden overflow-y-auto text-base md:text-sm"
												aria-describedby="assistant-empty-input-hint"
												disabled={!isOnline || isBusy}
												{...field}
												onKeyDown={submitOnEnter}
												ref={(r: HTMLTextAreaElement | null) => {
													textareaRef.current = r
													autoFocusRef.current = r
													field.ref(r)
												}}
											/>
											<InputGroupAddon
												align="block-end"
												className="justify-end"
											>
												{abort ? (
													<InputGroupButton
														type="button"
														variant="destructive"
														onClick={abort}
														size="icon-sm"
														className="focus-visible:ring-ring size-11 rounded-3xl focus-visible:ring-2 focus-visible:ring-offset-2"
														aria-label={t("assistant.input.stopGenerating")}
														title={t("assistant.input.stopGenerating")}
													>
														<Pause />
													</InputGroupButton>
												) : (
													<InputGroupButton
														type="submit"
														size="sm"
														className="focus-visible:ring-ring rounded-3xl focus-visible:ring-2 focus-visible:ring-offset-2"
														disabled={!isOnline || isBusy}
														variant="default"
													>
														<Send />
														<span className="max-md:sr-only">
															<T k="assistant.input.send.short" />
														</span>
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
			<div className="flex w-full max-w-xl flex-col gap-2">
				{starters.slice(0, 3).map(starter => (
					<Button
						key={starter.key}
						type="button"
						variant="ghost"
						className="h-auto min-h-11 min-w-0 justify-start text-left text-wrap whitespace-normal"
						onClick={() => prefillStarter(starter.text)}
						disabled={!isOnline || isBusy}
					>
						<Arrow90degUp className="shrink-0" />
						<span className="wrap-break-words min-w-0">{starter.text}</span>
					</Button>
				))}
			</div>
		</div>
	)
}
