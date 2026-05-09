"use client"

import * as React from "react"
import { animate, motion, useMotionValue } from "motion/react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useWebHaptics } from "web-haptics/react"

import { useIsMobile } from "#app/hooks/use-mobile"
import { cn } from "#app/lib/utils"
import { Button } from "#shared/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

let SWIPE_CLOSE_THRESHOLD = 100

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn(
				"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 will-change-opacity fixed inset-0 z-50 bg-black/80 duration-200 supports-backdrop-filter:backdrop-blur-xs",
				className,
			)}
			{...props}
		/>
	)
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: DialogPrimitive.Popup.Props & {
	showCloseButton?: boolean
}) {
	let isMobile = useIsMobile()
	let { trigger: triggerHaptic } = useWebHaptics()
	let closeRef = React.useRef<HTMLButtonElement>(null)
	let dragY = useMotionValue(0)
	let isBeyondThresholdRef = React.useRef(false)
	let dragStartYRef = React.useRef<number | null>(null)
	let resetDragOnMount = React.useCallback(
		(el: HTMLDivElement | null) => {
			if (el) dragY.set(0)
		},
		[dragY],
	)

	let onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0 && event.pointerType === "mouse") return
		dragStartYRef.current = event.clientY
		event.currentTarget.setPointerCapture(event.pointerId)
		dragY.stop()
	}

	let onHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (dragStartYRef.current == null) return
		let offset = Math.max(0, event.clientY - dragStartYRef.current)
		dragY.set(offset)
		let isBeyond = offset > SWIPE_CLOSE_THRESHOLD
		if (isBeyond !== isBeyondThresholdRef.current) {
			isBeyondThresholdRef.current = isBeyond
			triggerHaptic()
		}
	}

	let onHandlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
		if (dragStartYRef.current == null) return
		let offset = Math.max(0, event.clientY - dragStartYRef.current)
		dragStartYRef.current = null
		isBeyondThresholdRef.current = false
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}
		if (offset > SWIPE_CLOSE_THRESHOLD) {
			animate(dragY, window.innerHeight, {
				duration: 0.15,
				ease: "easeOut",
				onComplete: () => closeRef.current?.click(),
			})
		} else {
			animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 })
		}
	}

	let contentClassName = cn(
		"bg-background ring-foreground/5 fixed z-50 flex max-h-[95dvh] flex-col gap-6 overflow-y-auto p-6 text-sm shadow-lg ring-1 outline-none will-change-transform max-md:duration-200 md:duration-100",
		"data-open:animate-in data-closed:animate-out md:data-closed:fade-out-0 md:data-open:fade-in-0 md:data-closed:zoom-out-95 md:data-open:zoom-in-95",
		"max-md:inset-x-0 max-md:bottom-[-100px] max-md:w-screen max-md:max-w-none max-md:rounded-t-4xl max-md:rounded-b-none max-md:pb-[calc(100px+max(calc(var(--spacing)*4),env(safe-area-inset-bottom)))]",
		"max-md:data-closed:slide-out-to-bottom max-md:data-open:slide-in-from-bottom",
		"md:top-6 md:left-1/2 md:w-full md:max-w-[calc(100%-2rem)] md:-translate-x-1/2 md:max-w-md md:rounded-4xl",
		className,
	)

	let closeButton = showCloseButton ? (
		<DialogPrimitive.Close
			ref={closeRef}
			data-slot="dialog-close"
			render={
				<Button
					variant="ghost"
					className="absolute top-4 right-4"
					size="icon-sm"
				/>
			}
		>
			<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
			<span className="sr-only">Close</span>
		</DialogPrimitive.Close>
	) : null

	let mobileStyle = {
		marginTop: "env(safe-area-inset-top)",
		paddingLeft: "max(calc(var(--spacing) * 4), env(safe-area-inset-left))",
		paddingRight: "max(calc(var(--spacing) * 4), env(safe-area-inset-right))",
	}

	if (isMobile) {
		return (
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Popup
					data-slot="dialog-content"
					render={
						<motion.div
							ref={resetDragOnMount}
							style={{ ...mobileStyle, y: dragY, transition: "none" }}
							className={contentClassName}
						/>
					}
					{...props}
					initialFocus={false}
				>
					<div
						onPointerDown={onHandlePointerDown}
						onPointerMove={onHandlePointerMove}
						onPointerUp={onHandlePointerEnd}
						onPointerCancel={onHandlePointerEnd}
						className="-mt-4 -mb-1 flex cursor-grab touch-none justify-center pt-1 pb-1.5 select-none active:cursor-grabbing pointer-fine:hidden"
					>
						<div className="bg-muted-foreground/30 h-1.5 w-10 rounded-full" />
					</div>
					{children}
					{closeButton}
				</DialogPrimitive.Popup>
			</DialogPortal>
		)
	}

	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={contentClassName}
				{...props}
			>
				{children}
				{closeButton}
			</DialogPrimitive.Popup>
		</DialogPortal>
	)
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		/>
	)
}

function DialogFooter({
	className,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<"div"> & {
	showCloseButton?: boolean
}) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close render={<Button variant="outline" />}>
					Close
				</DialogPrimitive.Close>
			)}
		</div>
	)
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-base leading-none font-medium", className)}
			{...props}
		/>
	)
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn(
				"text-muted-foreground pointer-fine:*:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
				className,
			)}
			{...props}
		/>
	)
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
}
