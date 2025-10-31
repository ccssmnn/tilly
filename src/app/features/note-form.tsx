import { Button } from "#shared/ui/button"
import { MarkdownEditor } from "#shared/ui/markdown-editor"
import { Switch } from "#shared/ui/switch"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { T, useIntl } from "#shared/intl/setup"
import { useState } from "react"

function createNoteFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		content: z.string().min(1, t("note.form.content.required")),
		pinned: z.boolean(),
	})
}

type NoteFormValues = {
	content: string
	pinned: boolean
}

export function NoteForm({
	defaultValues,
	onCancel,
	onSubmit,
}: {
	defaultValues?: NoteFormValues
	onCancel: () => void
	onSubmit: (data: NoteFormValues) => void
}) {
	let t = useIntl()
	let noteFormSchema = createNoteFormSchema(t)
	let [placeholder] = useState(t("note.form.placeholder"))
	let form = useForm<NoteFormValues>({
		resolver: zodResolver(noteFormSchema),
		defaultValues: {
			content: defaultValues?.content || "",
			pinned: defaultValues?.pinned || false,
		},
	})

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="note.form.content.label" />
							</FormLabel>
							<FormControl>
								<MarkdownEditor
									placeholder={placeholder}
									rows={4}
									value={field.value}
									onChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="pinned"
					render={({ field }) => (
						<FormItem className="border-border flex flex-row items-center justify-between rounded-lg border p-3">
							<div className="space-y-0.5">
								<FormLabel className="text-base">
									<T k="note.form.pin.label" />
								</FormLabel>
								<div className="text-muted-foreground text-sm">
									<T k="note.form.pin.description" />
								</div>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
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
				</div>
			</form>
		</Form>
	)
}
