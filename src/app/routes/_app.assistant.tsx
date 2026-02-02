import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "#shared/ui/button"
import { Textarea, useResizeTextarea } from "#shared/ui/textarea"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import { Assistant, UserAccount } from "#shared/schema/user"
import { co, z as zz, type ResolveQuery } from "jazz-tools"
import { useAccount } from "jazz-tools/react"
import {
	Send,
	Pause,
	WifiOff,
	InfoCircleFill,
	Arrow90degUp,
} from "react-bootstrap-icons"
import {
	TypographyH1,
	TypographyH2,
	TypographyMuted,
} from "#shared/ui/typography"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useInputFocusState } from "#app/hooks/use-input-focus-state"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { cn } from "#app/lib/utils"
import { type TillyUIMessage } from "#shared/tools/tools"
import { MessageRenderer } from "#app/features/assistant-message-components"
import { ScrollIntoView } from "#app/components/scroll-into-view"
import { T, useIntl } from "#shared/intl/setup"
import { useHasPlusAccess } from "#app/features/plus"
import { useStarterPrompts } from "#app/features/personalized-prompts"
import { nanoid } from "nanoid"

export let Route = createFileRoute("/_app/assistant")({
	loader: async ({ context }) => {
		let loadedMe = await context.me.$jazz.ensureLoaded({ resolve })
		if (!loadedMe.$isLoaded) throw notFound()
		let initialMessages =
			loadedMe.root.assistant?.stringifiedMessages
				.values()
				.map(s => JSON.parse(s) as TillyUIMessage) ?? []
		return { me: loadedMe, initialMessages }
	},
	component: AssistantScreen,
})

let resolve = {
	profile: true,
	root: {
		people: {
			$each: {
				reminders: { $each: true },
			},
		},
		assistant: { stringifiedMessages: true },
		notificationSettings: true,
	},
} as const satisfies ResolveQuery<typeof UserAccount>

function AssistantScreen() {
	let { hasPlusAccess, isLoading } = useHasPlusAccess()

	if (isLoading) {
		return (
			<AssistantLayout hideTitle>
				<AssistantLoading />
			</AssistantLayout>
		)
	}

	if (!hasPlusAccess) {
		return (
			<AssistantLayout hideTitle>
				<SubscribePrompt />
			</AssistantLayout>
		)
	}

	return <AuthenticatedChat />
}

function AssistantLayout({
	children,
	hideTitle = false,
}: {
	children: ReactNode
	hideTitle?: boolean
}) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("assistant.pageTitle")}</title>
			{!hideTitle && (
				<TypographyH1>
					<T k="assistant.title" />
				</TypographyH1>
			)}
			{children}
		</div>
	)
}

function AssistantLoading() {
	return (
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] items-center justify-center md:min-h-[calc(100dvh-6rem)]">
			<TypographyMuted>
				<T k="assistant.subscribe.loading" />
			</TypographyMuted>
		</div>
	)
}

function SubscribePrompt() {
	return (
		<Empty className="min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-6rem)]">
			<EmptyHeader>
				<EmptyMedia>
					<Avatar className="size-20">
						<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly" />
						<AvatarFallback>T</AvatarFallback>
					</Avatar>
				</EmptyMedia>
				<EmptyTitle>
					<T k="assistant.subscribe.title" />
				</EmptyTitle>
				<EmptyDescription>
					<T k="assistant.subscribe.description" />
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button asChild>
					<Link to="/settings">
						<T k="assistant.subscribe.settings" />
					</Link>
				</Button>
			</EmptyContent>
		</Empty>
	)
}

