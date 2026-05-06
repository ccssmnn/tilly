import { useId, type ReactNode, type RefObject } from "react"
import {
	FileEarmarkText,
	Bell,
	Search,
	X,
	Collection,
	Sliders,
} from "react-bootstrap-icons"
import { useIntl, T } from "#shared/intl/setup"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { Button } from "#shared/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#shared/ui/input-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"

export {
	PersonTabToolbar,
	PersonTabSwitcher,
	PersonSearchInput,
	PersonStatusFilter,
}

function PersonTabToolbar({ children }: { children: ReactNode }) {
	return <div className="flex flex-1 items-center gap-2">{children}</div>
}

function PersonTabSwitcher({
	tab,
	hasDueReminders,
	notesCount,
	remindersCount,
	onTabChange,
}: {
	tab: "notes" | "reminders"
	hasDueReminders: boolean
	notesCount: number
	remindersCount: number
	onTabChange: (tab: "notes" | "reminders") => void
}) {
	let t = useIntl()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline" className="shrink-0">
						<div className="relative">
							{tab === "notes" ? <FileEarmarkText /> : <Bell />}
							{tab === "reminders" && hasDueReminders && (
								<div className="bg-primary absolute top-0 right-0 size-2 rounded-full" />
							)}
						</div>
						<span className="hidden md:inline">
							{tab === "notes"
								? t("person.detail.notes.tab", { count: notesCount })
								: t("person.detail.reminders.tab", {
										count: remindersCount,
									})}
						</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onClick={() => onTabChange("notes")}>
					<FileEarmarkText />
					<T k="person.detail.notes.tab" params={{ count: notesCount }} />
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onTabChange("reminders")}>
					<div className="relative">
						<Bell />
						{hasDueReminders && (
							<div className="bg-primary absolute top-0 right-0 size-2 rounded-full" />
						)}
					</div>
					<T
						k="person.detail.reminders.tab"
						params={{ count: remindersCount }}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function PersonSearchInput({
	query,
	onChange,
	trailing,
}: {
	query: string
	onChange: (query: string) => void
	trailing?: ReactNode
}) {
	let t = useIntl()
	let searchInputId = useId()
	let autoFocusRef = useAutoFocusInput() as RefObject<HTMLInputElement>

	return (
		<div className="flex-1">
			<label htmlFor={searchInputId} className="sr-only">
				{t("person.detail.search.placeholder")}
			</label>
			<InputGroup>
				<InputGroupInput
					ref={autoFocusRef}
					id={searchInputId}
					name="person-detail-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("person.detail.search.placeholder")}
					value={query}
					onChange={e => onChange(e.target.value)}
				/>
				<InputGroupAddon align="inline-start">
					<Search className="size-4" />
				</InputGroupAddon>
				{query !== "" && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							variant="ghost"
							size="icon-xs"
							aria-label={t("common.clear")}
							onClick={() => onChange("")}
						>
							<X />
						</InputGroupButton>
					</InputGroupAddon>
				)}
				{trailing && (
					<InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
				)}
			</InputGroup>
		</div>
	)
}

function PersonStatusFilter({
	statusOptions,
	statusFilter,
	onStatusFilterChange,
}: {
	statusOptions: { value: string; label: string }[]
	statusFilter: string
	onStatusFilterChange: (filter: string) => void
}) {
	let hasNonDefaultFilters = statusFilter !== "active"

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<InputGroupButton
						variant={hasNonDefaultFilters ? "secondary" : "ghost"}
						size="icon-xs"
						aria-label="Status filter"
					>
						{hasNonDefaultFilters ? <Sliders /> : <Collection />}
					</InputGroupButton>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<T k="filter.status" />
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuRadioGroup
					value={statusFilter}
					onValueChange={onStatusFilterChange}
				>
					{statusOptions.map(option => (
						<DropdownMenuRadioItem key={option.value} value={option.value}>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
