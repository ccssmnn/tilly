import { type ReactNode } from "react"
import { Alert, AlertDescription } from "#shared/ui/alert"
import { cn } from "#app/lib/utils"

export function ToolMessageWrapper({
	children,
	onClick,
	dialogOpen,
	icon: Icon,
}: {
	children: ReactNode
	onClick?: () => void
	dialogOpen?: boolean
	icon: React.ComponentType<{ className?: string }>
}) {
	return (
		<Alert
			className={cn(
				onClick && "hover:bg-accent cursor-pointer",
				dialogOpen && "bg-accent",
			)}
		>
			<Icon className="h-4 w-4" />
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