function AuthenticatedChat() {
	let t = useIntl()
	let data = Route.useLoaderData()

	let subscribedMe = useAccount(UserAccount, { resolve })
	let me = subscribedMe.$isLoaded ? subscribedMe : data.me
	let assistant = me.root.assistant

	let isOnline = useOnlineStatus()

	let messages = useMemo(
		() =>
			assistant?.stringifiedMessages?.map(
				s => JSON.parse(s) as TillyUIMessage,
			) ?? [],
		[assistant?.stringifiedMessages],
	)

	let { isSending, failedToSend, sendMessage, abort } = useChatMessaging(me)

	useStaleGenerationTimeout(assistant)
	useSetupNotificationAcknowledgment(assistant)

	let isGenerating = !!assistant?.submittedAt
	let isBusy = isSending || isGenerating

	let isEmpty = messages.length === 0

	return (
		<AssistantLayout hideTitle={isEmpty}>
			<div className="space-y-4">
				{!isOnline && <OfflineAlert />}

				{isEmpty ? (
					<EmptyChatState
						onSubmit={sendMessage}
						isOnline={isOnline}
						isBusy={isBusy}
						abort={isBusy ? abort : undefined}
					/>
				) : (
					<>
						{messages.map(message => (
							<MessageRenderer
								key={message.id}
								message={message}
								addToolResult={createAddToolResult(messages, sendMessage)}
							/>
						))}

						{isSending ? (
							<LoadingIndicator state="sending" />
						) : isGenerating ? (
							<LoadingIndicator state="generating" />
						) : null}

						<SendingError error={failedToSend} />
						<GenerationError error={assistant?.errorMessage} />

						{!isBusy && (
							<>
								<ClearChatHint assistant={assistant} />
								<ClearChatButton assistant={assistant} />
							</>
						)}

						<ScrollIntoView trigger={messages} />

						<div className="h-22" />

						<UserInput
							placeholder={
								isGenerating
									? t("assistant.placeholder.generating")
									: !isOnline
										? t("assistant.placeholder.offline")
										: t("assistant.placeholder.reply")
							}
							onSubmit={sendMessage}
							chatSize={messages.length}
							stopGeneratingResponse={isBusy ? abort : undefined}
							disabled={!isOnline || isBusy}
						/>
					</>
				)}
			</div>
		</AssistantLayout>
	)
}

