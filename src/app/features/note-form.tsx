import { Button } from "#shared/ui/button"
import { MarkdownEditor } from "#shared/ui/markdown-editor"
import { Switch } from "#shared/ui/switch"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { T, useIntl } from "#shared/intl/setup"
import type { KeyboardEvent } from "react"
import { useState, useRef } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "#shared/ui/tooltip"
import { Kbd, KbdGroup } from "#shared/ui/kbd"
import { Input } from "#shared/ui/input"
import { format } from "date-fns"
import { X, Plus } from "react-bootstrap-icons"
import { Note } from "#shared/schema/user"
import type { co } from "jazz-tools"
import { useAssistantAccess } from "#app/features/plus"
import { Image as JazzImage } from "jazz-tools/react"
import { Link } from "@tanstack/react-router"
import { isMac } from "#app/hooks/use-pwa"

function createNoteFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		content: z.string().min(1, t("note.form.content.required")),
		images: z.array(z.instanceof(File)).max(10).optional(),
		removedImageIds: z.array(z.string()).optional(),
		pinned: z.boolean(),
		createdAt: z.string().min(1, t("note.form.createdAt.required")),
	})
}

type NoteFormValues = {
	content: string
	images?: File[]
	removedImageIds?: string[]
	pinned: boolean
	createdAt: string
}

export function NoteForm({
	defaultValues,
	note,
	onCancel,
	onSubmit,
}: {
	defaultValues?: NoteFormValues
	note?: co.loaded<typeof Note>
	onCancel: () => void
	onSubmit: (data: NoteFormValues) => void
}) {
	let t = useIntl()
	let access = useAssistantAccess()
	let hasPlusAccess = access.status === "granted"
	let noteFormSchema = createNoteFormSchema(t)
	let [placeholder] = useState(t("note.form.placeholder"))
	let fileInputRef = useRef<HTMLInputElement>(null)
	let form = useForm<NoteFormValues>({
		resolver: zodResolver(noteFormSchema),
		defaultValues: {
			content: defaultValues?.content || "",
			images: defaultValues?.images || [],
			removedImageIds: defaultValues?.removedImageIds || [],
			pinned: defaultValues?.pinned || false,
			createdAt: defaultValues?.createdAt || format(new Date(), "yyyy-MM-dd"),
		},
	})

	function submitOnCtrlEnter(e: KeyboardEvent) {
		if (form.formState.isSubmitting) {
			return
		}

		if (e.repeat || e.shiftKey || e.altKey) {
			return
		}

		let isCtrlOrMetaEnter = (e.metaKey || e.ctrlKey) && e.key === "Enter"

		if (isCtrlOrMetaEnter) {
			e.preventDefault()
			form.handleSubmit(onSubmit)()
		}
	}

	return (
		<Form {...form}>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={e => {
					let files = Array.from(e.target.files || [])
					let currentImages = form.getValues("images") || []
					let newImages = [...currentImages, ...files].slice(0, 10)
					form.setValue("images", newImages)
					e.target.value = ""
				}}
			/>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel htmlFor={field.name}>
								<T k="note.form.content.label" />
							</FormLabel>
							<FormControl>
								<MarkdownEditor
									onChange={field.onChange}
									onKeyDown={submitOnCtrlEnter}
									placeholder={placeholder}
									rows={4}
									value={field.value}
									id={field.name}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="images"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{hasPlusAccess ? (
									<T k="note.form.images.label" />
								) : (
									<T k="note.form.images.label.requires-plus" />
								)}
							</FormLabel>
							<ImagesField
								value={field.value || []}
								note={note}
								form={form}
								fileInputRef={fileInputRef}
								hasPlusAccess={hasPlusAccess}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="createdAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="note.form.createdAt.label" />
							</FormLabel>
							<FormControl>
								<Input type="date" className="w-auto" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="pinned"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="note.form.pin.label" />
							</FormLabel>
							<div className="flex items-start justify-between gap-3">
								<FormDescription>
									<T k="note.form.pin.description" />
								</FormDescription>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</div>
						</FormItem>
					)}
				/>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						className="flex-1"
					>
						<T k="form.cancel" />
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="submit"
								disabled={form.formState.isSubmitting}
								className="flex-1"
							>
								{form.formState.isSubmitting ? (
									<T k="form.saving" />
								) : (
									<T k="form.save" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<KbdGroup>
								<Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd>
								<span>+</span>
								<Kbd>Enter</Kbd>
							</KbdGroup>
						</TooltipContent>
					</Tooltip>
				</div>
			</form>
		</Form>
	)
}

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
					let newPreviews = [...prev]
					newPreviews[index] = reader.result as string
					return newPreviews
				})
			}
			reader.readAsDataURL(file)
		})
	}

	if (value.length > 0 && previews.length < value.length) {
		updatePreviews(value)
	}

	function removeNewImage(index: number) {
		let currentImages = form.getValues("images") || []
		let newImages = currentImages.filter((_, i) => i !== index)
		form.setValue("images", newImages)
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
									className="absolute top-2 right-2 size-6"
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
								className="absolute top-2 right-2 size-6"
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
					<TooltipTrigger asChild>
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
					</TooltipTrigger>
					{!hasPlusAccess && (
						<TooltipContent>
							<Link to="/settings" className="text-blue-500 hover:underline">
								<T k="note.form.images.requiresPlus" />
							</Link>
						</TooltipContent>
					)}
				</Tooltip>
			)}
		</div>
	)
}
