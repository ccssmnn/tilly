import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Textarea } from "#shared/ui/textarea"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useRef } from "react"
import type { KeyboardEvent } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "#shared/ui/tooltip"
import { Kbd, KbdGroup } from "#shared/ui/kbd"
import { isMac } from "#app/hooks/use-pwa"
import { T, useIntl } from "#shared/intl/setup"
import {
	createPersonFormSchema,
	type PersonFormValues,
} from "../lib/person-form-schema"
import { AvatarField } from "../parts/avatar-field"
import { AvatarCropperDialog } from "../parts/avatar-cropper-dialog"
import { getCroppedImg } from "../lib/image-crop"
import { testIds } from "#shared/lib/test-ids"

export { PersonForm }

function PersonForm({
	person,
	onSave,
	submitButtonText,
}: {
	person?: co.loaded<typeof Person>
	onSave: (values: PersonFormValues) => void
	submitButtonText?: string
}) {
	let t = useIntl()
	let personFormSchema = createPersonFormSchema(t)
	let form = useForm<PersonFormValues>({
		resolver: zodResolver(personFormSchema),
		defaultValues: {
			name: person?.name || "",
			summary: person?.summary || "",
			avatar: undefined,
		},
	})

	let [cropperOpen, setCropperOpen] = useState(false)
	let [selectedImage, setSelectedImage] = useState<string | null>(null)
	let fileInputRef = useRef<HTMLInputElement>(null)

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
			form.handleSubmit(onSave)()
		}
	}

	function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
		let file = event.target.files?.[0]
		if (file) {
			let reader = new FileReader()
			reader.onloadend = () => {
				setSelectedImage(reader.result as string)
				setCropperOpen(true)
			}
			reader.readAsDataURL(file)
		}
	}

	async function handleCropComplete(croppedFile: File) {
		form.setValue("avatar", croppedFile)
		setSelectedImage(null)
	}

	return (
		<Form {...form}>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleAvatarChange}
			/>
			<form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
				<FormField
					control={form.control}
					name="avatar"
					render={({ field: { value } }) => (
						<AvatarField
							value={value}
							person={person}
							form={form}
							fileInputRef={fileInputRef}
						/>
					)}
				/>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="person.form.name.label" />
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t("person.form.name.placeholder")}
									onKeyDown={submitOnCtrlEnter}
									data-testid={testIds.person.formNameInput}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="summary"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="person.form.summary.label" />
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("person.form.summary.placeholder")}
									rows={4}
									onKeyDown={submitOnCtrlEnter}
									data-testid={testIds.person.formSummaryInput}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(person || submitButtonText) && (
					<div className="flex justify-end">
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="submit"
										disabled={form.formState.isSubmitting}
										data-testid={testIds.person.formSubmit}
									>
										{form.formState.isSubmitting ? (
											<T k="person.form.saving" />
										) : (
											submitButtonText || <T k="person.form.saveChanges" />
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
				)}
			</form>

			<AvatarCropperDialog
				open={cropperOpen}
				onOpenChange={setCropperOpen}
				imageSrc={selectedImage}
				onCrop={handleCropComplete}
				getCroppedImg={getCroppedImg}
			/>
		</Form>
	)
}
