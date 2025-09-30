import * as React from "react"

import { cn } from "#app/lib/utils"

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<"textarea"> & { autoResize?: boolean }
>(
	(
		{ className, autoResize: enableAutoResize = true, onInput, ...props },
		ref,
	) => {
		let internalRef = React.useRef<HTMLTextAreaElement>(null)

		function autoResizeElement(element: HTMLTextAreaElement) {
			element.style.height = "auto"
			element.style.height = element.scrollHeight + "px"
		}

		// Combine external ref with internal ref
		React.useImperativeHandle(ref, () => internalRef.current!, [])

		React.useEffect(() => {
			let element = internalRef.current
			if (!element || !enableAutoResize) return
			requestAnimationFrame(() => autoResizeElement(element))
		}, [props.value, enableAutoResize])

		// Handle ref assignment and initial resize
		const handleRef = React.useCallback(
			(element: HTMLTextAreaElement | null) => {
				internalRef.current = element
			},
			[enableAutoResize],
		)

		return (
			<textarea
				ref={handleRef}
				data-slot="textarea"
				className={cn(
					"border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-input flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					className,
				)}
				onInput={event => {
					if (enableAutoResize) {
						autoResizeElement(event.target as HTMLTextAreaElement)
					}
					onInput?.(event)
				}}
				{...props}
			/>
		)
	},
)

Textarea.displayName = "Textarea"

export { Textarea }
