import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "#app/lib/utils"

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				"group peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-10 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					"bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-6 rounded-full shadow ring-0 transition-transform group-active:scale-97 data-[state=checked]:translate-x-[calc(100%-4px)] data-[state=unchecked]:-translate-x-1",
				)}
			/>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
