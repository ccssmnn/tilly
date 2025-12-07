import { useState } from "react"
import { Upload, ExclamationTriangle } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Alert, AlertDescription, AlertTitle } from "#shared/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createImage } from "jazz-tools/media"
import { cn } from "#app/lib/utils"
import { Person, Note, UserAccount, Reminder } from "#shared/schema/user"
import { co, Group } from "jazz-tools"
import { FileDataSchema, type FileData } from "./data-file-schema"
import { T, useIntl } from "#shared/intl/setup"

let uploadFormSchema = z.object({
	file: z.instanceof(FileList).refine(files => files.length > 0, {
		message: "data.import.noFile",
	}),
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
		if (!account.$isLoaded) return

		let jsonData: FileData = check.data

		// Replace all existing data
		account.root.people.$jazz.splice(0, account.root.people.length)

		for (let personData of jsonData.people) {
			try {
				let group = Group.create()
				let person = Person.create(
					{
						version: 1,
						name: personData.name,
						summary: personData.summary,
						notes: co.list(Note).create([], group),
						reminders: co.list(Reminder).create([], group),
						deletedAt: personData.deletedAt,
						permanentlyDeletedAt: personData.permanentlyDeletedAt,
						createdAt: personData.createdAt ?? new Date(),
						updatedAt: personData.updatedAt ?? new Date(),
					},
					group,
				)
				if (personData.createdAt)
					person.$jazz.set("createdAt", personData.createdAt)
				if (personData.updatedAt)
					person.$jazz.set("updatedAt", personData.updatedAt)

				// Handle avatar dataURL
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
						person.$jazz.set("avatar", avatarImage as any)
					} catch (error) {
						console.warn(
							`Failed to create avatar for ${personData.name}:`,
							error,
						)
					}
				}

				if (personData.notes) {
					for (let noteData of personData.notes) {
						let note = Note.create(
							{
								version: 1,
								content: noteData.content,
								pinned: noteData.pinned || false,
								deletedAt: noteData.deletedAt,
								permanentlyDeletedAt: noteData.permanentlyDeletedAt,
								createdAt: noteData.createdAt ?? new Date(),
								updatedAt: noteData.updatedAt ?? new Date(),
							},
							group,
						)
						if (noteData.createdAt)
							note.$jazz.set("createdAt", noteData.createdAt)
						if (noteData.updatedAt)
							note.$jazz.set("updatedAt", noteData.updatedAt)

						// Handle note images
						if (noteData.images) {
							let imageList = co.list(co.image()).create([], group)
							for (let imageData of noteData.images) {
								if (imageData?.dataURL) {
									try {
										let imageFile = await dataURLToFile(
											imageData.dataURL,
											`note-image.jpg`,
										)
										let image = await createImage(imageFile, {
											owner: person.$jazz.owner,
											maxSize: 2048,
											placeholder: "blur",
											progressive: true,
										})
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										imageList.$jazz.push(image as any)
									} catch (error) {
										console.warn(`Failed to create note image:`, error)
									}
								}
							}
							if (imageList.length > 0) {
								note.$jazz.set("images", imageList)
							}
						}

						person.notes.$jazz.push(note)
					}
				}

				if (personData.reminders) {
					for (let reminderData of personData.reminders) {
						let reminder = Reminder.create(
							{
								version: 1,
								text: reminderData.text,
								dueAtDate: reminderData.dueAtDate,
								repeat: reminderData.repeat,
								done: reminderData.done || false,
								deletedAt: reminderData.deletedAt,
								permanentlyDeletedAt: reminderData.permanentlyDeletedAt,
								createdAt: reminderData.createdAt ?? new Date(),
								updatedAt: reminderData.updatedAt ?? new Date(),
							},
							group,
						)
						if (reminderData.createdAt)
							reminder.$jazz.set("createdAt", reminderData.createdAt)
						if (reminderData.updatedAt)
							reminder.$jazz.set("updatedAt", reminderData.updatedAt)
						person.reminders.$jazz.push(reminder)
					}
				}

				account.root.people.$jazz.push(person)
			} catch (error) {
				console.error(`Error processing person ${personData.name}:`, error)
				toast.error(t("data.import.personError", { name: personData.name }))
			}
		}

		toast.success(t("data.import.success"))
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
						<DialogDescription>
							<T k="data.import.dialog.description" />
						</DialogDescription>
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

						<Alert variant="destructive">
							<ExclamationTriangle />
							<AlertTitle>
								<T k="data.import.dialog.warning.title" />
							</AlertTitle>
							<AlertDescription>
								<T k="data.import.dialog.warning.description" />
							</AlertDescription>
						</Alert>

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
