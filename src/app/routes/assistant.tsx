import { useChat } from "@ai-sdk/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, type ReactNode } from "react"
import { Button } from "#shared/ui/button"
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { UserAccount } from "#shared/schema/user"
import type { ResolveQuery } from "jazz-tools"
import { useAccount, useIsAuthenticated } from "jazz-tools/react"
import { Pause, Chat, WifiOff, ChatRightText, Mic } from "react-bootstrap-icons"
import { TypographyH1, TypographyMuted } from "#shared/ui/typography"
import { useOfflineCapabilities } from "#app/hooks/use-online-status"
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
import { TextMessageDialog } from "#app/features/text-message-dialog"
import { VoiceMessageDialog } from "#app/features/voice-message-dialog"

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
					<div className="h-8" />
				</div>
			)}
			<NewMessageButton
				onSubmit={handleSubmit}
				disabled={!canUseChat}
				stopGeneratingResponse={isBusy ? stop : undefined}
			/>
		</>
	)
}

function NewMessageButton(props: {
	onSubmit: (prompt: string) => void
	disabled?: boolean
	stopGeneratingResponse?: () => void
}) {
	let [messageDialogOpen, setMessageDialogOpen] = useState(false)
	let [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
	let t = useIntl()

	function handleMessageSubmit(message: string) {
		props.onSubmit(message)
	}

	function handleVoiceTranscriptionComplete(text: string) {
		props.onSubmit(text)
	}

	return (
		<>
			<div className="fixed right-3 bottom-[calc(max(calc(var(--spacing)*3),calc(env(safe-area-inset-bottom)-var(--spacing)*4))+var(--spacing)*18)] flex gap-3 md:right-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2">
				{props.stopGeneratingResponse ? (
					<Button
						variant="destructive"
						onClick={props.stopGeneratingResponse}
						className="size-14 rounded-full p-0 shadow-lg"
					>
						<Pause className="size-6" />
					</Button>
				) : (
					<>
						<Button
							onClick={() => setVoiceDialogOpen(true)}
							disabled={props.disabled}
							className="size-14 rounded-full p-0 shadow-lg"
						>
							<Mic className="size-6" />
						</Button>
						<Button
							onClick={() => setMessageDialogOpen(true)}
							disabled={props.disabled}
							className="size-14 rounded-full p-0 shadow-lg"
						>
							<ChatRightText className="size-6" />
						</Button>
					</>
				)}
			</div>

			<TextMessageDialog
				open={messageDialogOpen}
				onOpenChange={setMessageDialogOpen}
				onSubmit={handleMessageSubmit}
				disabled={props.disabled}
				placeholder={
					props.disabled
						? t("assistant.placeholder.disabled")
						: t("assistant.placeholder.initial")
				}
			/>
			<VoiceMessageDialog
				open={voiceDialogOpen}
				onOpenChange={setVoiceDialogOpen}
				onTranscriptionComplete={handleVoiceTranscriptionComplete}
			/>
		</>
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
