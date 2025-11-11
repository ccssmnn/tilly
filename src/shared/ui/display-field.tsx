import type { ReactNode } from "react"
import { cn } from "#app/lib/utils"

type DisplayFieldProps = {
	value?: ReactNode
	placeholder?: ReactNode
	className?: string
}

function DisplayField({ value, placeholder, className }: DisplayFieldProps) {
	let hasValue = value !== undefined && value !== null && value !== ""
	let content = hasValue ? value : placeholder

	return (
		<div
			data-slot="display-field"
			className={cn(
				"bg-input border-input text-foreground flex h-9 w-full min-w-0 items-center rounded-md border px-3 text-left text-base shadow-xs transition-[color,box-shadow] md:text-sm",
				!hasValue && "text-muted-foreground",
				className,
			)}
			aria-live="polite"
		>
			{content ?? "\u00A0"}
		</div>
	)
}

export { DisplayField }
