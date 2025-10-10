import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { Switch } from "#shared/ui/switch"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shared/ui/select"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Textarea } from "#shared/ui/textarea"
import { useState } from "react"
import { nanoid } from "nanoid"

import { T, useIntl } from "#shared/intl/setup"

let reminderPlaceholders = [
	"reminder.placeholder.1",
	"reminder.placeholder.2",
	"reminder.placeholder.3",
	"reminder.placeholder.4",
	"reminder.placeholder.5",
	"reminder.placeholder.6",
] as const

function getRotatingReminderPlaceholder(t: ReturnType<typeof useIntl>) {
	let index = Math.floor(Date.now() / 7000) % reminderPlaceholders.length
	return t(reminderPlaceholders[index])
}

function createReminderFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		text: z.string().min(1, t("reminder.form.text.required")),
		dueAtDate: z.string().min(1, t("reminder.form.date.required")),
		repeat: z
			.object({
				interval: z.coerce.number(),
				unit: z.enum(["day", "week", "month", "year"]),
			})
			.optional(),
	})
}

type ReminderFormValues = {
	text: string
	dueAtDate: string
	repeat?: {
		interval: number
		unit: "day" | "week" | "month" | "year"
	}
}

export function ReminderForm({
	defaultValues,
	onCancel,
	onSubmit,
}: {
	defaultValues?: ReminderFormValues
	onCancel: () => void
	onSubmit: (data: ReminderFormValues) => void
}) {
	let t = useIntl()
	let reminderFormSchema = createReminderFormSchema(t)
	let form = useForm({
		resolver: zodResolver(reminderFormSchema),
		defaultValues: {
			text: defaultValues?.text || "",
			dueAtDate: defaultValues?.dueAtDate || "",
			repeat: defaultValues?.repeat,
		},
	})
	let [placeholder] = useState(getRotatingReminderPlaceholder(t))
	let [selectKey, setSelectKey] = useState(nanoid())
	let repeat = useWatch({ control: form.control, name: "repeat" })

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
				<FormField
					control={form.control}
					name="text"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="reminder.form.text.label" />
							</FormLabel>
							<FormControl>
								<Textarea placeholder={placeholder} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="dueAtDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="reminder.form.date.label" />
							</FormLabel>
							<FormControl>
								<Input
									style={{
										WebkitAppearance: "none",
									}}
									type="date"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="repeat"
					render={({ field }) => (
						<FormItem className="border-border flex flex-row items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<FormLabel className="text-base">
									<T k="reminder.form.repeat.label" />
								</FormLabel>
							</div>
							<FormControl>
								<Switch
									checked={repeat !== undefined}
									onCheckedChange={checked => {
										if (!checked) {
											field.onChange(undefined)
											setSelectKey(nanoid())
										} else {
											field.onChange({
												interval: 1,
												unit: "day",
											} satisfies typeof field.value)
										}
									}}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				{repeat && (
					<>
						<FormField
							control={form.control}
							name="repeat.interval"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="reminder.form.repeatEvery.label" />
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											inputMode="tel"
											placeholder={t("reminder.form.repeatEvery.placeholder")}
											{...field}
											value={(field.value as string) || ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="repeat.unit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<T k="reminder.form.repeatUnit.label" />
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										key={selectKey}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={t(
														"reminder.form.repeatUnit.placeholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="day">
												<T k="reminder.form.repeatUnit.day" />
											</SelectItem>
											<SelectItem value="week">
												<T k="reminder.form.repeatUnit.week" />
											</SelectItem>
											<SelectItem value="month">
												<T k="reminder.form.repeatUnit.month" />
											</SelectItem>
											<SelectItem value="year">
												<T k="reminder.form.repeatUnit.year" />
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
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
