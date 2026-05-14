import { useRef, type KeyboardEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Note } from "#shared/schema/user"
import type { co } from "jazz-tools"
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
import { Button } from "#shared/ui/button"
import { Switch } from "#shared/ui/switch"
import { Input } from "#shared/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "#shared/ui/tooltip"
import { Kbd, KbdGroup } from "#shared/ui/kbd"
import { useHasPlusAccess } from "#app/hooks/use-plus-access"
import { isMac } from "#app/hooks/use-pwa"
import { createNoteFormSchema } from "../lib/note-form-schema"
import type { NoteFormValues } from "../lib/note-form-schema"
import { NoteContentEditor } from "../parts/note-content-editor"
import { ImagesField } from "../parts/images-field"
import { testIds } from "#shared/lib/test-ids"

export { NoteForm }
export type { NoteFormValues }

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
									data-testid={testIds.note.formContentInput}
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
									data-testid={testIds.note.formSubmit}
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
