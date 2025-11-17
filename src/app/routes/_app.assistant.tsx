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
import { Assistant, UserAccount } from "#shared/schema/user"
import { co, type ResolveQuery } from "jazz-tools"
import { useAccount } from "jazz-tools/react"
import {
	Send,
	Pause,
	WifiOff,
	InfoCircleFill,
	ChatFill,
} from "react-bootstrap-icons"
import {
	TypographyH1,
	TypographyH2,
	TypographyLead,
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
import { useAssistantAccess } from "#app/features/plus"
import { nanoid } from "nanoid"

export let Route = createFileRoute("/_app/assistant")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()
		let loadedMe = await context.me.$jazz.ensureLoaded({ resolve })
		let initialMessages =
			loadedMe.root.assistant?.stringifiedMessages?.map(
				s => JSON.parse(s) as TillyUIMessage,
			) ?? []
		return { me: loadedMe, initialMessages }
	},
	component: AssistantScreen,
})

let resolve = {
	root: { people: { $each: true }, assistant: true },
} as const satisfies ResolveQuery<typeof UserAccount>

function AssistantScreen() {
	let access = useAssistantAccess()

	if (access.status === "loading") {
		return (
			<AssistantLayout>
				<AssistantLoading />
			</AssistantLayout>
		)
	}

	if (access.status === "denied") {
		return (
			<AssistantLayout>
				<SubscribePrompt />
			</AssistantLayout>
		)
	}

	// just to be sure :)
	access.status satisfies "granted"

	return (
		<AssistantLayout>
			<AuthenticatedChat />
		</AssistantLayout>
	)
}

function AssistantLayout({ children }: { children: ReactNode }) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("assistant.pageTitle")}</title>
			<TypographyH1>
				<T k="assistant.title" />
			</TypographyH1>
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
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 text-center md:min-h-[calc(100dvh-6rem)]">
			<div className="max-w-md space-y-3 text-left">
				<ChatFill className="text-muted-foreground size-16" />
				<TypographyH2>
					<T k="assistant.subscribe.title" />
				</TypographyH2>
				<TypographyLead>
					<T k="assistant.subscribe.description" />
				</TypographyLead>
				<div className="mt-8 flex justify-end">
					<Button asChild>
						<Link to="/settings">
							<T k="assistant.subscribe.settings" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}

