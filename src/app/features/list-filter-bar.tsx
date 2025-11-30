import { Button } from "#shared/ui/button"
import { Plus } from "react-bootstrap-icons"
import {
	useAvailableLists,
	setListFilterInQuery,
	extractListFilterFromQuery,
} from "./list-hooks"
import { EditListDialog } from "./edit-list-dialog"
import { useIntl } from "#shared/intl/setup"
import { useRef, useEffect, useState } from "react"

export { ListFilterBar }

function ListFilterBar({
	people,
	searchQuery,
	setSearchQuery,
	onNewList,
}: {
	people: Array<{
		$jazz: { id: string }
		name: string
		summary?: string
	}>
	searchQuery: string
	setSearchQuery: (query: string) => void
	onNewList: () => void
}) {
	let t = useIntl()
	let availableLists = useAvailableLists(people)
	let scrollContainerRef = useRef<HTMLDivElement>(null)
	let touchTimerRef = useRef<number | null>(null)
	let [editListOpen, setEditListOpen] = useState(false)
	let [editingHashtag, setEditingHashtag] = useState("")

	let currentFilter = extractListFilterFromQuery(searchQuery)

	let filterButtons = [{ tag: "All", isAll: true }]

	if (availableLists.due.count > 0) {
		filterButtons.push({
			tag: availableLists.due.tag,
			isAll: false,
		})
	}

	for (let hashtag of availableLists.hashtags) {
		filterButtons.push({
			tag: hashtag.tag,
			isAll: false,
		})
	}

	let handleFilterClick = (tag: string) => {
		if (currentFilter === tag && tag !== "All") {
			let newQuery = setListFilterInQuery(searchQuery, null)
			setSearchQuery(newQuery)
			return
		}

		let newQuery = setListFilterInQuery(searchQuery, tag === "All" ? null : tag)
		setSearchQuery(newQuery)
	}

	let handleEditList = (tag: string) => {
		if (tag === "All" || tag === "#due") return
		setEditingHashtag(tag)
		setEditListOpen(true)
	}

	let handleTouchStart = (tag: string) => {
		if (tag === "All" || tag === "#due") return
		touchTimerRef.current = window.setTimeout(() => {
			handleEditList(tag)
		}, 500)
	}

	let handleTouchEnd = () => {
		if (touchTimerRef.current) {
			clearTimeout(touchTimerRef.current)
			touchTimerRef.current = null
		}
	}

	useEffect(() => {
		if (scrollContainerRef.current) {
			let activeButton = scrollContainerRef.current.querySelector(
				'[data-active="true"]',
			)
			if (activeButton) {
				activeButton.scrollIntoView({ behavior: "smooth", block: "nearest" })
			}
		}
	}, [currentFilter])

	return (
		<>
			<div className="mb-6 w-full">
				<div
					className="flex items-center gap-2 overflow-x-auto"
					ref={scrollContainerRef}
					style={{ maxWidth: "100vw" }}
				>
					{filterButtons.map(btn => (
						<Button
							key={btn.tag}
							variant={currentFilter === btn.tag ? "default" : "secondary"}
							size="sm"
							onClick={() => handleFilterClick(btn.tag)}
							onContextMenu={e => {
								e.preventDefault()
								if (btn.tag !== "All" && btn.tag !== "#due") {
									handleEditList(btn.tag)
								}
							}}
							onTouchStart={() => handleTouchStart(btn.tag)}
							onTouchEnd={handleTouchEnd}
							data-active={currentFilter === btn.tag}
							title={
								btn.tag !== "All" && btn.tag !== "#due"
									? t("person.listFilter.editTooltip")
									: ""
							}
						>
							<span>{btn.tag}</span>
						</Button>
					))}
					<Button
						variant="secondary"
						size="sm"
						onClick={onNewList}
						className="shrink-0 whitespace-nowrap"
						title={t("person.listFilter.createTooltip")}
					>
						<Plus className="size-4" />
						<span className="sr-only">
							{t("person.listFilter.createTooltip")}
						</span>
					</Button>
				</div>
			</div>
			<EditListDialog
				open={editListOpen}
				onOpenChange={setEditListOpen}
				hashtag={editingHashtag}
				people={people}
			/>
		</>
	)
}
