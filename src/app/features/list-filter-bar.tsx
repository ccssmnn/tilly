import { Button } from "#shared/ui/button"
import { Plus } from "react-bootstrap-icons"

import { useAvailableLists, setListFilterInQuery } from "./list-hooks"
import { EditListDialog } from "./edit-list-dialog"
import { useRef, useEffect, useState } from "react"

export { ListFilterBar }

function ListFilterBar({
	people,
	searchQuery,
	setSearchQuery,
	onNewList,
}: {
	people: unknown[]
	searchQuery: string
	setSearchQuery: (query: string) => void
	onNewList: () => void
}) {
	let availableLists = useAvailableLists(people)
	let scrollContainerRef = useRef<HTMLDivElement>(null)
	let touchTimerRef = useRef<number | null>(null)
	let [editListOpen, setEditListOpen] = useState(false)
	let [editingHashtag, setEditingHashtag] = useState<string | null>(null)

	let currentFilter = getListFilterFromQuery(searchQuery)

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
		// If clicking the currently active filter, deactivate it (go back to All)
		if (currentFilter === tag && tag !== "All") {
			let newQuery = setListFilterInQuery(searchQuery, null)
			setSearchQuery(newQuery)
			return
		}

		// Otherwise, activate the clicked filter
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
							variant={currentFilter === btn.tag ? "default" : "outline"}
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
							className="flex-shrink-0 whitespace-nowrap"
							title={
								btn.tag !== "All" && btn.tag !== "#due"
									? "Right-click or long-press to edit"
									: ""
							}
						>
							<span>{btn.tag}</span>
						</Button>
					))}
					<Button
						variant="outline"
						size="sm"
						onClick={onNewList}
						className="flex-shrink-0 whitespace-nowrap"
						title="Create new list"
					>
						<Plus className="size-4" />
						<span className="sr-only">Create new list</span>
					</Button>
				</div>
			</div>
			<EditListDialog
				open={editListOpen}
				onOpenChange={setEditListOpen}
				hashtag={editingHashtag}
				people={
					people as Array<{
						$jazz: { id: string }
						name: string
						summary?: string
					}>
				}
			/>
		</>
	)
}

function getListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (match) {
		return match[1].toLowerCase()
	}
	return null
}
