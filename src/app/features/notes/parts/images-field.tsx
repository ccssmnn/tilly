import { useState } from "react"
import { X, Plus } from "react-bootstrap-icons"
import { Note } from "#shared/schema/user"
import type { co } from "jazz-tools"
import { Image as JazzImage } from "jazz-tools/react"
import { Link } from "@tanstack/react-router"
import { T } from "#shared/intl/setup"
import { Button } from "#shared/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "#shared/ui/tooltip"
import type { useForm } from "react-hook-form"
import type { NoteFormValues } from "../lib/note-form-schema"

export { ImagesField }

function ImagesField({
	value,
	note,
	form,
	fileInputRef,
	hasPlusAccess,
}: {
	value: File[]
	note?: co.loaded<typeof Note>
	form: ReturnType<typeof useForm<NoteFormValues>>
	fileInputRef: React.RefObject<HTMLInputElement | null>
	hasPlusAccess: boolean
}) {
	let [previews, setPreviews] = useState<string[]>([])
	let [removedExistingIds, setRemovedExistingIds] = useState<Set<string>>(
		new Set(),
	)

	function updatePreviews(files: File[]) {
		files.forEach((file, index) => {
			if (previews[index]) return
			let reader = new FileReader()
			reader.onloadend = () => {
				setPreviews(prev => {
					let next = [...prev]
					next[index] = reader.result as string
					return next
				})
			}
			reader.readAsDataURL(file)
		})
	}

	if (value.length > 0 && previews.length < value.length) {
		updatePreviews(value)
	}

	function removeNewImage(index: number) {
		let current = form.getValues("images") || []
		form.setValue(
			"images",
			current.filter((_, i) => i !== index),
		)
		setPreviews(prev => prev.filter((_, i) => i !== index))
	}

	function removeExistingImage(imageId: string) {
		setRemovedExistingIds(prev => {
			let updated = new Set(prev).add(imageId)
			form.setValue("removedImageIds", Array.from(updated))
			return updated
		})
	}

	let allExistingImages = note?.images?.$isLoaded
		? Array.from(note.images.values())
		: []
	let existingImages = allExistingImages.filter(
		img => img && !removedExistingIds.has(img.$jazz.id),
	)
	let totalImages = existingImages.length + value.length
	let canAddMore = totalImages < 10

	return (
		<div className="space-y-3">
			{totalImages > 0 && (
				<div className="grid grid-cols-2 gap-2">
					{existingImages.map(image => {
						if (!image) return null
						return (
							<div
								key={`existing-${image.$jazz.id}`}
								className="group relative"
							>
								<JazzImage
									imageId={image.$jazz.id}
									alt=""
									className="aspect-video w-full rounded-lg object-cover"
								/>
								<Button
									type="button"
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2 size-11 pointer-fine:size-6"
									onClick={() => removeExistingImage(image.$jazz.id)}
								>
									<X className="size-4" />
								</Button>
							</div>
						)
					})}
					{value.map((_file, index) => (
						<div key={`new-${index}`} className="group relative">
							{previews[index] && (
								<img
									src={previews[index]}
									alt=""
									className="aspect-video w-full rounded-lg object-cover"
								/>
							)}
							<Button
								type="button"
								variant="destructive"
								size="icon"
								className="absolute top-2 right-2 size-11 pointer-fine:size-6"
								onClick={() => removeNewImage(index)}
							>
								<X className="size-4" />
							</Button>
						</div>
					))}
				</div>
			)}
			{canAddMore && (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								disabled={!hasPlusAccess}
								className="w-full"
							>
								<Plus />
								<T
									k="note.form.images.add"
									params={{ count: totalImages.toString() }}
								/>
							</Button>
						}
					/>
					{!hasPlusAccess && (
						<TooltipContent>
							<Link
								to="/settings"
								className="text-blue-500 pointer-fine:hover:underline"
							>
								<T k="note.form.images.requiresPlus" />
							</Link>
						</TooltipContent>
					)}
				</Tooltip>
			)}
		</div>
	)
}