function AuthenticatedChat() {
	let t = useIntl()
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, { resolve })
	let me = subscribedMe ?? data.me
	let assistant = me.root.assistant

	let canUseChat = useOnlineStatus()

	let [isSending, setIsSending] = useState(false)
	let [failedToSend, setFailedToSend] = useState<Error | null>(null)

	let backgroundError = assistant?.errorMessage

	let submitAbortControllerRef = useRef<AbortController | null>(null)

	let messages = useMemo(
		() =>
			assistant?.stringifiedMessages?.map(
				s => JSON.parse(s) as TillyUIMessage,
			) ?? [],
		[assistant?.stringifiedMessages],
	)

	let isGenerating = !!assistant?.submittedAt

	useStaleGenerationTimeout(assistant)
	useSetupNotificationAcknowledgment(assistant)

	async function handleAbort() {
		submitAbortControllerRef.current?.abort()
		assistant?.$jazz.set("abortRequestedAt", new Date())

		setIsSending(false)
	}

	async function addToolResult({
		toolCallId,
		output,
	}: {
		toolCallId: string
		output: unknown
	}) {
		if (!assistant?.stringifiedMessages) return

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

			return {
				...part,
				output,
				state: "output-available" as const,
			}
		}) as TillyUIMessage["parts"]

		let updatedMessage: TillyUIMessage = { ...msg, parts: updatedParts }
		await addMessageAndTriggerServer(updatedMessage, messageIndex)
	}

	async function addMessageAndTriggerServer(
		message: TillyUIMessage,
		replaceIndex?: number,
	) {
		setIsSending(true)
		setFailedToSend(null)

		let assistant_
		if (assistant) {
			assistant_ = assistant
		} else {
			assistant_ = Assistant.create({
				version: 1,
				stringifiedMessages: [],
				submittedAt: new Date(),
			})
			me.root.$jazz.set("assistant", assistant_)
		}

		if (!assistant_.stringifiedMessages) {
			assistant_.$jazz.set("stringifiedMessages", [JSON.stringify(message)])
			assistant_.$jazz.set("submittedAt", new Date())
		} else if (replaceIndex !== undefined) {
			assistant_.stringifiedMessages.$jazz.set(
				replaceIndex,
				JSON.stringify(message),
			)
			assistant_.$jazz.set("submittedAt", new Date())
		} else {
			assistant_.stringifiedMessages.$jazz.push(JSON.stringify(message))
			assistant_.$jazz.set("submittedAt", new Date())
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
			if (!response.ok) {
				let errorData = await response.json()
				throw new Error(JSON.stringify(errorData))
			}
		} catch (error) {
			assistant_.$jazz.set("submittedAt", undefined)
			if ((error as Error).name === "AbortError") return
			setFailedToSend(error as Error)
		} finally {
			setIsSending(false)
			submitAbortControllerRef.current = null
		}
	}

	let isBusy = isSending || isGenerating

	return (
		<div className="space-y-4">
			{!canUseChat && (
				<Alert>
					<WifiOff />
					<AlertTitle>
						<T k="assistant.chatUnavailable.title" />
					</AlertTitle>
					<AlertDescription>
						<T k="assistant.chatUnavailable.description" />
					</AlertDescription>
				</Alert>
			)}
			{messages.length === 0 ? (
				<TypographyMuted>
					<T k="assistant.emptyState" />
				</TypographyMuted>
			) : (
				messages.map(message => (
					<MessageRenderer
						key={message.id}
						message={message}
						userId={me.$jazz.id}
						addToolResult={addToolResult}
					/>
				))
			)}
			{isSending ? (
				<div className="text-muted-foreground flex items-center justify-center gap-3 py-2 text-sm">
					<Avatar className="size-8 animate-pulse">
						<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly logo" />
						<AvatarFallback>T</AvatarFallback>
					</Avatar>
					<T k="assistant.sending" />
				</div>
			) : isGenerating ? (
				<div className="text-muted-foreground flex items-center justify-center gap-3 py-2 text-sm">
					<Avatar className="size-8 animate-pulse">
						<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly logo" />
						<AvatarFallback>T</AvatarFallback>
					</Avatar>
					<T k="assistant.generating" />
				</div>
			) : null}
			{failedToSend && (
				<Alert variant="destructive">
					<AlertTitle>
						{isUsageLimitError(failedToSend) ? (
							<T k="assistant.usageLimit.title" />
						) : isRequestTooLargeError(failedToSend) ? (
							<T k="assistant.requestTooLarge.title" />
						) : isEmptyMessagesError(failedToSend) ? (
							<T k="assistant.sendError.title" />
						) : (
							<T k="assistant.sendError.title" />
						)}
					</AlertTitle>
					<AlertDescription>
						{isUsageLimitError(failedToSend) ? (
							<div className="space-y-2">
								<T k="assistant.usageLimit.description" />
								<Button asChild variant="outline" size="sm" className="mt-2">
									<Link to="/settings">
										<T k="assistant.usageLimit.viewSettings" />
									</Link>
								</Button>
							</div>
						) : isRequestTooLargeError(failedToSend) ? (
							<T k="assistant.requestTooLarge.description" />
						) : isEmptyMessagesError(failedToSend) ? (
							<T k="assistant.emptyMessages.description" />
						) : (
							<span className="select-text">{failedToSend.message}</span>
						)}
					</AlertDescription>
				</Alert>
			)}
			{backgroundError && (
				<Alert variant="destructive">
					<AlertTitle>
						<T k="assistant.backgroundError.title" />
					</AlertTitle>
					<AlertDescription>
						<span className="select-text">{backgroundError}</span>
					</AlertDescription>
				</Alert>
			)}
			{messages.length > 0 &&
				!isBusy &&
				!assistant?.clearChatHintDismissedAt && (
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
									if (!assistant) return
									assistant.$jazz.set("clearChatHintDismissedAt", new Date())
								}}
								className="mt-2"
							>
								<T k="assistant.clearChatHint.dismiss" />
							</Button>
						</AlertDescription>
					</Alert>
				)}
			{messages.length > 0 && !isBusy && (
				<div className="mt-2 flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							assistant?.$jazz.set(
								"stringifiedMessages",
								co.list(z.string()).create([]),
							)
						}}
						className="text-muted-foreground hover:text-foreground"
					>
						<T k="assistant.clearChat" />
					</Button>
				</div>
			)}
			<ScrollIntoView trigger={messages} />
			<div className="h-22" />
			<UserInput
				placeholder={
					isGenerating
						? t("assistant.placeholder.generating")
						: !canUseChat
							? t("assistant.placeholder.offline")
							: messages.length > 0
								? t("assistant.placeholder.reply")
								: t("assistant.placeholder.initial")
				}
				onSubmit={addMessageAndTriggerServer}
				chatSize={messages.length}
				stopGeneratingResponse={isBusy ? handleAbort : undefined}
				disabled={!canUseChat || isBusy}
			/>
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
	let { me } = useAccount(UserAccount, { resolve })
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
		if (!me) return
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
				"bg-background/50 border-border absolute z-1 rounded-4xl border p-2 backdrop-blur-xl transition-all duration-300 max-md:inset-x-3 md:bottom-3 md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2",
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
										className="max-h-[9rem] min-h-10 flex-1 resize-none overflow-y-auto rounded-3xl"
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
