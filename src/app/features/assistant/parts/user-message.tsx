import type { TillyUIMessage } from "#shared/tools/tools"

export { UserMessage }

function UserMessage({ message }: { message: TillyUIMessage }) {
	if (message.role !== "user") return null

	let textContent = ""
	if (message.parts) {
		let textParts = message.parts.filter(part => part.type === "text")
		textContent = textParts.map(part => part.text).join("")
	} else if ("content" in message && typeof message.content === "string") {
		textContent = message.content
	}

	return (
		<div className="flex w-full justify-end">
			<div className="bg-primary/25 max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap select-text">
				{textContent}
			</div>
		</div>
	)
}