function EmptyChatState({
	onSubmit,
	isOnline,
	isBusy,
	abort,
}: {
	onSubmit: (message: TillyUIMessage) => void
	isOnline: boolean
	isBusy: boolean
	abort?: () => void
}) {
	let me = useAccount(UserAccount, { resolve })
	let t = useIntl()
	let starters = useStarterPrompts(t)

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
	useResizeTextarea(textareaRef, promptValue, { maxHeight: 2.5 * 6 * 16 })

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

	function prefillStarter(text: string) {
		form.setValue("prompt", text)
		textareaRef.current?.focus()
	}

	return (
		<div className="flex flex-col items-center gap-6 py-12 text-center">
			<div className="space-y-4">
				<Avatar className="mx-auto size-20">
					<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly" />
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
						<FormField
							control={form.control}
							name="prompt"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="relative">
											<Textarea
												placeholder={
													!isOnline
														? t("assistant.placeholder.offline")
														: t("assistant.placeholder.initial")
												}
												rows={2}
												className="min-h-20 max-w-full resize-none overflow-x-hidden overflow-y-auto rounded-3xl pr-14"
												style={{
													height: "auto",
													wordWrap: "break-word",
													width: "100%",
												}}
												autoResize={false}
												disabled={!isOnline || isBusy}
												{...field}
												onKeyDown={submitOnKeyCtrlEnter}
												ref={r => {
													textareaRef.current = r
													autoFocusRef.current = r
													field.ref(r)
												}}
											/>
											{abort ? (
												<Button
													type="button"
													variant="destructive"
													onClick={abort}
													size="icon"
													className="absolute right-2 bottom-2 size-10 rounded-3xl"
												>
													<Pause />
												</Button>
											) : (
												<Button
													type="submit"
													size="icon"
													className="absolute right-2 bottom-2 size-10 rounded-3xl"
													disabled={!isOnline || isBusy}
												>
													<Send />
												</Button>
											)}
										</div>
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
						variant="ghost"
						className="h-auto min-w-0 justify-start text-left text-wrap whitespace-normal"
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

function OfflineAlert() {
	return (
		<Alert>
			<WifiOff />
			<AlertTitle>
				<T k="assistant.chatUnavailable.title" />
			</AlertTitle>
			<AlertDescription>
				<T k="assistant.chatUnavailable.description" />
			</AlertDescription>
		</Alert>
	)
}

function LoadingIndicator({ state }: { state: "sending" | "generating" }) {
	return (
		<div className="text-muted-foreground flex items-center justify-center gap-3 py-2 text-sm">
			<Avatar className="size-8 animate-pulse">
				<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly logo" />
				<AvatarFallback>T</AvatarFallback>
			</Avatar>
			<T k={`assistant.${state}`} />
		</div>
	)
}

function SendingError({ error }: { error: Error | null }) {
	if (!error) return null

	return (
		<Alert variant="destructive">
			<AlertTitle>
				{isUsageLimitError(error) ? (
					<T k="assistant.usageLimit.title" />
				) : isRequestTooLargeError(error) ? (
					<T k="assistant.requestTooLarge.title" />
				) : isWorkerTimeoutError(error) ? (
					<T k="assistant.workerTimeout.title" />
				) : isEmptyMessagesError(error) ? (
					<T k="assistant.sendError.title" />
				) : (
					<T k="assistant.sendError.title" />
				)}
			</AlertTitle>
			<AlertDescription>
				{isUsageLimitError(error) ? (
					<div className="space-y-2">
						<T k="assistant.usageLimit.description" />
						<Button asChild variant="outline" size="sm" className="mt-2">
							<Link to="/settings">
								<T k="assistant.usageLimit.viewSettings" />
							</Link>
						</Button>
					</div>
				) : isRequestTooLargeError(error) ? (
					<T k="assistant.requestTooLarge.description" />
				) : isWorkerTimeoutError(error) ? (
					<T k="assistant.workerTimeout.description" />
				) : isEmptyMessagesError(error) ? (
					<T k="assistant.emptyMessages.description" />
				) : (
					<span className="select-text">{error.message}</span>
				)}
			</AlertDescription>
		</Alert>
	)
}

function GenerationError({ error }: { error?: string }) {
	if (!error) return null
	return (
		<Alert variant="destructive">
			<AlertTitle>
				<T k="assistant.backgroundError.title" />
			</AlertTitle>
			<AlertDescription>
				<span className="select-text">{error}</span>
			</AlertDescription>
		</Alert>
	)
}

function ClearChatHint({
	assistant,
}: {
	assistant: co.loaded<typeof Assistant> | undefined
}) {
	if (!assistant || assistant.clearChatHintDismissedAt) return null

	return (
		<Alert>
			<InfoCircleFill />
			<AlertTitle>
				<T k="assistant.clearChatHint.title" />
			</AlertTitle>
			<AlertDescription>
				<T k="assistant.clearChatHint.description" />
				<Button
					variant="secondary"
					onClick={() => {
						assistant.$jazz.set("clearChatHintDismissedAt", new Date())
					}}
					className="mt-2"
				>
					<T k="assistant.clearChatHint.dismiss" />
				</Button>
			</AlertDescription>
		</Alert>
	)
}

function ClearChatButton({
	assistant,
}: {
	assistant: co.loaded<typeof Assistant> | undefined
}) {
	return (
		<div className="mt-2 flex justify-center">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => {
					assistant?.$jazz.set(
						"stringifiedMessages",
						co.list(zz.string()).create([]),
					)
				}}
				className="text-muted-foreground hover:text-foreground"
			>
				<T k="assistant.clearChat" />
			</Button>
		</div>
	)
}

function UserInput(props: {
	onSubmit: (message: TillyUIMessage) => void
	chatSize: number
	stopGeneratingResponse?: () => void
	placeholder: string
	disabled?: boolean
}) {
	let me = useAccount(UserAccount, { resolve })
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
	useResizeTextarea(textareaRef, promptValue, { maxHeight: 2.5 * 6 * 16 })

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
				"bg-background/50 border-border fixed z-1 rounded-4xl border p-2 backdrop-blur-xl transition-all duration-300 max-md:inset-x-3 md:bottom-3 md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2",
				inputFocused && "bg-background bottom-1",
				!inputFocused &&
					"bottom-[calc(max(calc(var(--spacing)*3),calc(env(safe-area-inset-bottom)-var(--spacing)*4))+var(--spacing)*19)]",
			)}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<FormField
						control={form.control}
						name="prompt"
						render={({ field }) => (
							<FormItem className="flex items-end">
								<FormControl>
									<Textarea
										placeholder={props.placeholder}
										rows={1}
										className="max-h-36 min-h-10 flex-1 resize-none overflow-y-auto rounded-3xl"
										style={{ height: "auto" }}
										autoResize={false}
										disabled={props.disabled}
										{...field}
										onKeyDown={submitOnKeyCtrlEnter}
										ref={r => {
											textareaRef.current = r
											autoFocusRef.current = r
											field.ref(r)
										}}
									/>
								</FormControl>
								{props.stopGeneratingResponse ? (
									<Button
										type="button"
										variant="destructive"
										onClick={props.stopGeneratingResponse}
										size="icon"
										className="size-10 rounded-3xl"
									>
										<Pause />
									</Button>
								) : (
									<Button
										type="submit"
										size="icon"
										className="size-10 rounded-3xl"
										disabled={props.disabled}
									>
										<Send />
									</Button>
								)}
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	)
}

