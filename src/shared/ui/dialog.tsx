import { Dialog as DialogPrimitive } from "radix-ui"
import * as React from "react"
import { useRef } from "react"
import { motion, animate, useMotionValue } from "motion/react"
import { cn } from "#app/lib/utils"
import { useIsMobile } from "#app/hooks/use-mobile"
import { Button } from "./button"
import { T } from "#shared/intl/setup"

function Dialog({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-accent/50 absolute inset-0 z-50 bg-black/50 backdrop-blur-xs",
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
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
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

	let content = (
		<>
			<div className="flex items-start justify-between gap-3">
				{titleSlot}
				<motion.div style={{ rotate: buttonRotation }}>
					<Button asChild variant="secondary">
						<DialogPrimitive.Close ref={closeRef}>
							<T k="common.close" />
						</DialogPrimitive.Close>
					</Button>
				</motion.div>
			</div>
			{children}
		</>
	)

	let contentClassName = cn(
		"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out md:data-[state=open]:fade-in-0 md:data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom fixed z-50 flex max-h-[95dvh] w-full flex-col gap-4 overflow-y-auto rounded-lg p-4 shadow-lg duration-300 ease-out max-md:rounded-t-3xl max-md:rounded-b-none md:top-6 md:left-[50%] md:w-full md:max-w-lg md:translate-x-[-50%] md:border",
		isMobile &&
			"bottom-[-100px] pb-[calc(100px+max(calc(var(--spacing)*4),env(safe-area-inset-bottom)))]",
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
				<DialogPrimitive.Content
					asChild
					data-slot="dialog-content"
					onOpenAutoFocus={e => {
						e.preventDefault()
						dragY.jump(0)
					}}
					{...props}
				>
					<motion.div
						drag="y"
						dragConstraints={{ top: -50, bottom: 500 }}
						dragElastic={0}
						onDrag={(_, info) => {
							let isPastThreshold = info.offset.y > 100
							if (isPastThreshold) {
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
						style={{ ...mobileStyle, y: dragY }}
						className={contentClassName}
					>
						{content}
					</motion.div>
				</DialogPrimitive.Content>
			</DialogPortal>
		)
	}

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={contentClassName}
				{...props}
			>
				{content}
			</DialogPrimitive.Content>
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

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
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
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
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
