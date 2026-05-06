import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { FileEarmarkText } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"

export { EmptyNotes, EmptyNoteSearch, NoDeletedNotes }

function EmptyNotes() {
	return (
		<div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileEarmarkText />
					</EmptyMedia>
					<EmptyTitle>
						<T k="addNote.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="addNote.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function EmptyNoteSearch() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={Search01Icon} />
					</EmptyMedia>
					<EmptyTitle>
						<T k="notes.noResults.suggestion" />
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoDeletedNotes() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10">
						<HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="notes.empty.noDeleted" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="notes.empty.noDeleted.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
