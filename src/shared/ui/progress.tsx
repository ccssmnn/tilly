import type { ComponentPropsWithRef } from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "#app/lib/utils"

function Progress({
	className,
	value,
	ref,
	...props
}: ComponentPropsWithRef<typeof ProgressPrimitive.Root>) {
	return (
		<ProgressPrimitive.Root
			ref={ref}
			className={cn(
				"bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className="bg-primary h-full w-full flex-1 transition-all"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	)
}

export { Progress }
