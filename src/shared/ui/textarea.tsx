import type { ComponentPropsWithRef } from "react"
import { cn } from "#app/lib/utils"
import { useEffect, useRef, useImperativeHandle } from "react"

export { Textarea, useResizeTextarea }

function Textarea({
	className,
	autoResize: enableAutoResize = true,
	maxHeight,
	onInput,
	ref,
	...props
}: ComponentPropsWithRef<"textarea"> & {
	autoResize?: boolean
	maxHeight?: number
}) {
	let internalRef = useRef<HTMLTextAreaElement>(null)

	useResizeTextarea(internalRef, String(props.value || ""), {
		maxHeight,
		disabled: !enableAutoResize,
	})

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
}

function useResizeTextarea(
	ref: React.RefObject<HTMLTextAreaElement | null>,
	value: string,
	options?: { maxHeight?: number; minHeight?: number; disabled?: boolean },
) {
	let { maxHeight, minHeight, disabled = false } = options || {}

	useEffect(() => {
		let textarea = ref.current
		if (!textarea || disabled) return

		textarea.style.height = "auto"
		let scrollHeight = textarea.scrollHeight
		if (maxHeight && maxHeight < scrollHeight) {
			textarea.style.height = `${maxHeight}px`
		} else if (minHeight && minHeight > scrollHeight) {
			textarea.style.height = `${minHeight}px`
		} else {
			textarea.style.height = `${scrollHeight}px`
		}

		textarea.scrollTop = textarea.scrollHeight
	}, [value, maxHeight, minHeight, disabled, ref])
}
