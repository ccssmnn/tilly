import * as React from "react"
import { Check, ChevronBarExpand } from "react-bootstrap-icons"

import { cn } from "#app/lib/utils"
import { Button } from "#shared/ui/button"
import { useIsMobile } from "#app/hooks/use-mobile"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#shared/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "#shared/ui/popover"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"

interface ComboboxProps {
	items: Array<{ value: string; label: string }>
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	emptyText?: string
	searchPlaceholder?: string
	className?: string
}

export function Combobox({
	items,
	value,
	onValueChange,
	placeholder = "Select item...",
	emptyText = "No item found.",
	searchPlaceholder = "Search items...",
	className,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false)
	let isMobile = useIsMobile()

	let triggerButton = (
		<Button
			variant="outline"
			role="combobox"
			aria-expanded={open}
			className={cn("w-full justify-between", className)}
		>
			{value ? items.find(item => item.value === value)?.label : placeholder}
			<ChevronBarExpand className="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	)

	let commandContent = (
		<Command>
			<CommandInput placeholder={searchPlaceholder} />
			<CommandList>
				<CommandEmpty>{emptyText}</CommandEmpty>
				<CommandGroup>
					{items.map(item => (
						<CommandItem
							key={item.value}
							value={item.label}
							onSelect={() => {
								onValueChange?.(item.value === value ? "" : item.value)
								setOpen(false)
							}}
						>
							<Check
								className={cn(
									"mr-2 h-4 w-4",
									value === item.value ? "opacity-100" : "opacity-0",
								)}
							/>
							{item.label}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	)

	if (isMobile) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{triggerButton}</DialogTrigger>
				<DialogContent
					titleSlot={
						<DialogHeader>
							<DialogTitle>{searchPlaceholder}</DialogTitle>
						</DialogHeader>
					}
				>
					{commandContent}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				{commandContent}
			</PopoverContent>
		</Popover>
	)
}
