import { useState } from "react"
import { Download } from "react-bootstrap-icons"
import { type ResolveQuery, type co } from "jazz-tools"
import { highestResAvailable } from "jazz-tools/media"
import { toast } from "sonner"

import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
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
				notes: { $each: true },
				reminders: { $each: true },
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

			if (!accountData?.root?.people || accountData.root.people.length === 0) {
				toast.warning(t("data.export.noData"))
				return
			}

			let peopleWithDataURLs: FilePerson[] = await Promise.all(
				accountData.root.people.map(async (person): Promise<FilePerson> => {
					let avatar = null
					if (person.avatar) {
						let bestImage = highestResAvailable(person.avatar, 2048, 2048)
						let blob = bestImage?.image.toBlob()
						let dataURL = blob
							? await new Promise<string>(resolve => {
									let reader = new FileReader()
									reader.onloadend = () => resolve(reader.result as string)
									reader.readAsDataURL(blob)
								})
							: undefined
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
						notes: person.notes
							.filter(note => note !== null)
							?.map(note => ({
								id: note.$jazz.id,
								content: note.content,
								pinned: note.pinned,
								deletedAt: note.deletedAt,
								permanentlyDeletedAt: note.permanentlyDeletedAt,
								createdAt: note.createdAt,
								updatedAt: note.updatedAt,
							})),
						reminders: person.reminders
							.filter(reminder => reminder !== null)
							?.map(reminder => ({
								id: reminder.$jazz.id,
								text: reminder.text || "",
								dueAtDate: reminder.dueAtDate,
								repeat: reminder.repeat,
								done: reminder.done,
								deletedAt: reminder.deletedAt,
								permanentlyDeletedAt: reminder.permanentlyDeletedAt,
								createdAt: reminder.createdAt,
								updatedAt: reminder.updatedAt,
							})),
					}
				}),
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
					<p className="text-muted-foreground text-sm">
						<T k="data.export.dialog.description" />
					</p>
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
