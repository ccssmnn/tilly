import { useMemo } from "react"
import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { useIntl } from "#shared/intl/setup"
import { useOnlineStatus } from "#app/hooks/use-online-status"
import { ScrollIntoView } from "#app/components/scroll-into-view"
import type { TillyUIMessage } from "#shared/tools/tools"
import { resolve, type LoadedAssistantAccount } from "../lib/data"
import { classifySendingError } from "../lib/error-handling"
import { createAddToolResult } from "../lib/add-tool-result"
import { useChatMessaging } from "../hooks/use-chat-messaging"
import { useStarterPrompts } from "../hooks/use-starter-prompts"
import { useStaleGenerationTimeout } from "../hooks/use-stale-generation-timeout"
import { useNotificationAcknowledgment } from "../hooks/use-notification-acknowledgment"
import { AssistantLayout } from "../parts/assistant-layout"
import { OfflineAlert } from "../parts/offline-alert"
import { EmptyChatState } from "../parts/empty-chat-state"
import { UserMessage } from "../parts/user-message"
import { AssistantMessage } from "./assistant-message"
import { LoadingIndicator } from "../parts/loading-indicator"
import { SendingError } from "../parts/sending-error"
import { GenerationError } from "../parts/generation-error"
import { ClearChatHint } from "../parts/clear-chat-hint"
import { ClearChatButton } from "../parts/clear-chat-button"
import { ChatInput } from "../parts/chat-input"

export { AuthenticatedChat }

function AuthenticatedChat({ me: loaderMe }: { me: LoadedAssistantAccount }) {
	let t = useIntl()

	let subscribedMe = useAccount(UserAccount, { resolve })
	let me = subscribedMe.$isLoaded ? subscribedMe : loaderMe
	let assistant = me.root.assistant

	let isOnline = useOnlineStatus()

	let messages = useMemo(
		() =>
			assistant?.stringifiedMessages?.map(
				(s: string) => JSON.parse(s) as TillyUIMessage,
			) ?? [],
		[assistant?.stringifiedMessages],
	)

	let { isSending, failedToSend, sendMessage, abort } = useChatMessaging(me)
	let starters = useStarterPrompts(t)

	useStaleGenerationTimeout(assistant)
	useNotificationAcknowledgment(assistant)

	let isGenerating = !!assistant?.submittedAt
	let isBusy = isSending || isGenerating

	let isEmpty = messages.length === 0

	return (
		<AssistantLayout hideTitle={isEmpty}>
			<div className="space-y-4">
				{!isOnline && <OfflineAlert />}

				{isEmpty ? (
					<EmptyChatState
						me={me}
						starters={starters}
						onSubmit={sendMessage}
						isOnline={isOnline}
						isBusy={isBusy}
						abort={isBusy ? abort : undefined}
					/>
				) : (
					<>
						{messages.map((message: TillyUIMessage) =>
							message.role === "user" ? (
								<UserMessage key={message.id} message={message} />
							) : (
								<AssistantMessage
									key={message.id}
									message={message}
									addToolResult={createAddToolResult(messages, sendMessage)}
								/>
							),
						)}

						{isSending ? (
							<LoadingIndicator state="sending" />
						) : isGenerating ? (
							<LoadingIndicator state="generating" />
						) : null}

						<SendingError
							error={failedToSend}
							errorKind={classifySendingError(failedToSend)}
						/>
						<GenerationError error={assistant?.errorMessage} />

						{!isBusy && (
							<>
								<ClearChatHint assistant={assistant} />
								<ClearChatButton assistant={assistant} />
							</>
						)}

						<ScrollIntoView trigger={messages} />

						<div className="h-22" />

						<ChatInput
							me={me}
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
