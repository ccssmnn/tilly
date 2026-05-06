import {
	cloneElement,
	createElement,
	isValidElement,
	type ReactNode,
} from "react"
import { Alert, AlertDescription } from "#shared/ui/alert"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { cn } from "#app/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderToolMessageIcon(icon?: any) {
	if (!icon) return null

	if (isValidElement<{ className?: string }>(icon)) {
		return cloneElement(icon, {
			className: cn("size-4", icon.props.className),
		})
	}

	if (typeof icon === "function") {
		return createElement(icon, { className: "size-4" })
	}

	if (typeof icon === "object") {
		return <HugeiconsIcon icon={icon} className="size-4" />
	}

	return null
}

export function ToolMessageAccordion({
	open,
	onOpenChange,
	summary,
	content,
	icon,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	summary: ReactNode
	content: ReactNode
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any
}) {
	return (
		<Accordion
			value={open ? ["details"] : []}
			onValueChange={value => onOpenChange(value.includes("details"))}
			className="w-full overflow-visible rounded-none border-0 bg-transparent"
		>
			<AccordionItem
				value="details"
				className="bg-card overflow-hidden rounded-lg border"
			>
				<AccordionTrigger className="items-center gap-3 px-4 py-3 **:data-[slot=accordion-trigger-icon]:hidden pointer-fine:hover:no-underline">
					<div className="flex min-w-0 flex-1 items-center gap-3">
						{renderToolMessageIcon(icon)}
						<span className="min-w-0 flex-1">{summary}</span>
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out group-aria-expanded/accordion-trigger:rotate-180"
						/>
					</div>
				</AccordionTrigger>
				<AccordionContent className="border-border border-t py-3">
					{content}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}

export function ToolMessageSummary({
	children,
	icon,
}: {
	children: ReactNode
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any
}) {
	return (
		<div className="bg-card overflow-hidden rounded-lg border">
			<div className="flex items-center gap-3 px-4 py-3">
				{renderToolMessageIcon(icon)}
				<div className="text-muted-foreground min-w-0 flex-1 text-sm">
					{children}
				</div>
			</div>
		</div>
	)
}

export function ToolMessageWrapper({
	children,
	onClick,
	dialogOpen,
	icon,
}: {
	children: ReactNode
	onClick?: () => void
	dialogOpen?: boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any
}) {
	return (
		<Alert className={cn(onClick && "p-0", dialogOpen && "bg-accent")}>
			{renderToolMessageIcon(icon)}
			{onClick ? (
				<button
					onClick={onClick}
					className={cn(
						"text-left",
						"focus-visible:ring-ring cursor-pointer rounded-sm px-4 py-3 focus-visible:ring-2 focus-visible:outline-none",
						"pointer-fine:hover:bg-accent w-full",
					)}
				>
					<AlertDescription className="text-sm">{children}</AlertDescription>
				</button>
			) : (
				<AlertDescription className="px-4 py-3 text-sm">
					{children}
				</AlertDescription>
			)}
		</Alert>
	)
}
