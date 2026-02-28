import { type ReactNode } from "react"
import { Alert, AlertDescription } from "#shared/ui/alert"
import { cn } from "#app/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"

function isHugeIcon(icon: unknown): boolean {
	return (
		typeof icon === "object" &&
		icon !== null &&
		"viewBox" in icon &&
		"path" in icon
	)
}

export function ToolMessageWrapper({
	children,
	onClick,
	dialogOpen,
	icon,
}: {
	children: ReactNode
	onClick?: () => void
	dialogOpen?: boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any
}) {
	const hugeicon = icon && isHugeIcon(icon)

	return (
		<Alert
			className={cn(
				onClick && "pointer-fine:hover:bg-accent cursor-pointer",
				dialogOpen && "bg-accent",
			)}
		>
			{hugeicon ? (
				<HugeiconsIcon icon={icon} className="h-4 w-4" />
			) : icon ? (
				icon({ className: "h-4 w-4" })
			) : null}
			<AlertDescription className="text-sm" onClick={onClick}>
				{children}
			</AlertDescription>
		</Alert>
	)
}
