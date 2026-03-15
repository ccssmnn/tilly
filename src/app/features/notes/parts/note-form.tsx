import { useState, useRef, type KeyboardEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
	TypeBold,
	TypeItalic,
	Link45deg,
	ListUl,
	TypeH3,
	Eye,
	PencilSquare,
	X,
	Plus,
} from "react-bootstrap-icons"
import { Note } from "#shared/schema/user"
import type { co } from "jazz-tools"
import { Image as JazzImage } from "jazz-tools/react"
import { Link } from "@tanstack/react-router"
import { T, useIntl } from "#shared/intl/setup"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "#shared/ui/input-group"
import { Button } from "#shared/ui/button"
import { Switch } from "#shared/ui/switch"
import { Input } from "#shared/ui/input"
import { Markdown } from "#shared/ui/markdown"
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "#shared/ui/tooltip"
import { Kbd, KbdGroup } from "#shared/ui/kbd"
import { applyMarkdownFormat } from "#shared/ui/markdown-editor"
import { useHasPlusAccess } from "#app/features/plus"
import { isMac } from "#app/hooks/use-pwa"

export { NoteForm }
export type { NoteFormValues }

type NoteFormValues = {
	content: string
	images?: File[]
	removedImageIds?: string[]
	pinned: boolean
	createdAt: string
}

function NoteForm({
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
	let { hasPlusAccess } = useHasPlusAccess()
	let schema = createNoteFormSchema(t)
	let fileInputRef = useRef<HTMLInputElement>(null)
	let form = useForm<NoteFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			content: defaultValues?.content || "",
			images: defaultValues?.images || [],
			removedImageIds: defaultValues?.removedImageIds || [],
			pinned: defaultValues?.pinned || false,
			createdAt: defaultValues?.createdAt || format(new Date(), "yyyy-MM-dd"),
		},
	})

	function submitOnModEnter(e: KeyboardEvent) {
		if (form.formState.isSubmitting) return
		if (e.repeat || e.shiftKey || e.altKey) return

		let isModEnter = (e.metaKey || e.ctrlKey) && e.key === "Enter"
		if (isModEnter) {
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
					let current = form.getValues("images") || []
					form.setValue("images", [...current, ...files].slice(0, 10))
					e.target.value = ""
				}}
			/>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="note.form.content.label" />
							</FormLabel>
							<FormControl>
								<NoteContentEditor
									value={field.value}
									onChange={field.onChange}
									onKeyDown={submitOnModEnter}
									placeholder={t("note.form.placeholder")}
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
						<TooltipTrigger
							render={
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
							}
						/>
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

// --- Content editor with InputGroup ---

let toolButtons = [
	{ format: "bold", icon: TypeBold, label: "markdown.bold", key: "B" },
	{ format: "italic", icon: TypeItalic, label: "markdown.italic", key: "I" },
	{ format: "link", icon: Link45deg, label: "markdown.link", key: "K" },
	{ format: "list", icon: ListUl, label: "markdown.list", key: "L" },
	{ format: "heading", icon: TypeH3, label: "markdown.heading", key: "H" },
] as const

