import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "#app/lib/utils"

function Avatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(
				"relative flex size-8 shrink-0 overflow-hidden rounded-full",
				className,
			)}
			{...props}
		/>
	)
}

function AvatarImage({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"aspect-square size-full object-cover shadow-inner",
				className,
			)}
			{...props}
		/>
	)
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"flex size-full items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-600 text-lg font-semibold text-white",
				className,
			)}
			{...props}
		/>
	)
}

export { Avatar, AvatarImage, AvatarFallback }
