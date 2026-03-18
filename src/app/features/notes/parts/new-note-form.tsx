import { useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { T, useIntl } from "#shared/intl/setup"
import { DialogHeader, DialogTitle, DialogDescription } from "#shared/ui/dialog"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import {
	Combobox,
	ComboboxInput,
	ComboboxContent,
	ComboboxList,
	ComboboxItem,
} from "#shared/ui/combobox"
import { NoteForm } from "../widgets/note-form"
import { format } from "date-fns"

export { NewNoteForm }

type PersonOption = { value: string; label: string }

type NewNoteFormProps = {
	people: co.loaded<typeof Person>[]
	onSubmit: (
		personId: string,
		values: { content: string; pinned: boolean; images?: File[] },
	) => void
	onCancel: () => void
}

function NewNoteForm({ people, onSubmit, onCancel }: NewNoteFormProps) {
	let t = useIntl()
	let [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null)
	let [inputValue, setInputValue] = useState("")
	let prefersReducedMotion = useReducedMotion()

	let peopleById = useMemo(() => {
		let map = new Map<string, co.loaded<typeof Person>>()
		for (let p of people) map.set(p.$jazz.id, p)
		return map
	}, [people])

	let personOptions: PersonOption[] = useMemo(
		() => people.map(p => ({ value: p.$jazz.id, label: p.name })),
		[people],
	)

	let filteredOptions = useMemo(() => {
		if (!inputValue) return personOptions
		let lower = inputValue.toLowerCase()
		return personOptions.filter(o => o.label.toLowerCase().includes(lower))
	}, [personOptions, inputValue])

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					<T k="note.add.title" />
				</DialogTitle>
				<DialogDescription>
					{selectedPerson ? (
						<T
							k="note.add.description"
							params={{ person: selectedPerson.label }}
						/>
					) : (
						<T k="note.select.description" />
					)}
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-3">
				<Combobox
					value={selectedPerson}
					onValueChange={setSelectedPerson}
					onInputValueChange={setInputValue}
					filter={null}
				>
					<ComboboxInput placeholder={t("note.select.search")} />
					<ComboboxContent>
						<ComboboxList>
							{filteredOptions.length === 0 && (
								<p className="text-muted-foreground py-2 text-center text-sm">
									{t("note.select.empty")}
								</p>
							)}
							{filteredOptions.map(option => {
								let person = peopleById.get(option.value)
								return (
									<ComboboxItem key={option.value} value={option}>
										{person && (
											<Avatar className="size-6">
												{person.avatar ? (
													<JazzImage
														imageId={person.avatar.$jazz.id}
														alt={option.label}
														width={24}
														data-slot="avatar-image"
														className="aspect-square size-full object-cover"
													/>
												) : (
													<AvatarFallback className="text-xs">
														{option.label.slice(0, 1)}
													</AvatarFallback>
												)}
											</Avatar>
										)}
										{option.label}
									</ComboboxItem>
								)
							})}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>

				<AnimatePresence>
					{selectedPerson && (
						<motion.div
							initial={{
								opacity: prefersReducedMotion ? 1 : 0,
								height: prefersReducedMotion ? "auto" : 0,
							}}
							animate={{ opacity: 1, height: "auto" }}
							exit={{
								opacity: prefersReducedMotion ? 1 : 0,
								height: prefersReducedMotion ? "auto" : 0,
							}}
							transition={{
								duration: prefersReducedMotion ? 0 : 0.2,
								ease: "easeOut",
							}}
							className="overflow-hidden"
						>
							<NoteForm
								defaultValues={{
									content: "",
									pinned: false,
									createdAt: format(new Date(), "yyyy-MM-dd"),
								}}
								onSubmit={values =>
									onSubmit(selectedPerson.value, {
										content: values.content,
										pinned: values.pinned,
										images: values.images,
									})
								}
								onCancel={onCancel}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	)
}
