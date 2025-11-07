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

interface ComboboxProps<T = unknown> {
	items: Array<{ value: string; label: string; person?: T }>
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	emptyText?: string
	searchPlaceholder?: string
	className?: string
	renderItem?: (
		item: { value: string; label: string; person?: T },
		isSelected: boolean,
	) => React.ReactNode
	height?: string
}

export function Combobox<T = unknown>({
	items,
	value,
	onValueChange,
	placeholder = "Select item...",
	emptyText = "No item found.",
	searchPlaceholder = "Search items...",
	className,
	renderItem,
	height = "300px",
}: ComboboxProps<T>) {
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
			<CommandList style={{ height, overflowY: "auto" }}>
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
							{renderItem ? (
								renderItem(item, value === item.value)
							) : (
								<>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === item.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{item.label}
								</>
							)}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
			<PopoverContent
				className="w-full p-0"
				align="start"
				side={isMobile ? "bottom" : "bottom"}
				sideOffset={4}
			>
				{commandContent}
			</PopoverContent>
		</Popover>
	)
}
