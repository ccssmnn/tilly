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
				"border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full resize-none rounded-xl border px-3 py-3 text-base transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] md:text-sm",
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
			textarea.style.height = `${maxHeight}`
		} else if (minHeight && minHeight > scrollHeight) {
			textarea.style.height = `${minHeight}`
		} else {
			textarea.style.height = `${scrollHeight}`
		}

		textarea.scrollTop = textarea.scrollHeight
	}, [value, maxHeight, minHeight, disabled, ref])
}
