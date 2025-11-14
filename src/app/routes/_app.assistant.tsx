import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { useRef, useState, type ReactNode } from "react"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "#shared/ui/button"
import { Textarea, useResizeTextarea } from "#shared/ui/textarea"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { UserAccount } from "#shared/schema/user"
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
import { useAppStore } from "#app/lib/store"
import { ScrollIntoView } from "#app/components/scroll-into-view"
import { T, useIntl } from "#shared/intl/setup"
import { useAssistantAccess } from "#app/features/plus"
import { nanoid } from "nanoid"

export let Route = createFileRoute("/_app/assistant")({
	loader: async ({ context }) => {
		if (!context.me) throw notFound()

		let loadedMe = await context.me.$jazz.ensureLoaded({
			resolve: query,
		})

		let initialMessages: TillyUIMessage[] = []
		if (loadedMe.root.assistant?.messages) {
			try {
				initialMessages = JSON.parse(
					loadedMe.root.assistant.messages.toString(),
				)
			} catch (error) {
				console.error("Failed to parse chat messages", error)
			}
		}

		return { me: loadedMe, initialMessages }
	},
	component: AssistantScreen,
})

let query = {
	root: { people: { $each: true }, assistant: { messages: true } },
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
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})
	let currentMe = subscribedMe ?? data.me

	let { clearChatHintDismissed, setClearChatHintDismissed } = useAppStore()

	let canUseChat = useOnlineStatus()

	let [error, setError] = useState<Error | null>(null)

	let messagesJson = currentMe.root.assistant?.messages?.toString() ?? "[]"
	let messages = JSON.parse(messagesJson) as TillyUIMessage[]

	let isGenerating = !!currentMe.root?.assistant?.submittedAt

	async function handleSubmit(prompt: string) {
		setError(null)

		let metadata = {
			userName: currentMe?.profile?.name || "Anonymous",
			timezone: currentMe?.root?.notificationSettings?.timezone || "UTC",
			locale: currentMe?.root?.language || "en",
			timestamp: Date.now(),
		}

		let newMessages = [
			...messages,
			{
				id: nanoid(),
				role: "user",
				parts: [{ type: "text", text: prompt }],
				metadata,
			} as TillyUIMessage,
		]

		await submitMessages(newMessages)
	}

	async function submitMessages(newMessages: TillyUIMessage[]) {
		let messagesJson = JSON.stringify(newMessages)

		if (!currentMe.root.assistant) {
			currentMe.root.$jazz.set("assistant", {
				version: 1,
				messages: co.plainText().create(messagesJson),
				submittedAt: new Date(),
			})
		} else if (!currentMe.root.assistant.messages) {
			currentMe.root.assistant.$jazz.set(
				"messages",
				co.plainText().create(messagesJson),
			)
			currentMe.root.assistant.$jazz.set("submittedAt", new Date())
		} else {
			currentMe.root.assistant.messages.$jazz.applyDiff(messagesJson)
			currentMe.root.assistant.$jazz.set("submittedAt", new Date())
		}

		await currentMe.root.$jazz.waitForSync()

		try {
			let response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			})
			if (!response.ok) {
				let errorData = await response.json()
				throw new Error(JSON.stringify(errorData))
			}
		} catch (error) {
			setError(error as Error)
		}
	}

	async function handleAbort() {
		if (!currentMe.root.assistant) return
		currentMe.root.assistant.$jazz.set("abortRequestedAt", new Date())
		await currentMe.root.assistant.$jazz.waitForSync()
	}

	function addToolResult({
		toolCallId,
		output,
	}: {
		tool: string
		toolCallId: string
		output: unknown
	}) {
		let updatedMessages = messages.map(msg => {
			if (msg.role !== "assistant") return msg

			let hasTool = msg.parts?.some(
				p => "toolCallId" in p && p.toolCallId === toolCallId,
			)
			if (!hasTool) return msg

			let updatedParts = msg.parts?.map(part => {
				if (!("toolCallId" in part)) return part
				if (part.toolCallId !== toolCallId) return part

				return {
					...part,
					output,
					state: "output-available" as const,
				}
			})

			return { ...msg, parts: updatedParts }
		})

		submitMessages(updatedMessages as TillyUIMessage[])
	}

	let isBusy = isGenerating

	return (
		<>
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
				<div className="space-y-4">
					{messages.map(message => (
						<MessageRenderer
							key={message.id}
							message={message}
							userId={currentMe.$jazz.id}
							addToolResult={addToolResult}
						/>
					))}
					{isBusy && (
						<div className="text-muted-foreground flex items-center justify-center gap-3 py-2 text-sm">
							<Avatar className="size-8 animate-pulse">
								<AvatarImage
									src="/app/icons/icon-192x192.png"
									alt="Tilly logo"
								/>
								<AvatarFallback>T</AvatarFallback>
							</Avatar>
							<T k="assistant.generating" />
						</div>
					)}
					{error && (
						<Alert variant="destructive">
							<AlertTitle>
								{isUsageLimitError(error!) ? (
									<T k="assistant.usageLimit.title" />
								) : (
									<T k="assistant.error.title" />
								)}
							</AlertTitle>
							<AlertDescription>
								{isUsageLimitError(error!) ? (
									<div className="space-y-2">
										<T k="assistant.usageLimit.description" />
										<Button
											asChild
											variant="outline"
											size="sm"
											className="mt-2"
										>
											<Link to="/settings">
												<T k="assistant.usageLimit.viewSettings" />
											</Link>
										</Button>
									</div>
								) : (
									<span className="select-text">{error!.message}</span>
								)}
							</AlertDescription>
						</Alert>
					)}
					{messages.length > 0 && !isBusy && !clearChatHintDismissed && (
						<Alert>
							<InfoCircleFill />
							<AlertTitle>
								<T k="assistant.clearChatHint.title" />
							</AlertTitle>
							<AlertDescription>
								<T k="assistant.clearChatHint.description" />
								<Button
									variant="secondary"
									onClick={() => setClearChatHintDismissed(true)}
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
									currentMe.root.assistant?.messages?.$jazz.applyDiff("[]")
								}}
								className="text-muted-foreground hover:text-foreground"
							>
								<T k="assistant.clearChat" />
							</Button>
						</div>
					)}
					<ScrollIntoView trigger={messages} />
					<div className="h-22" />
				</div>
			)}
			<UserInput
				onSubmit={handleSubmit}
				chatSize={messages.length}
				stopGeneratingResponse={isGenerating ? handleAbort : undefined}
				disabled={!canUseChat || isGenerating}
			/>
		</>
	)
}

