import { Button } from "#shared/ui/button"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { Collection, Plus } from "react-bootstrap-icons"
import {
	useAvailableLists,
	setListFilterInQuery,
	extractListFilterFromQuery,
	type PersonWithSummary,
} from "./list-hooks"
import { EditListDialog } from "./edit-list-dialog"
import { useIntl, T } from "#shared/intl"
import { useState } from "react"

export { ListFilterButton }

function ListFilterButton({
	people,
	searchQuery,
	setSearchQuery,
	onNewList,
}: {
	people: PersonWithSummary[]
	searchQuery: string
	setSearchQuery: (query: string) => void
	onNewList: () => void
}) {
	let t = useIntl()
	let availableLists = useAvailableLists(people)
	let [editListOpen, setEditListOpen] = useState(false)
	let [editingHashtag, setEditingHashtag] = useState("")
	let [dropdownOpen, setDropdownOpen] = useState(false)

	let currentFilter = extractListFilterFromQuery(searchQuery)

	let handleListSelect = (tag: string) => {
		let isActive = tag === currentFilter
		let newQuery = setListFilterInQuery(searchQuery, isActive ? null : tag)
		setSearchQuery(newQuery)
		setDropdownOpen(false)
	}

	let handleListEdit = (tag: string) => {
		setEditingHashtag(tag)
		setEditListOpen(true)
		setDropdownOpen(false)
	}

	return (
		<>
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">
						<Collection />
						<span className="sr-only md:not-sr-only">
							<T k="person.listFilter.lists" />
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuLabel>
						<T k="person.listFilter.lists" />
					</DropdownMenuLabel>
					{currentFilter && (
						<>
							<DropdownMenuItem onClick={() => handleListEdit(currentFilter)}>
								{t("person.listFilter.editList", {
									listName: currentFilter,
								})}
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuSeparator />
					{availableLists.map(list => (
						<DropdownMenuCheckboxItem
							key={list.tag}
							checked={list.tag === currentFilter}
							onClick={() => handleListSelect(list.tag)}
						>
							{list.tag}
						</DropdownMenuCheckboxItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={onNewList}>
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
		</>
	)
}
