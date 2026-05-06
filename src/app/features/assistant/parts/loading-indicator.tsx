import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { T } from "#shared/intl/setup"

export { LoadingIndicator }

function LoadingIndicator({ state }: { state: "sending" | "generating" }) {
	return (
		<div className="text-muted-foreground flex items-center justify-center gap-3 py-2 text-sm">
			<Avatar className="size-8 animate-pulse motion-reduce:animate-none">
				<AvatarImage src="/app/icons/icon-192x192.png" alt="Tilly logo" />
				<AvatarFallback>T</AvatarFallback>
			</Avatar>
			<T k={`assistant.${state}`} />
		</div>
	)
}
