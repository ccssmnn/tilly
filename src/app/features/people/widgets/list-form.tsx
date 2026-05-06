import { T, useIntl } from "#shared/intl/setup"
import { Hash } from "react-bootstrap-icons"
import { Button } from "#shared/ui/button"
import { Input } from "#shared/ui/input"
import { z } from "zod"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#shared/ui/form"
import { getFormSchema } from "../lib/list-form-schema"
import { PeopleListSelector } from "../parts/people-list-selector"

export { ListForm }

function ListForm(props: {
	defaultListName: string
	defaultSelectedPeople: Set<string>
	onSubmit: (values: { listName: string; selectedPeople: Set<string> }) => void
	onDelete?: () => void
	isLoading?: boolean
	mode: "create" | "edit"
}) {
	let t = useIntl()
	let formSchema = getFormSchema(t)
	let form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			listName: props.defaultListName,
			selectedPeople: props.defaultSelectedPeople,
		},
	})

	let selectedPeople = useWatch({
		control: form.control,
		name: "selectedPeople",
	})
	let listName = useWatch({ control: form.control, name: "listName" })

	let hasChanges =
		listName !== props.defaultListName ||
		selectedPeople.size !== props.defaultSelectedPeople.size ||
		[...selectedPeople].some(id => !props.defaultSelectedPeople.has(id))

	let handleSubmit = (values: z.infer<typeof formSchema>) => {
		if (!hasChanges) return
		props.onSubmit({
			listName: values.listName,
			selectedPeople: values.selectedPeople,
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="listName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<T k="person.listForm.name.label" />
							</FormLabel>
							<FormControl>
								<div className="relative">
									<Hash className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
									<Input
										{...field}
										placeholder={t("person.listForm.name.placeholder")}
										onChange={e => field.onChange(e.target.value.toLowerCase())}
										disabled={props.isLoading}
										className="pl-10"
									/>
								</div>
							</FormControl>
							<FormDescription>
								<T k="person.listForm.name.description" />
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-2">
					<label className="text-sm font-medium">
						<T k="person.listForm.selectPeople.label" />
					</label>
					<PeopleListSelector
						selectedPeople={selectedPeople}
						onSelectionChange={newSelection =>
							form.setValue("selectedPeople", newSelection)
						}
						searchPlaceholder={t("person.listForm.search.placeholder")}
						emptyMessage={t("person.listForm.search.empty")}
						disabled={props.isLoading}
					/>
				</div>

				<div className="flex justify-between gap-2 pt-2">
					{props.mode === "edit" && props.onDelete && (
						<Button
							variant="destructive"
							onClick={props.onDelete}
							disabled={props.isLoading}
							type="button"
						>
							<T k="person.listForm.delete" />
						</Button>
					)}
					<div className="ml-auto">
						<Button type="submit" disabled={props.isLoading}>
							{props.isLoading ? (
								<T k="person.listForm.saving" />
							) : (
								<T k="person.listForm.save" />
							)}
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