function UserInput(props: {
	onSubmit: (prompt: string) => void
	chatSize: number
	stopGeneratingResponse?: () => void
	disabled?: boolean
}) {
	let inputFocused = useInputFocusState()
	let autoFocusRef = useAutoFocusInput()
	let textareaRef = useRef<HTMLTextAreaElement>(null)
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

	useResizeTextarea(textareaRef, promptValue, { maxHeight: 2.5 * 6 * 16 })

	function handleSubmit(data: { prompt: string }) {
		if (!data.prompt.trim()) return

		props.onSubmit(data.prompt)

		form.setValue("prompt", "")
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = ""
		}
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
				{/* eslint-disable-next-line react-hooks/refs */}
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<FormField
						control={form.control}
						name="prompt"
						render={({ field }) => (
							<FormItem className="flex items-end">
								<FormControl>
									<Textarea
										placeholder={
											props.disabled
												? t("assistant.placeholder.disabled")
												: props.chatSize === 0
													? t("assistant.placeholder.initial")
													: t("assistant.placeholder.reply")
										}
										rows={1}
										className="max-h-[9rem] min-h-11 flex-1 resize-none overflow-y-auto rounded-3xl"
										style={{ height: "auto" }}
										autoResize={false}
										disabled={props.disabled}
										{...field}
										onKeyDown={e => {
											if (e.key !== "Enter") return

											let shouldSubmit = e.metaKey || e.ctrlKey || e.shiftKey
											if (!shouldSubmit) return

											e.preventDefault()

											if (!form.formState.isSubmitting && field.value.trim()) {
												form.handleSubmit(handleSubmit)()
												textareaRef.current?.blur()
											}
										}}
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

function isUsageLimitError(error: unknown): boolean {
	let payload = extractUsageLimitErrorPayload(error)
	return payload?.code === "usage-limit-exceeded"
}

type UsageLimitErrorPayload = {
	code: "usage-limit-exceeded"
	error?: string
	limitExceeded?: boolean
	percentUsed?: number
	resetDate?: string | null
}

function extractErrorMessage(error: unknown): string | null {
	if (typeof error === "string") {
		return error
	}

	if (error instanceof Error) {
		return error.message
	}

	return null
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null
}

function extractUsageLimitErrorPayload(
	value: unknown,
): UsageLimitErrorPayload | null {
	if (isUsageLimitErrorPayload(value)) {
		return value
	}

	let message = extractErrorMessage(value)
	if (!message) {
		return null
	}

	try {
		let parsed: unknown = JSON.parse(message)
		if (isUsageLimitErrorPayload(parsed)) {
			return parsed
		}
		return null
	} catch {
		return null
	}
}

function isUsageLimitErrorPayload(
	value: unknown,
): value is UsageLimitErrorPayload {
	if (!isRecord(value)) {
		return false
	}

	return value.code === "usage-limit-exceeded"
}
