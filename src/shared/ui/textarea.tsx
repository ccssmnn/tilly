import type { ComponentPropsWithRef } from "react"
import { cn } from "#app/lib/utils"
import TextareaAutosize from "react-textarea-autosize"

export { Textarea }

type TextareaAutosizeProps = ComponentPropsWithRef<typeof TextareaAutosize>

function Textarea({
	className,
	autoResize: _enableAutoResize = true,
	maxHeight,
	ref,
	...props
}: Omit<TextareaAutosizeProps, "maxRows" | "style"> & {
	autoResize?: boolean
	maxHeight?: number
}) {
	let maxRows = maxHeight ? Math.floor(maxHeight / 24) : undefined

	return (
		<TextareaAutosize
			ref={ref}
			data-slot="textarea"
			maxRows={maxRows}
			className={cn(
				"border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full resize-none rounded-xl border px-3 py-3 text-base transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] md:text-sm",
				className,
			)}
			{...props}
		/>
	)
}
