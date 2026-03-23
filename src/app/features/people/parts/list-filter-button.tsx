import { InputGroupButton } from "#shared/ui/input-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { Sliders, Plus } from "react-bootstrap-icons"
import type { AvailableList, PersonWithSummary } from "../lib/list-utilities"
import { EditListDialog } from "../widgets/edit-list-dialog"
import { NewListDialog } from "../widgets/new-list-dialog"
import { useIntl, T } from "#shared/intl"
import { useState, type ReactNode } from "react"

export { ListFilter, ListFilterStatus, ListFilterSort, ListFilterLists }

type Option = {
	value: string
	label: string
}

function ListFilter({
	hasActiveFilters,
	children,
}: {
	hasActiveFilters: boolean
	children: ReactNode
}) {
	let t = useIntl()
	let [dropdownOpen, setDropdownOpen] = useState(false)

	return (
		<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
			<DropdownMenuTrigger
				render={
					<InputGroupButton
						variant={hasActiveFilters ? "secondary" : "ghost"}
						size="icon-xs"
						onClick={() => setDropdownOpen(true)}
						aria-label={t("person.listFilter.lists")}
					>
						<Sliders />
					</InputGroupButton>
				}
			/>
			<DropdownMenuContent align="end">{children}</DropdownMenuContent>
		</DropdownMenu>
	)
}

function ListFilterStatus({
	options,
	value,
	onChange,
}: {
	options: Option[]
	value: string
	onChange: (value: string) => void
}) {
	return (
		<>
			<DropdownMenuGroup>
				<DropdownMenuLabel>
					<T k="filter.status" />
				</DropdownMenuLabel>
			</DropdownMenuGroup>
			<DropdownMenuRadioGroup value={value} onValueChange={onChange}>
				{options.map(option => (
					<DropdownMenuRadioItem key={option.value} value={option.value}>
						{option.label}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</>
	)
}

function ListFilterSort({
	options,
	value,
	onChange,
}: {
	options: Option[]
	value: string
	onChange: (value: string) => void
}) {
	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>
					<T k="filter.sort" />
				</DropdownMenuLabel>
			</DropdownMenuGroup>
			<DropdownMenuRadioGroup value={value} onValueChange={onChange}>
				{options.map(option => (
					<DropdownMenuRadioItem key={option.value} value={option.value}>
						{option.label}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</>
	)
}

function ListFilterLists({
	people,
	availableLists,
	value,
	onChange,
}: {
	people: PersonWithSummary[]
	availableLists: AvailableList[]
	value: string | null
	onChange: (value: string | null) => void
}) {
	let t = useIntl()
	let [editListOpen, setEditListOpen] = useState(false)
	let [editingHashtag, setEditingHashtag] = useState("")
	let [newListOpen, setNewListOpen] = useState(false)

	function editList(tag: string) {
		setEditingHashtag(tag)
		setEditListOpen(true)
	}

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>
					<T k="person.listFilter.lists" />
				</DropdownMenuLabel>
			</DropdownMenuGroup>
			{value && (
				<DropdownMenuItem onClick={() => editList(value)}>
					{t("person.listFilter.editList", { listName: value })}
				</DropdownMenuItem>
			)}
			<DropdownMenuRadioGroup
				value={value ?? ""}
				onValueChange={v => onChange(v || null)}
			>
				<DropdownMenuRadioItem value="">
					{t("filter.lists.all")}
				</DropdownMenuRadioItem>
				{availableLists.map(list => (
					<DropdownMenuRadioItem key={list.tag} value={list.tag}>
						{list.tag}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
			<DropdownMenuSeparator />
			<DropdownMenuItem onClick={() => setNewListOpen(true)}>
				<T k="person.listFilter.createNewList" />
				<Plus />
			</DropdownMenuItem>
			<EditListDialog
				open={editListOpen}
				onOpenChange={setEditListOpen}
				hashtag={editingHashtag}
				people={people}
			/>
			<NewListDialog
				open={newListOpen}
				onOpenChange={setNewListOpen}
				people={people}
				onListCreated={hashtag => onChange(hashtag)}
			/>
		</>
	)
}
