import { useState } from "react"
import { Upload } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { RadioGroup, RadioGroupItem } from "#shared/ui/radio-group"
import { Label } from "#shared/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createImage } from "jazz-tools/media"
import { cn } from "#app/lib/utils"
import { Person, Note, UserAccount, Reminder } from "#shared/schema/user"
import { co } from "jazz-tools"
import { FileDataSchema, type FileData } from "./data-file-schema"
import { T, useIntl } from "#shared/intl/setup"

let uploadFormSchema = z.object({
	file: z.instanceof(FileList).refine(files => files.length > 0, {
		message: "data.import.noFile",
	}),
	mode: z.enum(["merge", "replace"]),
})

async function dataURLToFile(
	dataURL: string,
	filename = "avatar.jpg",
): Promise<File> {
	let response = await fetch(dataURL)
	let blob = await response.blob()
	return new File([blob], filename, { type: blob.type })
}

export function UploadButton({ userID }: { userID: string }) {
	let t = useIntl()
	let [open, setOpen] = useState(false)

	let form = useForm<z.infer<typeof uploadFormSchema>>({
		resolver: zodResolver(uploadFormSchema),
		defaultValues: {
			mode: "merge",
		},
	})

	async function onSubmit(values: z.infer<typeof uploadFormSchema>) {
		let file = values.file[0]
		if (!file) return
		let text = await file.text()
		let check = FileDataSchema.safeParse(JSON.parse(text))
		if (!check.success) {
			toast.error(t("data.import.invalidFormat"))
			console.error(check.error, check.error.issues)
			return
		}

		let account = await UserAccount.load(userID, {
			resolve: {
				root: {
					people: {
						$each: { notes: { $each: true }, reminders: { $each: true } },
					},
				},
			},
		})
		let root = account?.root
		if (!root?.people) return

		let jsonData: FileData = check.data

		if (values.mode === "replace") {
			root.people.$jazz.splice(0, root.people.length)
		}

		for (let personData of jsonData.people) {
			try {
				let existingPersonIndex = -1
				if (values.mode === "merge") {
					existingPersonIndex = root.people.findIndex(
						p => p?.$jazz.id === personData.id,
					)
				}

				if (existingPersonIndex >= 0) {
					let existingPerson = root.people[existingPersonIndex]
					if (!existingPerson) continue

					if (personData.name) {
						existingPerson.$jazz.set("name", personData.name)
					}
					if (personData.summary) {
						existingPerson.$jazz.set("summary", personData.summary)
					}
					if (personData.deletedAt !== undefined) {
						existingPerson.$jazz.set("deletedAt", personData.deletedAt)
					}
					if (personData.permanentlyDeletedAt !== undefined) {
						existingPerson.$jazz.set(
							"permanentlyDeletedAt",
							personData.permanentlyDeletedAt,
						)
					}
					if (personData.createdAt !== undefined) {
						existingPerson.$jazz.set("createdAt", personData.createdAt)
					}
					if (personData.updatedAt !== undefined) {
						existingPerson.$jazz.set("updatedAt", personData.updatedAt)
					}

					// Handle avatar dataURL
					if (
						personData.avatar?.dataURL &&
						typeof personData.avatar.dataURL === "string"
					) {
						try {
							let avatarFile = await dataURLToFile(
								personData.avatar.dataURL,
								`${personData.name}-avatar.jpg`,
							)
							let avatarImage = await createImage(avatarFile, {
								owner: existingPerson.$jazz.owner,
								maxSize: 2048,
								placeholder: "blur",
								progressive: true,
							})
							existingPerson.$jazz.set("avatar", avatarImage)
						} catch (error) {
							console.warn(
								`Failed to create avatar for ${personData.name}:`,
								error,
							)
						}
					} else if (personData.avatar === null) {
						existingPerson.$jazz.delete("avatar")
					}

					if (personData.notes && existingPerson.notes) {
						for (let noteData of personData.notes) {
							let existingNoteIndex = existingPerson.notes.findIndex(
								n => n?.$jazz.id === noteData.id,
							)
							if (
								existingNoteIndex >= 0 &&
								existingPerson.notes[existingNoteIndex]
							) {
								existingPerson.notes[existingNoteIndex].$jazz.set(
									"content",
									noteData.content,
								)
								if (noteData.pinned !== undefined) {
									existingPerson.notes[existingNoteIndex].$jazz.set(
										"pinned",
										noteData.pinned,
									)
								}
								if (noteData.deletedAt !== undefined) {
									existingPerson.notes[existingNoteIndex].$jazz.set(
										"deletedAt",
										noteData.deletedAt,
									)
								}
								if (noteData.permanentlyDeletedAt !== undefined) {
									existingPerson.notes[existingNoteIndex].$jazz.set(
										"permanentlyDeletedAt",
										noteData.permanentlyDeletedAt,
									)
								}
								if (noteData.createdAt !== undefined) {
									existingPerson.notes[existingNoteIndex].$jazz.set(
										"createdAt",
										noteData.createdAt,
									)
								}
								if (noteData.updatedAt !== undefined) {
									existingPerson.notes[existingNoteIndex].$jazz.set(
										"updatedAt",
										noteData.updatedAt,
									)
								}
							} else {
								let note = Note.create({
									version: 1,
									content: noteData.content,
									pinned: noteData.pinned || false,
									deletedAt: noteData.deletedAt,
									permanentlyDeletedAt: noteData.permanentlyDeletedAt,
									createdAt: noteData.createdAt ?? new Date(),
									updatedAt: noteData.updatedAt ?? new Date(),
								})
								if (noteData.createdAt)
									note.$jazz.set("createdAt", noteData.createdAt)
								if (noteData.updatedAt)
									note.$jazz.set("updatedAt", noteData.updatedAt)
								existingPerson.notes.$jazz.push(note)
							}
						}
					}

					if (personData.reminders && existingPerson.reminders) {
						for (let reminderData of personData.reminders) {
							let existingReminderIndex = existingPerson.reminders.findIndex(
								r => r?.$jazz.id === reminderData.id,
							)
							if (
								existingReminderIndex >= 0 &&
								existingPerson.reminders[existingReminderIndex]
							) {
								let existingReminder =
									existingPerson.reminders[existingReminderIndex]
								existingReminder.$jazz.set("text", reminderData.text)
								existingReminder.$jazz.set("dueAtDate", reminderData.dueAtDate)
								if (reminderData.repeat !== undefined) {
									existingReminder.$jazz.set("repeat", reminderData.repeat)
								}
								if (reminderData.done !== undefined) {
									existingReminder.$jazz.set("done", reminderData.done)
								}
								if (reminderData.deletedAt !== undefined) {
									existingReminder.$jazz.set(
										"deletedAt",
										reminderData.deletedAt,
									)
								}
								if (reminderData.permanentlyDeletedAt !== undefined) {
									existingReminder.$jazz.set(
										"permanentlyDeletedAt",
										reminderData.permanentlyDeletedAt,
									)
								}
								if (reminderData.createdAt !== undefined) {
									existingReminder.$jazz.set(
										"createdAt",
										reminderData.createdAt,
									)
								}
								if (reminderData.updatedAt !== undefined) {
									existingReminder.$jazz.set(
										"updatedAt",
										reminderData.updatedAt,
									)
								}
							} else {
								let reminder = Reminder.create({
									version: 1,
									text: reminderData.text,
									dueAtDate: reminderData.dueAtDate,
									repeat: reminderData.repeat,
									done: reminderData.done || false,
									deletedAt: reminderData.deletedAt,
									permanentlyDeletedAt: reminderData.permanentlyDeletedAt,
									createdAt: reminderData.createdAt ?? new Date(),
									updatedAt: reminderData.updatedAt ?? new Date(),
								})
								if (reminderData.createdAt)
									reminder.$jazz.set("createdAt", reminderData.createdAt)
								if (reminderData.updatedAt)
									reminder.$jazz.set("updatedAt", reminderData.updatedAt)
								existingPerson.reminders.$jazz.push(reminder)
							}
						}
					}
				} else {
					let notes = co.list(Note).create([])

					if (personData.notes) {
						for (let noteData of personData.notes) {
							let note = Note.create({
								version: 1,
								content: noteData.content,
								pinned: noteData.pinned || false,
								deletedAt: noteData.deletedAt,
								permanentlyDeletedAt: noteData.permanentlyDeletedAt,
								createdAt: noteData.createdAt ?? new Date(),
								updatedAt: noteData.updatedAt ?? new Date(),
							})
							if (noteData.createdAt)
								note.$jazz.set("createdAt", noteData.createdAt)
							if (noteData.updatedAt)
								note.$jazz.set("updatedAt", noteData.updatedAt)
							notes.$jazz.push(note)
						}
					}

					let reminders = co.list(Reminder).create([])
					if (personData.reminders) {
						for (let reminderData of personData.reminders) {
							let reminder = Reminder.create({
								version: 1,
								text: reminderData.text,
								dueAtDate: reminderData.dueAtDate,
								repeat: reminderData.repeat,
								done: reminderData.done || false,
								deletedAt: reminderData.deletedAt,
								permanentlyDeletedAt: reminderData.permanentlyDeletedAt,
								createdAt: reminderData.createdAt ?? new Date(),
								updatedAt: reminderData.updatedAt ?? new Date(),
							})
							if (reminderData.createdAt)
								reminder.$jazz.set("createdAt", reminderData.createdAt)
							if (reminderData.updatedAt)
								reminder.$jazz.set("updatedAt", reminderData.updatedAt)
							reminders.$jazz.push(reminder)
						}
					}

					let person = Person.create({
						version: 1,
						name: personData.name,
						summary: personData.summary,
						notes,
						reminders,
						deletedAt: personData.deletedAt,
						permanentlyDeletedAt: personData.permanentlyDeletedAt,
						createdAt: personData.createdAt ?? new Date(),
						updatedAt: personData.updatedAt ?? new Date(),
					})
					if (personData.createdAt)
						person.$jazz.set("createdAt", personData.createdAt)
					if (personData.updatedAt)
						person.$jazz.set("updatedAt", personData.updatedAt)

					// Handle avatar dataURL for new person
					if (personData.avatar?.dataURL) {
						try {
							let avatarFile = await dataURLToFile(
								personData.avatar.dataURL,
								`${personData.name}-avatar.jpg`,
							)
							let avatarImage = await createImage(avatarFile, {
								owner: person.$jazz.owner,
								maxSize: 2048,
								placeholder: "blur",
								progressive: true,
							})
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							person.$jazz.set("avatar", avatarImage as any) // TODO: is this an error on the jazz side of things?
						} catch (error) {
							console.warn(
								`Failed to create avatar for ${personData.name}:`,
								error,
							)
						}
					}

					root.people.$jazz.push(person)
				}
			} catch (error) {
				console.error(`Error processing person ${personData.name}:`, error)
				toast.error(t("data.import.personError", { name: personData.name }))
			}
		}

		toast.success(
			values.mode === "replace"
				? t("data.import.success.replace")
				: t("data.import.success.merge"),
		)
		setOpen(false)
		form.reset()
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Upload className="mr-2 h-4 w-4" />
					<T k="data.import.button" />
				</Button>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="data.import.dialog.title" />
						</DialogTitle>
					</DialogHeader>
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="file"
							render={({ field: { onChange, value } }) => (
								<FormItem>
									<FormLabel>
										<T k="data.import.dialog.fileLabel" />
									</FormLabel>
									<FormControl>
										<div className="flex items-center space-x-3">
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													let input = document.createElement("input")
													input.type = "file"
													input.accept = ".tilly.json"
													input.onchange = e => {
														let target = e.target as HTMLInputElement
														onChange(target.files)
													}
													input.click()
												}}
											>
												<T k="data.import.dialog.chooseFile" />
											</Button>
											<span className="text-muted-foreground text-sm">
												{value && value.length > 0
													? value[0].name
													: t("data.import.dialog.noFileSelected")}
											</span>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="mode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="data.import.dialog.modeLabel" />
									</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<Label
												htmlFor="merge"
												className={cn(
													"border-border hover:bg-muted/50 flex cursor-pointer items-center space-x-4 rounded-md border p-3 transition-colors",
													field.value === "merge" &&
														"bg-accent text-accent-foreground",
												)}
											>
												<RadioGroupItem
													value="merge"
													id="merge"
													className="h-5 w-5"
												/>
												<div className="flex-1">
													<div className="text-sm font-medium">
														<T k="data.import.mode.merge" />
													</div>
													<div className="text-muted-foreground text-sm">
														<T k="data.import.mode.merge.description" />
													</div>
												</div>
											</Label>
											<Label
												htmlFor="replace"
												className={cn(
													"border-border hover:bg-muted/50 flex cursor-pointer items-center space-x-4 rounded-md border p-3 transition-colors",
													field.value === "replace" &&
														"bg-accent text-accent-foreground",
												)}
											>
												<RadioGroupItem
													value="replace"
													id="replace"
													className="h-5 w-5"
												/>
												<div className="flex-1">
													<div className="text-sm font-medium">
														<T k="data.import.mode.replace" />
													</div>
													<div className="text-muted-foreground text-sm">
														<T k="data.import.mode.replace.description" />
													</div>
												</div>
											</Label>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={form.formState.isSubmitting}
								className="flex-1"
							>
								<T k="data.import.dialog.cancel" />
							</Button>
							<Button
								type="submit"
								disabled={form.formState.isSubmitting}
								className={cn(
									"flex-1",
									form.formState.isSubmitting && "animate-pulse",
								)}
							>
								{form.formState.isSubmitting
									? t("data.import.dialog.importing")
									: t("data.import.dialog.import")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
