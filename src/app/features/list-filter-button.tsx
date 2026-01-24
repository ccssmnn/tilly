import { Button } from "#shared/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { Sliders, Plus } from "react-bootstrap-icons"
import { useAvailableLists, type PersonWithSummary } from "./list-utilities"
import { EditListDialog } from "./edit-list-dialog"
import { NewListDialog } from "./new-list-dialog"
import { useIntl, T } from "#shared/intl"
import { useState } from "react"

export { ListFilterButton }
export type { StatusOption, SortOption }

type StatusOption = {
	value: string
	label: string
}

type SortOption = {
	value: string
	label: string
}

function ListFilterButton({
	people,
	listFilter,
	onListFilterChange,
	statusOptions,
	statusFilter,
	onStatusFilterChange,
	sortOptions,
	sortMode,
	onSortChange,
}: {
	people: PersonWithSummary[]
	listFilter: string | null
	onListFilterChange: (filter: string | null) => void
	statusOptions: StatusOption[]
	statusFilter: string
	onStatusFilterChange: (filter: string) => void
	sortOptions?: SortOption[]
	sortMode?: string
	onSortChange?: (mode: string) => void
}) {
	let t = useIntl()
	let availableLists = useAvailableLists(people)
	let [dropdownOpen, setDropdownOpen] = useState(false)
	let [editListOpen, setEditListOpen] = useState(false)
	let [editingHashtag, setEditingHashtag] = useState("")
	let [newListOpen, setNewListOpen] = useState(false)

	let hasNonDefaultFilters =
		listFilter !== null ||
		statusFilter !== "active" ||
		(sortMode !== undefined && sortMode !== "recent")

	function editList(tag: string) {
		setEditingHashtag(tag)
		setEditListOpen(true)
	}

	return (
		<>
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant={hasNonDefaultFilters ? "secondary" : "outline"}
						onClick={() => setDropdownOpen(true)}
					>
						<Sliders />
						<span className="sr-only">
							<T k="person.listFilter.lists" />
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{/* Status section */}
					<DropdownMenuLabel>
						<T k="filter.status" />
					</DropdownMenuLabel>
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

					{/* Sort section (only if sortOptions provided) */}
					{sortOptions && sortMode !== undefined && onSortChange && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>
								<T k="filter.sort" />
							</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={sortMode}
								onValueChange={onSortChange}
							>
								{sortOptions.map(option => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</>
					)}

					{/* Lists section */}
					<DropdownMenuSeparator />
					<DropdownMenuLabel>
						<T k="person.listFilter.lists" />
					</DropdownMenuLabel>
					{listFilter && (
						<DropdownMenuItem onClick={() => editList(listFilter)}>
							{t("person.listFilter.editList", {
								listName: listFilter,
							})}
						</DropdownMenuItem>
					)}
					<DropdownMenuRadioGroup
						value={listFilter ?? ""}
						onValueChange={value => onListFilterChange(value || null)}
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
				</DropdownMenuContent>
			</DropdownMenu>
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
				onListCreated={hashtag => {
					onListFilterChange(hashtag)
				}}
			/>
		</>
	)
}
