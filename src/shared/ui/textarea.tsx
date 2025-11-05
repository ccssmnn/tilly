import * as React from "react"
import { cn } from "#app/lib/utils"
import { useEffect, useRef, useImperativeHandle } from "react"

export { Textarea, useResizeTextarea }

let Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<"textarea"> & {
		autoResize?: boolean
		maxHeight?: number
	}
>(
	(
		{
			className,
			autoResize: enableAutoResize = true,
			maxHeight,
			onInput,
			...props
		},
		ref,
	) => {
		let internalRef = useRef<HTMLTextAreaElement>(null)

		// Use the resize hook with disabled flag
		useResizeTextarea(internalRef, String(props.value || ""), {
			maxHeight,
			disabled: !enableAutoResize,
		})

		// Combine external ref with internal ref
		useImperativeHandle(ref, () => internalRef.current!, [])

		return (
			<textarea
				ref={internalRef}
				data-slot="textarea"
				className={cn(
					"border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-input flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					enableAutoResize ? "resize-none" : "resize-y rounded-br-none",
					className,
				)}
				onInput={onInput}
				{...props}
			/>
		)
	},
)

Textarea.displayName = "Textarea"

function useResizeTextarea(
	ref: React.RefObject<HTMLTextAreaElement | null>,
	value: string,
	options?: { maxHeight?: number; disabled?: boolean },
) {
	let { maxHeight, disabled = false } = options || {}

	useEffect(() => {
		let textarea = ref.current
		if (!textarea || disabled) return

		textarea.style.height = "auto"
		let scrollHeight = textarea.scrollHeight
		if (maxHeight) {
			textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
		} else {
			textarea.style.height = `${scrollHeight}px`
		}

		textarea.scrollTop = textarea.scrollHeight
	}, [value, maxHeight, disabled, ref])
}
