import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "#app/lib/utils"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "#shared/ui/drawer"
import { InputGroup, InputGroupAddon } from "#shared/ui/input-group"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Tick02Icon } from "@hugeicons/core-free-icons"

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-4xl p-1",
				className,
			)}
			{...props}
		/>
	)
}

function CommandDrawer({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className,
	...props
}: Omit<React.ComponentProps<typeof Drawer>, "children"> & {
	title?: string
	description?: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<Drawer {...props}>
			<DrawerHeader className="sr-only">
				<DrawerTitle>{title}</DrawerTitle>
				<DrawerDescription>{description}</DrawerDescription>
			</DrawerHeader>
			<DrawerContent
				className={cn(
					"top-1/3 translate-y-0 overflow-hidden rounded-4xl! p-0",
					className,
				)}
			>
				{children}
			</DrawerContent>
		</Drawer>
	)
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div data-slot="command-input-wrapper" className="p-1 pb-0">
			<InputGroup className="bg-input/30 h-11 pointer-fine:h-9">
				<CommandPrimitive.Input
					data-slot="command-input"
					className={cn(
						"w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				/>
				<InputGroupAddon>
					<HugeiconsIcon
						icon={SearchIcon}
						strokeWidth={2}
						className="size-4 shrink-0 opacity-50"
					/>
				</InputGroupAddon>
			</InputGroup>
		</div>
	)
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
				className,
			)}
			{...props}
		/>
	)
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("py-6 text-center text-sm", className)}
			{...props}
		/>
	)
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
				className,
			)}
			{...props}
		/>
	)
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn("bg-border/50 my-1 h-px", className)}
			{...props}
		/>
	)
}

function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground group/command-item relative flex min-h-11 cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-2xl data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			{children}
			<HugeiconsIcon
				icon={Tick02Icon}
				strokeWidth={2}
				className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
			/>
		</CommandPrimitive.Item>
	)
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(
				"text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest",
				className,
			)}
			{...props}
		/>
	)
}

export {
	Command,
	CommandDrawer,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
}
