import {
	cloneElement,
	createElement,
	isValidElement,
	type ReactNode,
} from "react"
import { Alert, AlertDescription } from "#shared/ui/alert"
import { cn } from "#app/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"

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
	const renderIcon = () => {
		if (!icon) return null

		if (isValidElement<{ className?: string }>(icon)) {
			return cloneElement(icon, {
				className: cn("h-4 w-4", icon.props.className),
			})
		}

		if (typeof icon === "function") {
			return createElement(icon, { className: "h-4 w-4" })
		}

		if (typeof icon === "object") {
			return <HugeiconsIcon icon={icon} className="h-4 w-4" />
		}

		return null
	}

	return (
		<Alert className={cn(onClick && "p-0", dialogOpen && "bg-accent")}>
			{renderIcon()}
			{onClick ? (
				<button
					onClick={onClick}
					className={cn(
						"text-left",
						"focus-visible:ring-ring cursor-pointer rounded-sm px-4 py-3 focus-visible:ring-2 focus-visible:outline-none",
						"pointer-fine:hover:bg-accent w-full",
					)}
				>
					<AlertDescription className="text-sm">{children}</AlertDescription>
				</button>
			) : (
				<AlertDescription className="px-4 py-3 text-sm">
					{children}
				</AlertDescription>
			)}
		</Alert>
	)
}
