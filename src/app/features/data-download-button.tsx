import { useState } from "react"
import { Download } from "react-bootstrap-icons"
import { type ResolveQuery, type co } from "jazz-tools"
import { highestResAvailable } from "jazz-tools/media"
import { toast } from "sonner"

import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { UserAccount } from "#shared/schema/user"
import { cn } from "#app/lib/utils"
import { type FileData, type FilePerson } from "#app/features/data-file-schema"
import { T, useIntl } from "#shared/intl/setup"

let exportQuery = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: { images: { $each: true } } },
				inactiveNotes: { $each: { images: { $each: true } } },
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		},
		inactivePeople: {
			$each: {
				avatar: true,
				notes: { $each: { images: { $each: true } } },
				inactiveNotes: { $each: { images: { $each: true } } },
				reminders: { $each: true },
				inactiveReminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

export function ExportButton(props: {
	account: co.loaded<typeof UserAccount>
}) {
	let t = useIntl()
	let [isExporting, setIsExporting] = useState(false)
	let [open, setOpen] = useState(false)

	async function exportData() {
		setIsExporting(true)
		try {
			let accountData = await props.account.$jazz.ensureLoaded({
				resolve: exportQuery,
			})

			let allPeople = [
				...accountData.root.people,
				...(accountData.root.inactivePeople ?? []),
			]

			if (allPeople.length === 0) {
				toast.warning(t("data.export.noData"))
				return
			}

			let processPerson = async (
				person: (typeof allPeople)[number],
			): Promise<FilePerson> => {
				let avatar = null
				if (person.avatar) {
					let a = await person.avatar.$jazz.ensureLoaded({ resolve: true })
					let bestImage = highestResAvailable(a, 2048, 2048)
					let blob = bestImage?.image.toBlob()
					let dataURL = blob ? await blobToDataURL(blob) : undefined
					if (dataURL) {
						avatar = { dataURL }
					}
				}

				return {
					id: person.$jazz.id,
					name: person.name,
					summary: person.summary,
					avatar,
					deletedAt: person.deletedAt,
					permanentlyDeletedAt: person.permanentlyDeletedAt,
					createdAt: person.createdAt,
					updatedAt: person.updatedAt,
					notes: await Promise.all(
						[...person.notes, ...(person.inactiveNotes || [])].map(
							async ({ $jazz, ...note }) => {
								let images = null
								if (note.images) {
									images = await Promise.all(
										Array.from(note.images.values())
											.filter(img => img !== null && img !== undefined)
											.map(async i => {
												let img = await i.$jazz.ensureLoaded({ resolve: true })
												let bestImage = highestResAvailable(img, 2048, 2048)
												let blob = bestImage?.image.toBlob()
												let dataURL = blob
													? await blobToDataURL(blob)
													: undefined
												return dataURL ? { dataURL } : null
											}),
									)
									images = images.filter(Boolean)
								}
								return { id: $jazz.id, ...note, images: images ?? undefined }
							},
						),
					),
					reminders: [
						...person.reminders,
						...(person.inactiveReminders || []),
					].map(({ $jazz, ...reminder }) => ({
						id: $jazz.id,
						...reminder,
					})),
				}
			}

			let peopleWithDataURLs: FilePerson[] = await Promise.all(
				allPeople.map(processPerson),
			)

			let exportData: FileData = {
				type: "tilly",
				version: 1,
				people: peopleWithDataURLs,
			}

			let blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: "application/json",
			})
			let url = URL.createObjectURL(blob)
			let a = document.createElement("a")
			a.href = url
			a.download = `export-${new Date().toISOString().split("T")[0]}.tilly.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			toast.success(t("data.export.success"))
			setOpen(false)
		} catch (error) {
			console.error("Export error:", error)
			toast.error(t("data.export.error"))
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Download className="mr-2 h-4 w-4" />
					<T k="data.export.button" />
				</Button>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-md"
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="data.export.dialog.title" />
						</DialogTitle>
					</DialogHeader>
				}
			>
				<div className="space-y-4">
					<DialogDescription>
						<T k="data.export.dialog.description" />
					</DialogDescription>
					<div className="flex space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isExporting}
							className="flex-1"
						>
							<T k="data.export.dialog.cancel" />
						</Button>
						<Button
							onClick={exportData}
							disabled={isExporting}
							className={cn("flex-1", isExporting && "animate-pulse")}
						>
							{isExporting
								? t("data.export.dialog.exporting")
								: t("data.export.dialog.download")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

async function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise(resolve => {
		let reader = new FileReader()
		reader.onloadend = () => resolve(reader.result as string)
		reader.readAsDataURL(blob)
	})
}
