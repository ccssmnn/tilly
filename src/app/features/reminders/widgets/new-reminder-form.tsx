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
	ComboboxEmpty,
} from "#shared/ui/combobox"
import {
	ReminderFields,
	type ReminderFieldValues,
} from "../parts/reminder-fields"

export { NewReminderForm }

type PersonOption = { value: string; label: string }

type NewReminderFormProps = {
	people: co.loaded<typeof Person>[]
	onSubmit: (personId: string, values: ReminderFieldValues) => void
	onCancel: () => void
}

function NewReminderForm({ people, onSubmit, onCancel }: NewReminderFormProps) {
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
					<T k="reminder.add.title" />
				</DialogTitle>
				<DialogDescription>
					{selectedPerson ? (
						<T
							k="reminder.add.description"
							params={{ person: selectedPerson.label }}
						/>
					) : (
						<T k="reminder.select.description" />
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
					<ComboboxInput placeholder={t("reminder.select.search")} />
					<ComboboxContent>
						<ComboboxList>
							<ComboboxEmpty>{t("reminder.select.empty")}</ComboboxEmpty>
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
							<ReminderFields
								onSubmit={values => onSubmit(selectedPerson.value, values)}
								onCancel={onCancel}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	)
}