function useChatMessaging(me: co.loaded<typeof UserAccount, typeof resolve>) {
	let [isSending, setIsSending] = useState(false)
	let [failedToSend, setFailedToSend] = useState<Error | null>(null)
	let submitAbortControllerRef = useRef<AbortController | null>(null)

	async function sendMessage(message: TillyUIMessage, replaceIndex?: number) {
		setIsSending(true)
		setFailedToSend(null)

		let assistant
		if (me.root.assistant) {
			assistant = me.root.assistant
		} else {
			assistant = Assistant.create({
				version: 1,
				stringifiedMessages: [],
				submittedAt: new Date(),
			})
			me.root.$jazz.set("assistant", assistant)
		}

		if (!assistant.stringifiedMessages) {
			assistant.$jazz.set("stringifiedMessages", [JSON.stringify(message)])
			assistant.$jazz.set("submittedAt", new Date())
		} else if (replaceIndex !== undefined) {
			assistant.stringifiedMessages.$jazz.set(
				replaceIndex,
				JSON.stringify(message),
			)
			assistant.$jazz.set("submittedAt", new Date())
		} else {
			assistant.stringifiedMessages.$jazz.push(JSON.stringify(message))
			assistant.$jazz.set("submittedAt", new Date())
		}

		await me.$jazz.waitForAllCoValuesSync()

		let controller = new AbortController()
		submitAbortControllerRef.current = controller

		try {
			let response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
			})
			if (!response.ok) throw new Error(await response.text())
			if (!response.body) throw new Error("No response body")
			await consumeUntil(response.body.getReader(), "generation-started")
		} catch (error) {
			assistant.$jazz.set("submittedAt", undefined)
			if ((error as Error).name === "AbortError") return
			setFailedToSend(error as Error)
		} finally {
			setIsSending(false)
			submitAbortControllerRef.current = null
		}
	}

	async function abort() {
		submitAbortControllerRef.current?.abort()
		me.root.assistant?.$jazz.set("abortRequestedAt", new Date())
		setIsSending(false)
	}

	return { isSending, failedToSend, sendMessage, abort }
}

