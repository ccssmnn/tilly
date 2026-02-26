"use client"

import * as React from "react"
import { DrawerPreview as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "#app/lib/utils"

function DrawerProvider({ ...props }: DrawerPrimitive.Provider.Props) {
	return <DrawerPrimitive.Provider data-slot="drawer-provider" {...props} />
}

function DrawerIndentBackground({
	className,
	...props
}: DrawerPrimitive.IndentBackground.Props) {
	return (
		<DrawerPrimitive.IndentBackground
			data-slot="drawer-indent-background"
			className={cn(className)}
			{...props}
		/>
	)
}

function DrawerIndent({ className, ...props }: DrawerPrimitive.Indent.Props) {
	return (
		<DrawerPrimitive.Indent
			data-slot="drawer-indent"
			className={cn(className)}
			{...props}
		/>
	)
}

function Drawer({
	swipeDirection = "down",
	...props
}: DrawerPrimitive.Root.Props) {
	return (
		<DrawerPrimitive.Root
			data-slot="drawer"
			swipeDirection={swipeDirection}
			{...props}
		/>
	)
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerOverlay({
	className,
	...props
}: DrawerPrimitive.Backdrop.Props) {
	return (
		<DrawerPrimitive.Backdrop
			data-slot="drawer-overlay"
			className={cn(
				"fixed inset-0 z-50 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.32] data-[ending-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[starting-style]:opacity-0 data-[swiping]:duration-0 supports-[-webkit-touch-callout:none]:absolute",
				className,
			)}
			{...props}
		/>
	)
}

function DrawerViewport({
	className,
	...props
}: DrawerPrimitive.Viewport.Props) {
	return (
		<DrawerPrimitive.Viewport
			data-slot="drawer-viewport"
			className={cn(
				"fixed inset-0 z-50 flex items-end justify-center",
				className,
			)}
			{...props}
		/>
	)
}

function DrawerPopup({ className, ...props }: DrawerPrimitive.Popup.Props) {
	return (
		<DrawerPrimitive.Popup
			data-slot="drawer-popup"
			className={cn(
				"group/drawer-popup bg-background text-foreground pointer-events-auto relative -mb-[2.75rem] [height:var(--drawer-height,auto)] max-h-[calc(85dvh+2.75rem)] w-full [transform-origin:50%_calc(100%-var(--bleed))] [transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height))))_scale(var(--stack-scale))] overflow-y-auto overscroll-contain rounded-t-4xl px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+2.75rem)] shadow-[0_-14px_40px_rgb(0_0_0/0.18)] ring-1 ring-black/5 [--bleed:2.75rem] [--peek:0.875rem] [--stack-height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.045] [transition:transform_450ms_cubic-bezier(0.32,0.72,0,1),height_450ms_cubic-bezier(0.32,0.72,0,1),box-shadow_450ms_cubic-bezier(0.32,0.72,0,1)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:transition-[background-color] after:duration-[450ms] after:ease-[cubic-bezier(0.32,0.72,0,1)] after:content-[''] data-[ending-style]:[transform:translateY(calc(100%-var(--bleed)))] data-[ending-style]:shadow-[0_-14px_40px_rgb(0_0_0/0)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[nested-drawer-open]:h-[calc(var(--stack-height)+var(--bleed))] data-[nested-drawer-open]:overflow-hidden data-[nested-drawer-open]:after:bg-black/5 data-[nested-drawer-swiping]:duration-0 data-[starting-style]:[transform:translateY(calc(100%-var(--bleed)))] data-[swiping]:duration-0 data-[swiping]:select-none md:w-[min(32rem,calc(100%-2rem))] md:rounded-4xl",
				className,
			)}
			{...props}
		/>
	)
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerHandle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-handle"
			className={cn(
				"bg-muted mx-auto mb-3 h-1 w-11 rounded-full transition-opacity duration-200 group-data-[nested-drawer-open]/drawer-popup:opacity-0 group-data-[nested-drawer-swiping]/drawer-popup:opacity-100",
				className,
			)}
			{...props}
		/>
	)
}

function DrawerContent({
	className,
	children,
	showHandle = true,
	contentClassName,
	...props
}: DrawerPrimitive.Popup.Props & {
	showHandle?: boolean
	contentClassName?: string
}) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerViewport>
				<DrawerPopup className={className} {...props}>
					{showHandle && <DrawerHandle />}
					<DrawerPrimitive.Content
						data-slot="drawer-content"
						className={cn(
							"mx-auto w-full max-w-2xl transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-[nested-drawer-open]/drawer-popup:opacity-0 group-data-[nested-drawer-swiping]/drawer-popup:opacity-100",
							contentClassName,
						)}
					>
						{children}
					</DrawerPrimitive.Content>
				</DrawerPopup>
			</DrawerViewport>
		</DrawerPortal>
	)
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn("mb-4 flex flex-col gap-1 text-center", className)}
			{...props}
		/>
	)
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn("mt-6 flex items-center justify-end gap-2", className)}
			{...props}
		/>
	)
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn("text-base leading-tight font-medium", className)}
			{...props}
		/>
	)
}

function DrawerDescription({
	className,
	...props
}: DrawerPrimitive.Description.Props) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	)
}

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHandle,
	DrawerHeader,
	DrawerIndent,
	DrawerIndentBackground,
	DrawerOverlay,
	DrawerPopup,
	DrawerPortal,
	DrawerProvider,
	DrawerTitle,
	DrawerTrigger,
	DrawerViewport,
}
