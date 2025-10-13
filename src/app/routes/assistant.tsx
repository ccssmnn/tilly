import { useChat } from "@ai-sdk/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef, type ReactNode } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "#shared/ui/button"
import { Textarea } from "#shared/ui/textarea"
import { Form, FormControl, FormField, FormItem } from "#shared/ui/form"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { UserAccount } from "#shared/schema/user"
import type { ResolveQuery } from "jazz-tools"
import { useAccount, useIsAuthenticated } from "jazz-tools/react"
import { Send, Pause, Chat, WifiOff } from "react-bootstrap-icons"
import { TypographyH1, TypographyMuted } from "#shared/ui/typography"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { useInputFocusState } from "#app/hooks/use-input-focus-state"
import { useOfflineCapabilities } from "#app/hooks/use-online-status"
import { cn } from "#app/lib/utils"
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import { toolExecutors } from "#shared/tools/tools"
import { MessageRenderer } from "#app/features/assistant-message-components"
import { useAppStore } from "#app/lib/store"
import { nanoid } from "nanoid"
import { ScrollIntoView } from "#app/components/scroll-into-view"
import { T, useIntl } from "#shared/intl/setup"
import { useAuth } from "@clerk/clerk-react"
import { PUBLIC_ENABLE_PAYWALL } from "astro:env/client"

export let Route = createFileRoute("/assistant")({
	loader: async ({ context }) => {
		let loadedMe = await context.me.$jazz.ensureLoaded({
			resolve: query,
		})
		return { me: loadedMe }
	},
	component: AssistantScreen,
})

let query = {
	root: { people: { $each: true } },
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
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-8 md:min-h-[calc(100dvh-6rem)]">
			<div className="mx-auto w-full max-w-md space-y-6 text-center">
				<Chat className="text-muted-foreground mx-auto size-12" />
				<div className="space-y-3">
					<h2 className="text-xl font-semibold">
						<T k="assistant.subscribe.title" />
					</h2>
					<p className="text-muted-foreground text-sm whitespace-pre-line">
						<T k="assistant.subscribe.description" />
					</p>
				</div>
				<Button asChild>
					<Link to="/settings">
						<T k="assistant.subscribe.settings" />
					</Link>
				</Button>
			</div>
		</div>
	)
}

function useAssistantAccess() {
	let clerkAuth = useAuth()
	let isSignedIn = useIsAuthenticated()

	if (!isSignedIn) return { status: "denied", isSignedIn }

	if (!PUBLIC_ENABLE_PAYWALL) return { status: "granted", isSignedIn }

	let status = determineAccessStatus({ auth: clerkAuth })

	return { status, isSignedIn }
}

function AuthenticatedChat() {
	let data = Route.useLoaderData()
	let { me: subscribedMe } = useAccount(UserAccount, {
		resolve: query,
	})
	let currentMe = subscribedMe ?? data.me
	let {
		chat: initialMessages,
		setChat,
		addChatMessage,
		clearChat,
	} = useAppStore()
	let { canUseChat } = useOfflineCapabilities()

	let {
		status,
		stop,
		messages,
		sendMessage,
		addToolResult,
		setMessages,
		error,
	} = useChat({
		messages: initialMessages,
		transport: new DefaultChatTransport({ api: "/api/chat" }),
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		onFinish: ({ messages }) => setChat(messages),
		onToolCall: async ({ toolCall }) => {
			let toolName = toolCall.toolName as keyof typeof toolExecutors
			let executeFn = toolExecutors[toolName]
			if (executeFn) {
				addToolResult({
					tool: toolName,
					toolCallId: toolCall.toolCallId,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					output: await executeFn(currentMe.$jazz.id, toolCall.input as any),
				})
			}
		},
	})

	function handleSubmit(prompt: string) {
		let metadata = {
			userName: currentMe.profile?.name || "Anonymous",
			timezone: currentMe.root.notificationSettings?.timezone || "UTC",
			locale: currentMe.root.language || "en",
			timestamp: Date.now(),
		}

		addChatMessage({
			id: nanoid(),
			role: "user",
			parts: [{ type: "text", text: prompt }],
			metadata,
		})
		sendMessage({ text: prompt, metadata })
	}

	let isBusy = status === "submitted" || status === "streaming"

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
					{messages.length > 0 && !isBusy && (
						<div className="mt-2 flex justify-center">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									clearChat()
									setMessages([])
								}}
								className="text-muted-foreground hover:text-foreground"
							>
								<T k="assistant.clearChat" />
							</Button>
						</div>
					)}
					<ScrollIntoView trigger={messages} />
					<div className="h-24" />
				</div>
			)}
			<UserInput
				onSubmit={handleSubmit}
				chatSize={messages.length}
				stopGeneratingResponse={isBusy ? stop : undefined}
				disabled={!canUseChat}
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
			<div className="container mx-auto md:max-w-xl">
				<Form {...form}>
					<form
						// eslint-disable-next-line react-hooks/refs
						onSubmit={form.handleSubmit(handleSubmit)}
					>
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
											className="max-h-[9rem] min-h-10 flex-1 resize-none overflow-y-auto rounded-3xl"
											style={{ height: "auto" }}
											autoResize={false}
											disabled={props.disabled}
											onInput={e => {
												let target = e.target as HTMLTextAreaElement
												target.style.height = "auto"
												let scrollHeight = target.scrollHeight
												let maxHeight = 2.5 * 6 // 6 rows * 2.5rem per row
												target.style.height =
													Math.min(scrollHeight, maxHeight * 16) + "px" // 16px = 1rem
											}}
											onKeyDown={e => {
												if (e.key !== "Enter") return

												let shouldSubmit = e.metaKey || e.ctrlKey || e.shiftKey
												if (!shouldSubmit) return

												e.preventDefault()

												if (
													!form.formState.isSubmitting &&
													field.value.trim()
												) {
													form.handleSubmit(handleSubmit)()
													textareaRef.current?.blur()
												}
											}}
											{...field}
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
		</div>
	)
}

function determineAccessStatus({ auth }: { auth: ReturnType<typeof useAuth> }) {
	if (!auth.isLoaded) return "loading"

	if (!auth.isSignedIn) return "denied"

	return auth.has({ plan: "plus" }) ? "granted" : "denied"
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