function createAddToolResult(
	messages: TillyUIMessage[],
	sendMessage: (msg: TillyUIMessage, idx?: number) => Promise<void>,
) {
	return async ({
		toolCallId,
		output,
	}: {
		toolCallId: string
		output: unknown
	}) => {
		let messageIndex = messages.findIndex(msg => {
			if (msg.role !== "assistant") return false
			return msg.parts?.some(
				p => "toolCallId" in p && p.toolCallId === toolCallId,
			)
		})

		if (messageIndex === -1) return

		let msg = messages[messageIndex]
		let updatedParts = msg.parts?.map(part => {
			if (!("toolCallId" in part)) return part
			if (part.toolCallId !== toolCallId) return part
			return { ...part, output, state: "output-available" as const }
		}) as TillyUIMessage["parts"]

		let updatedMessage: TillyUIMessage = { ...msg, parts: updatedParts }
		await sendMessage(updatedMessage, messageIndex)
	}
}

let GENERATION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

function useStaleGenerationTimeout(
	assistant: co.loaded<typeof Assistant> | undefined,
) {
	useEffect(() => {
		if (!assistant?.submittedAt) return

		let submittedTime = assistant.submittedAt.getTime()
		let now = Date.now()
		let age = now - submittedTime

		if (age >= GENERATION_TIMEOUT_MS) {
			resetGenerationMarkersForTimeout(assistant)
			return
		}

		let remaining = GENERATION_TIMEOUT_MS - age
		let timer = setTimeout(() => {
			resetGenerationMarkersForTimeout(assistant)
		}, remaining)

		return () => clearTimeout(timer)
	}, [assistant, assistant?.submittedAt])
}

function useSetupNotificationAcknowledgment(
	assistant: co.loaded<typeof Assistant> | undefined,
) {
	useEffect(() => {
		if (!assistant) return

		let unsubscribe = assistant.$jazz.subscribe(
			(a: co.loaded<typeof Assistant>) => {
				if (document.visibilityState !== "visible") return
				if (!a.notificationCheckId) return
				if (a.notificationCheckId === a.notificationAcknowledgedId) return
				a.$jazz.set("notificationAcknowledgedId", a.notificationCheckId)
			},
		)

		return unsubscribe
	}, [assistant])
}

async function resetGenerationMarkersForTimeout(
	assistant: co.loaded<typeof Assistant>,
) {
	assistant.$jazz.set("submittedAt", undefined)
	assistant.$jazz.set("abortRequestedAt", undefined)
	await assistant.$jazz.waitForSync()
}

function extractErrorMessage(error: unknown): string | null {
	if (typeof error === "string") return error
	if (error instanceof Error) return error.message
	return null
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null
}

function isUsageLimitError(error: unknown): boolean {
	let payload = extractErrorPayload(error)
	return payload?.code === "usage-limit-exceeded"
}

function isRequestTooLargeError(error: unknown): boolean {
	let payload = extractErrorPayload(error)
	return payload?.code === "request-too-large"
}

function isEmptyMessagesError(error: unknown): boolean {
	let payload = extractErrorPayload(error)
	return payload?.code === "empty-messages"
}

function isWorkerTimeoutError(error: unknown): boolean {
	let payload = extractErrorPayload(error)
	return payload?.code === "worker-timeout"
}

type ErrorPayload = {
	code?: string
	error?: string
}

function extractErrorPayload(value: unknown): ErrorPayload | null {
	if (isRecord(value) && "code" in value) {
		return value as ErrorPayload
	}

	let message = extractErrorMessage(value)
	if (!message) {
		return null
	}

	try {
		let parsed: unknown = JSON.parse(message)
		if (isRecord(parsed)) {
			return parsed as ErrorPayload
		}
		return null
	} catch {
		return null
	}
}

/**
 * this is a utility to consume the entire stream but resolve the promise
 * as soon as we hit the marker in a chunk
 */
async function consumeUntil(
	reader: ReadableStreamDefaultReader,
	marker: string,
) {
	let decoder = new TextDecoder()
	let found = false

	let readStream = async (resolve: () => void) => {
		while (true) {
			let { done, value } = await reader.read()
			if (done) break

			let chunk = decoder.decode(value, { stream: true })
			if (!found && chunk.includes(marker)) {
				found = true
				resolve()
			}
		}
	}
	return new Promise<void>(readStream)
}
