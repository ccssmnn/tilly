import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { type ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { Button } from "#shared/ui/button"
import { NoteForm } from "#app/features/note-form"
import { PersonSelector } from "#app/features/person-selector"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"

export { NewNote }

function NewNote(props: {
	children: ReactNode
	onSuccess?: (noteId: string) => void
	personId?: string
}) {
	let t = useIntl()
	let { me } = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
	})
	let [selectedPersonId, setSelectedPersonId] = useState(props.personId ?? "")
	let [dialogOpen, setDialogOpen] = useState(false)

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let selectedPersonLabel =
		people.find(person => person.$jazz.id === selectedPersonId)?.name ?? ""

	function handleDialogOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(props.personId ?? "")
		}
		setDialogOpen(open)
	}

	async function handleSave(values: { content: string; pinned: boolean }) {
		if (!me || !selectedPersonId) return

		let result = await tryCatch(
			createNote(selectedPersonId, {
				title: "",
				content: values.content,
				pinned: values.pinned,
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		props.onSuccess?.(result.data.noteID)
		toast.success(t("notes.created.success"))
		setDialogOpen(false)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent
				titleSlot={
					<div className="relative overflow-hidden">
						<div
							className={`transition-all duration-75 ease-out ${
								!selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-full opacity-0"
							}`}
						>
							<DialogHeader>
								<DialogTitle>
									<T k="note.select.title" />
								</DialogTitle>
								<DialogDescription>
									<T k="note.select.description" />
								</DialogDescription>
							</DialogHeader>
						</div>

						<div
							className={`transition-all duration-75 ease-out ${
								selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 translate-x-full opacity-0"
							}`}
						>
							<DialogHeader>
								<DialogTitle>
									<T k="note.add.title" />
								</DialogTitle>
								<DialogDescription>
									<T
										k="note.add.description"
										params={{ person: selectedPersonLabel }}
									/>
								</DialogDescription>
							</DialogHeader>
						</div>
					</div>
				}
			>
				<div className="relative overflow-hidden">
					<div
						className={`transition-all duration-75 ease-out ${
							!selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 -translate-x-full opacity-0"
						}`}
					>
						<div className="space-y-4">
							<PersonSelector
								onPersonSelected={id => setSelectedPersonId(id)}
								searchPlaceholder={t("note.select.search")}
								emptyMessage={t("note.select.empty")}
								selectedPersonId={selectedPersonId}
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => handleDialogOpenChange(false)}
								>
									<T k="common.cancel" />
								</Button>
							</div>
						</div>
					</div>

					<div
						className={`transition-all duration-75 ease-out ${
							selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 translate-x-full opacity-0"
						}`}
					>
						<NoteForm
							defaultValues={{
								content: "",
								pinned: false,
								createdAt: new Date().toISOString().slice(0, 10),
							}}
							onSubmit={handleSave}
							onCancel={() => setSelectedPersonId("")}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
