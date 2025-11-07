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
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { Input } from "#shared/ui/input"
import { NoteForm } from "#app/features/note-form"
import { createNote } from "#shared/tools/note-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"
import { useState, useMemo } from "react"

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

	let [searchQuery, setSearchQuery] = useState("")

	let filteredPeople = useMemo(() => {
		if (!searchQuery) return people
		return people.filter(person =>
			person.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
	}, [people, searchQuery])

	let selectedPersonLabel =
		people.find(person => person.$jazz.id === selectedPersonId)?.name ?? ""

	function handlePersonSelected(personId: string) {
		setSelectedPersonId(personId)
	}

	function handleDialogOpenChange(open: boolean) {
		if (!open) {
			setSelectedPersonId(initialPersonId ?? "")
			setSearchQuery("")
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

		onSuccess?.(result.data.noteID)
		toast.success(t("notes.created.success"))
		setDialogOpen(false)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
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
							<Input
								placeholder={t("note.select.search")}
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								autoFocus
							/>
							<div className="h-[300px] space-y-1 overflow-y-auto">
								{filteredPeople.length === 0 ? (
									<div className="text-muted-foreground py-8 text-center">
										{t("note.select.empty")}
									</div>
								) : (
									filteredPeople.map(person => (
										<button
											key={person.$jazz.id}
											onClick={() => handlePersonSelected(person.$jazz.id)}
											className="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
										>
											<Avatar className="size-8">
												{person.avatar ? (
													<JazzImage
														imageId={person.avatar.$jazz.id}
														alt={person.name}
														width={32}
														data-slot="avatar-image"
														className="aspect-square size-full object-cover"
													/>
												) : (
													<AvatarFallback className="text-xs">
														{person.name.slice(0, 1)}
													</AvatarFallback>
												)}
											</Avatar>
											<span className="flex-1">{person.name}</span>
										</button>
									))
								)}
							</div>
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
							defaultValues={{ content: "", pinned: false }}
							onSubmit={handleSave}
							onCancel={() => setSelectedPersonId("")}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
