import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Label } from "#shared/ui/label"
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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { T, useIntl } from "#shared/intl/setup"

export { ProfileNameDialog, profileFormSchema }

let profileFormSchema = z.object({
	name: z.string().min(1, {
		message: "Name is required.",
	}),
})

function ProfileNameDialog({
	currentName,
	isOpen,
	onClose,
	onSave,
}: {
	currentName: string
	isOpen: boolean
	onClose: () => void
	onSave: (values: z.infer<typeof profileFormSchema>) => void
}) {
	let t = useIntl()
	let form = useForm<z.infer<typeof profileFormSchema>>({
		resolver: zodResolver(profileFormSchema),
		defaultValues: {
			name: currentName,
		},
	})

	useEffect(() => {
		if (!isOpen) return
		form.reset({ name: currentName })
	}, [currentName, isOpen, form])

	function handleSubmit(data: z.infer<typeof profileFormSchema>) {
		onSave(data)
	}

	function handleCancel() {
		form.reset({ name: currentName })
		onClose()
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={open => {
				if (!open) onClose()
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<T k="settings.profile.displayName.dialog.title" />
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label>
								<T k="settings.profile.displayName.current.label" />
							</Label>
							<p className="text-muted-foreground text-sm">
								{currentName || (
									<T k="settings.profile.displayName.placeholder" />
								)}
							</p>
						</div>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="settings.profile.displayName.new.label" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"settings.profile.displayName.new.placeholder",
											)}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										<T k="settings.profile.displayName.new.description" />
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={handleCancel}
							>
								<T k="settings.profile.displayName.cancel" />
							</Button>
							<Button type="submit" className="flex-1">
								<T k="settings.profile.displayName.save" />
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
