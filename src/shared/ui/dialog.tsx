"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import * as React from "react"
import { useRef } from "react"
import { motion, animate, useMotionValue } from "motion/react"
import { cn } from "#app/lib/utils"
import { useIsMobile } from "#app/hooks/use-mobile"
import { Button } from "./button"
import { T } from "#shared/intl/setup"

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
				"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 dark:bg-accent/50 fixed inset-0 z-50 bg-black/50 backdrop-blur-xs",
				className,
			)}
			{...props}
		/>
	)
}

function DialogContent({
	className,
	children,
	titleSlot,
	...props
}: DialogPrimitive.Popup.Props & {
	titleSlot: React.ReactNode
}) {
	let isMobile = useIsMobile()
	let dragY = useMotionValue(0)
	let closeRef = useRef<HTMLButtonElement>(null)

	let buttonRotation = useMotionValue(0)
	let wiggleAnimation = useRef<ReturnType<typeof animate> | null>(null)

	function startWiggle() {
		if (wiggleAnimation.current) return
		let wiggle = () => {
			wiggleAnimation.current = animate(buttonRotation, [0, -8, 8, -8, 8, 0], {
				duration: 0.4,
				ease: "easeInOut",
				onComplete: () => {
					if (wiggleAnimation.current) wiggle()
				},
			})
		}
		wiggle()
	}

	function stopWiggle() {
		wiggleAnimation.current?.stop()
		wiggleAnimation.current = null
		buttonRotation.set(0)
	}

	let desktopContent = (
		<>
			<div className="flex items-start justify-between gap-3">
				{titleSlot}
				<Button
					variant="secondary"
					onClick={() => {
						const closeButton = document.querySelector(
							'[data-slot="dialog-close"]',
						) as HTMLButtonElement
						closeButton?.click()
					}}
				>
					<T k="common.close" />
				</Button>
			</div>
			{children}
		</>
	)

	let contentClassName = cn(
		"bg-background fixed z-50 flex max-h-[95dvh] flex-col gap-4 overflow-y-auto p-4 shadow-lg duration-300 ease-out",
		"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
		// small screens (below 768px)
		"max-md:inset-x-0 max-md:bottom-[-100px] max-md:w-screen max-md:rounded-t-3xl max-md:rounded-b-none max-md:pb-[calc(100px+max(calc(var(--spacing)*4),env(safe-area-inset-bottom)))]",
		"max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom",
		// large screens (768px+)
		"md:top-6 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:rounded-lg md:border",
		"md:data-[state=open]:fade-in-0 md:data-[state=closed]:fade-out-0",
		className,
	)

	let mobileStyle = {
		marginTop: "env(safe-area-inset-top)",
		paddingLeft: "max(calc(var(--spacing) * 4), env(safe-area-inset-left))",
		paddingRight: "max(calc(var(--spacing) * 4), env(safe-area-inset-right))",
	}

	if (isMobile) {
		return (
			<DialogPortal data-slot="dialog-portal">
				<DialogOverlay />
				<DialogPrimitive.Popup data-slot="dialog-content" {...props}>
					<motion.div
						style={{ ...mobileStyle, y: dragY }}
						className={contentClassName}
					>
						<motion.div
							drag="y"
							dragConstraints={{ top: 0, bottom: 0 }}
							dragElastic={0}
							onDrag={(_, info) => {
								dragY.set(Math.max(0, info.offset.y))
								if (info.offset.y > 100) {
									startWiggle()
								} else {
									stopWiggle()
								}
							}}
							onDragEnd={(_, info) => {
								stopWiggle()
								if (info.offset.y > 100) {
									closeRef.current?.click()
								} else {
									animate(dragY, 0, {
										type: "spring",
										stiffness: 300,
										damping: 25,
									})
								}
							}}
							style={{ x: 0, y: 0 }}
							className="flex cursor-grab items-start justify-between gap-3 active:cursor-grabbing"
						>
							{titleSlot}
							<motion.div style={{ rotate: buttonRotation }}>
								<Button
									variant="secondary"
									onClick={() => {
										const closeButton = document.querySelector(
											'[data-slot="dialog-close"]',
										) as HTMLButtonElement
										closeButton?.click()
									}}
								>
									<T k="common.close" />
								</Button>
							</motion.div>
						</motion.div>
						{children}
					</motion.div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		)
	}

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={contentClassName}
				{...props}
			>
				{desktopContent}
			</DialogPrimitive.Popup>
		</DialogPortal>
	)
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex flex-col gap-2 text-left", className)}
			{...props}
		/>
	)
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		/>
	)
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-lg leading-none font-semibold", className)}
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
			className={cn("text-muted-foreground text-sm", className)}
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
