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
import { Combobox } from "#shared/ui/combobox"
import { NoteForm } from "#app/features/note-form"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"

export { NewNote }

function NewNote({
	children,
	onSuccess,
	personId: initialPersonId,
}: {
	children: ReactNode
	onSuccess?: (noteId: string) => void
	personId?: string
}) {
	let { me } = useAccount(UserAccount, {
		resolve: {
			root: {
				people: {
					$each: true,
				},
			},
		},
	})
	let t = useIntl()
	let [selectedPersonId, setSelectedPersonId] = useState(initialPersonId ?? "")
	let [dialogOpen, setDialogOpen] = useState(false)

	let people = (me?.root?.people ?? []).filter(
		person => person && !isDeleted(person),
	)

	let peopleOptions = people.map(person => ({
		value: person.$jazz.id,
		label: person.name,
	}))

	function handlePersonSelected(personId: string) {
		setSelectedPersonId(personId)
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

		onSuccess?.(result.data.noteID)
		toast.success(t("notes.created.success"))
		setDialogOpen(false)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				titleSlot={
					<div className="relative overflow-hidden">
						<div
							className={`transition-all duration-300 ease-out ${
								!selectedPersonId
									? "translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-full opacity-0"
							}`}
						>
							<DialogHeader>
								<DialogTitle>
									<T k="reminder.select.title" />
								</DialogTitle>
								<DialogDescription>
									<T k="reminder.select.description" />
								</DialogDescription>
							</DialogHeader>
						</div>

						<div
							className={`transition-all duration-300 ease-out ${
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
									<T k="note.add.description" />
								</DialogDescription>
							</DialogHeader>
						</div>
					</div>
				}
			>
				<div className="relative overflow-hidden">
					<div
						className={`transition-all duration-300 ease-out ${
							!selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 -translate-x-full opacity-0"
						}`}
					>
						<div className="space-y-4">
							<Combobox
								items={peopleOptions}
								value={selectedPersonId}
								onValueChange={handlePersonSelected}
								placeholder={t("reminder.select.placeholder")}
								emptyText={t("reminder.select.empty")}
								searchPlaceholder={t("reminder.select.search")}
							/>
							<div className="flex justify-end gap-2">
								{/* No cancel button needed on first step */}
							</div>
						</div>
					</div>

					<div
						className={`transition-all duration-300 ease-out ${
							selectedPersonId
								? "translate-x-0 opacity-100"
								: "absolute inset-0 translate-x-full opacity-0"
						}`}
					>
						<NoteForm
							defaultValues={{ content: "", pinned: false }}
							onSubmit={handleSave}
							onCancel={() => {
								setSelectedPersonId(initialPersonId ?? "")
								setDialogOpen(false)
							}}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
