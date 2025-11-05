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
import type { UseFormReturn } from "react-hook-form"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "#shared/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useRef } from "react"
import { Image as JazzImage } from "jazz-tools/react"
import Cropper from "react-easy-crop"
import { tryCatch } from "#shared/lib/trycatch"

import { T, useIntl } from "#shared/intl/setup"

export { PersonForm, AvatarField }

export type { PersonFormValues, AvatarFieldProps }

function createPersonFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		name: z.string().min(1, t("person.form.name.required")),
		summary: z.string().optional(),
		avatar: z.instanceof(File).nullable().optional(),
	})
}

type PersonFormValues = {
	name: string
	summary?: string
	avatar?: File | null
}

type AvatarFieldProps = {
	value: File | null | undefined
	person?: co.loaded<typeof Person>
	form: UseFormReturn<PersonFormValues>
	fileInputRef: React.RefObject<HTMLInputElement | null>
}

function AvatarField({ value, person, form, fileInputRef }: AvatarFieldProps) {
	let [preview, setPreview] = useState<string>()
	let [prevValue, setPrevValue] = useState(value)
	let nameValue = form.watch("name")

	if (prevValue !== value) {
		setPrevValue(value)
		if (value) {
			let reader = new FileReader()
			reader.onloadend = () => {
				setPreview(reader.result as string)
			}
			reader.readAsDataURL(value)
		} else if (value === null) {
			setPreview(undefined)
		}
	}

	return (
		<FormItem>
			<FormLabel>
				<T k="person.form.avatar.label" />
			</FormLabel>
			<div className="flex items-center gap-4">
				<Avatar
					className="size-20 cursor-pointer"
					onClick={() => fileInputRef.current?.click()}
				>
					{preview ? (
						<AvatarImage src={preview} />
					) : person?.avatar ? (
						<JazzImage
							imageId={person.avatar.$jazz.id}
							alt={nameValue}
							width={80}
							data-slot="avatar-image"
							className="aspect-square size-full object-cover shadow-inner"
						/>
					) : null}
					<AvatarFallback key={preview}>
						{nameValue ? nameValue.slice(0, 1) : "?"}
					</AvatarFallback>
				</Avatar>
				<div className="inline-flex flex-1 flex-wrap gap-2">
					<FormControl>
						<Button
							variant="outline"
							type="button"
							onClick={() => fileInputRef.current?.click()}
						>
							{preview || person?.avatar ? (
								<T k="person.form.avatar.change" />
							) : (
								<T k="person.form.avatar.upload" />
							)}
						</Button>
					</FormControl>
					{(person?.avatar || preview) && (
						<Button
							type="button"
							variant="destructive"
							onClick={() => form.setValue("avatar", null)}
						>
							<T k="person.form.avatar.remove" />
						</Button>
					)}
				</div>
			</div>
			<FormMessage />
		</FormItem>
	)
}

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
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(person || submitButtonText) && (
					<div className="flex justify-end">
						<Button type="submit" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? (
								<T k="person.form.saving" />
							) : (
								submitButtonText || <T k="person.form.saveChanges" />
							)}
						</Button>
					</div>
				)}
			</form>

			<AvatarCropperDialog
				open={cropperOpen}
				onOpenChange={setCropperOpen}
				imageSrc={selectedImage}
				onCrop={handleCropComplete}
			/>
		</Form>
	)
}

function AvatarCropperDialog({
	open,
	onOpenChange,
	imageSrc,
	onCrop,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	imageSrc: string | null
	onCrop: (croppedFile: File) => void
}) {
	let [crop, setCrop] = useState({ x: 0, y: 0 })
	let [zoom, setZoom] = useState(1)
	let [croppedAreaPixels, setCroppedAreaPixels] = useState<{
		x: number
		y: number
		width: number
		height: number
	} | null>(null)

	function onCropComplete(
		_: unknown,
		croppedAreaPixels: { x: number; y: number; width: number; height: number },
	) {
		setCroppedAreaPixels(croppedAreaPixels)
	}

	async function handleCrop() {
		if (!imageSrc || !croppedAreaPixels) return

		let result = await tryCatch(
			getCroppedImg(imageSrc, croppedAreaPixels, "avatar.jpg"),
		)
		if (result.ok) {
			onCrop(result.data)
			onOpenChange(false)
		} else {
			console.error("Error cropping image:", result.error)
		}
	}

	function handleCancel() {
		onOpenChange(false)
	}

	if (!imageSrc) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				titleSlot={
					<DialogTitle>
						<T k="person.crop.title" />
					</DialogTitle>
				}
				className="max-w-md"
			>
				<div className="relative h-64 w-full">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={1}
						onCropChange={setCrop}
						onCropComplete={onCropComplete}
						onZoomChange={setZoom}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						<T k="person.crop.cancel" />
					</Button>
					<Button onClick={handleCrop}>
						<T k="person.crop.confirm" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

async function getCroppedImg(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
	fileName: string,
): Promise<File> {
	let image = new Image()
	let canvas = document.createElement("canvas")
	let ctx = canvas.getContext("2d")

	if (!ctx) {
		throw new Error("No 2d context")
	}

	return new Promise((resolve, reject) => {
		image.onload = () => {
			canvas.width = pixelCrop.width
			canvas.height = pixelCrop.height

			ctx.drawImage(
				image,
				pixelCrop.x,
				pixelCrop.y,
				pixelCrop.width,
				pixelCrop.height,
				0,
				0,
				pixelCrop.width,
				pixelCrop.height,
			)

			canvas.toBlob(
				blob => {
					if (!blob) {
						reject(new Error("Canvas is empty"))
						return
					}
					let file = new File([blob], fileName, { type: "image/jpeg" })
					resolve(file)
				},
				"image/jpeg",
				0.95,
			)
		}
		image.onerror = reject
		image.src = imageSrc
	})
}