function NoteContentEditor({
	value,
	onChange,
	onKeyDown,
	placeholder,
}: {
	value: string
	onChange: (value: string) => void
	onKeyDown?: (e: KeyboardEvent) => void
	placeholder?: string
}) {
	let [showPreview, setShowPreview] = useState(false)
	let textareaRef = useRef<HTMLTextAreaElement>(null)

	function handleKeyDown(e: React.KeyboardEvent) {
		onKeyDown?.(e)
		if (e.defaultPrevented || showPreview) return

		let isModifier = e.metaKey || e.ctrlKey
		if (!isModifier) return

		let shortcuts = ["b", "i", "k", "l", "h"]
		if (!shortcuts.includes(e.key)) return

		e.preventDefault()
		applyMarkdownFormat(
			textareaRef,
			value,
			onChange,
			e.key === "b"
				? "bold"
				: e.key === "i"
					? "italic"
					: e.key === "k"
						? "link"
						: e.key === "l"
							? "list"
							: "heading",
		)
	}

	let toolbar = (
		<TooltipProvider>
			<div className="flex gap-1">
				{toolButtons.map(tool => (
					<Tooltip key={tool.format}>
						<TooltipTrigger
							render={
								<InputGroupButton
									variant="ghost"
									size="icon-xs"
									onMouseDown={e => e.preventDefault()}
									onClick={() =>
										applyMarkdownFormat(
											textareaRef,
											value,
											onChange,
											tool.format,
										)
									}
									disabled={showPreview}
								>
									<tool.icon className="h-5 w-5 pointer-fine:h-4 pointer-fine:w-4" />
								</InputGroupButton>
							}
						/>
						<TooltipContent>
							<T k={tool.label} />{" "}
							<KbdGroup>
								<Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd>
								<Kbd>{tool.key}</Kbd>
							</KbdGroup>
						</TooltipContent>
					</Tooltip>
				))}
			</div>
		</TooltipProvider>
	)

	let toolbarAddon = (
		<InputGroupAddon
			align="block-start"
			className="bg-muted/30 hidden items-center justify-between gap-2 border-b px-2 py-1 pointer-fine:flex"
		>
			{toolbar}
			<PreviewToggle
				showPreview={showPreview}
				onToggle={() => setShowPreview(!showPreview)}
				disabled={!value.trim()}
			/>
		</InputGroupAddon>
	)

	let toolbarAddonBottom = (
		<InputGroupAddon
			align="block-end"
			className="bg-muted/30 flex items-center justify-between gap-2 border-t px-2 py-1 pointer-fine:hidden"
		>
			{toolbar}
			<PreviewToggle
				showPreview={showPreview}
				onToggle={() => setShowPreview(!showPreview)}
				disabled={!value.trim()}
			/>
		</InputGroupAddon>
	)

	if (showPreview) {
		return (
			<div className="border-input bg-input/30 overflow-hidden rounded-xl border">
				<div className="bg-muted/30 hidden items-center justify-between gap-2 border-b px-2 py-1 pointer-fine:flex">
					{toolbar}
					<PreviewToggle
						showPreview={showPreview}
						onToggle={() => setShowPreview(false)}
						disabled={!value.trim()}
					/>
				</div>
				<div className="min-h-[100px] px-3 py-2">
					{value ? (
						<Markdown>{value}</Markdown>
					) : (
						<p className="text-muted-foreground text-sm italic">
							<T k="markdown.noPreview" />
						</p>
					)}
				</div>
				<div className="bg-muted/30 flex items-center justify-between gap-2 border-t px-2 py-1 pointer-fine:hidden">
					{toolbar}
					<PreviewToggle
						showPreview={showPreview}
						onToggle={() => setShowPreview(false)}
						disabled={!value.trim()}
					/>
				</div>
			</div>
		)
	}

	return (
		<div onKeyDown={handleKeyDown}>
			<InputGroup className="h-auto rounded-xl">
				{toolbarAddon}
				<InputGroupTextarea
					ref={textareaRef}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					rows={4}
					className="[&::-webkit-resizer]:hidden"
				/>
				{toolbarAddonBottom}
			</InputGroup>
		</div>
	)
}

function PreviewToggle({
	showPreview,
	onToggle,
	disabled,
}: {
	showPreview: boolean
	onToggle: () => void
	disabled: boolean
}) {
	return (
		<InputGroupButton
			variant="ghost"
			size="xs"
			onMouseDown={e => e.preventDefault()}
			onClick={onToggle}
			disabled={disabled}
			className="text-muted-foreground pointer-fine:hover:text-foreground gap-1 text-sm pointer-fine:text-xs"
		>
			{showPreview ? (
				<>
					<PencilSquare className="h-3 w-3" />
					<span>
						<T k="markdown.edit" />
					</span>
				</>
			) : (
				<>
					<Eye className="h-3 w-3" />
					<span>
						<T k="markdown.preview" />
					</span>
				</>
			)}
		</InputGroupButton>
	)
}

// --- Images field ---

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

// --- Schema ---

function createNoteFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		content: z.string().min(1, t("note.form.content.required")),
		images: z.array(z.instanceof(File)).max(10).optional(),
		removedImageIds: z.array(z.string()).optional(),
		pinned: z.boolean(),
		createdAt: z.string().min(1, t("note.form.createdAt.required")),
	})
}
