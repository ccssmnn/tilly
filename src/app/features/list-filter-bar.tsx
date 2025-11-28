import { Button } from "#shared/ui/button"
import { Plus } from "react-bootstrap-icons"
import { Badge } from "#shared/ui/badge"
import { useAvailableLists, setListFilterInQuery } from "./list-hooks"
import { useRef, useEffect } from "react"

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

	let currentFilter = getListFilterFromQuery(searchQuery)

	let filterButtons = [
		{ tag: "All", count: availableLists.all.count, isAll: true },
	]

	if (availableLists.due.count > 0) {
		filterButtons.push({
			tag: availableLists.due.tag,
			count: availableLists.due.count,
			isAll: false,
		})
	}

	for (let hashtag of availableLists.hashtags) {
		filterButtons.push({
			tag: hashtag.tag,
			count: hashtag.count,
			isAll: false,
		})
	}

	let handleFilterClick = (tag: string) => {
		let newQuery = setListFilterInQuery(searchQuery, tag === "All" ? null : tag)
		setSearchQuery(newQuery)
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
		<div
			className="flex items-center gap-2 overflow-x-auto pb-2"
			ref={scrollContainerRef}
		>
			{filterButtons.map(btn => (
				<Button
					key={btn.tag}
					variant={currentFilter === btn.tag ? "default" : "outline"}
					size="sm"
					onClick={() => handleFilterClick(btn.tag)}
					data-active={currentFilter === btn.tag}
					className="whitespace-nowrap"
				>
					<span>{btn.tag}</span>
					{btn.count > 0 && (
						<Badge variant="secondary" className="ml-2">
							{btn.count}
						</Badge>
					)}
				</Button>
			))}
			<Button
				variant="outline"
				size="sm"
				onClick={onNewList}
				className="whitespace-nowrap"
			>
				<Plus className="size-4" />
				<span className="sr-only">Create new list</span>
			</Button>
		</div>
	)
}

function getListFilterFromQuery(query: string): string | null {
	let match = query.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (match) {
		return match[1].toLowerCase()
	}
	return null
}
