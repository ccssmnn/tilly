import { Button } from "#shared/ui/button"
import { FormControl, FormItem, FormLabel, FormMessage } from "#shared/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "#shared/ui/avatar"
import { Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { Image as JazzImage } from "jazz-tools/react"
import { useState } from "react"
import { T } from "#shared/intl/setup"
import type { UseFormReturn } from "react-hook-form"
import type { PersonFormValues } from "../lib/person-form-schema"

export { AvatarField }
export type { AvatarFieldProps }

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
