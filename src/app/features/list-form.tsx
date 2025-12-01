import { useAccount } from "jazz-tools/react"
import { UserAccount, isDeleted } from "#shared/schema/user"
import { T, useIntl } from "#shared/intl/setup"
import { Avatar, AvatarFallback } from "#shared/ui/avatar"
import { Image as JazzImage } from "jazz-tools/react"
import { useMemo } from "react"
import { Check, Hash } from "react-bootstrap-icons"
import { useState } from "react"
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

function getFormSchema(t: ReturnType<typeof useIntl>) {
	return z.object({
		listName: z
			.string()
			.min(1, t("person.listForm.validation.nameRequired"))
			.regex(/^[a-z0-9_]+$/, t("person.listForm.validation.nameFormat")),
		selectedPeople: z
			.set(z.string())
			.min(1, t("person.listForm.validation.peopleRequired")),
	})
}

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

function PeopleListSelector(props: {
	selectedPeople: Set<string>
	onSelectionChange: (selected: Set<string>) => void
	searchPlaceholder: string
	emptyMessage: string
	disabled?: boolean
}) {
	let people = useAccount(UserAccount, {
		resolve: { root: { people: { $each: true } } },
		select: account => {
			if (!account.$isLoaded) return []
			return account.root.people.filter(p => !isDeleted(p))
		},
	})

	let [searchQuery, setSearchQuery] = useState("")

	let filteredPeople = useMemo(() => {
		if (!searchQuery) return people
		return people.filter(person =>
			person.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
	}, [people, searchQuery])

	let handleTogglePerson = (personId: string) => {
		let newSet = new Set(props.selectedPeople)
		if (newSet.has(personId)) {
			newSet.delete(personId)
		} else {
			newSet.add(personId)
		}
		props.onSelectionChange(newSet)
	}

	return (
		<div className="space-y-2">
			<Input
				placeholder={props.searchPlaceholder}
				value={searchQuery}
				onChange={e => setSearchQuery(e.target.value)}
				disabled={props.disabled}
			/>
			<div className="h-64 space-y-1 overflow-y-auto rounded-md">
				{filteredPeople.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center text-sm">
						{props.emptyMessage}
					</div>
				) : (
					filteredPeople.map(person => (
						<button
							type="button"
							key={person.$jazz.id}
							onClick={() => handleTogglePerson(person.$jazz.id)}
							disabled={props.disabled}
							className={`hover:bg-muted active:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors disabled:opacity-50 ${
								props.selectedPeople.has(person.$jazz.id) ? "bg-muted" : ""
							}`}
						>
							<div className="flex h-5 w-5 shrink-0 items-center justify-center">
								{props.selectedPeople.has(person.$jazz.id) && (
									<Check className="h-5 w-5" />
								)}
							</div>
							<Avatar className="size-8">
								{person.avatar ? (
									<JazzImage
										imageId={person.avatar.$jazz.id}
										alt={person.name}
										width={32}
										data-slot="avatar-image"
										className="aspect-square size-full object-cover"
									/>
								) : (
									<AvatarFallback className="text-xs">
										{person.name.slice(0, 1)}
									</AvatarFallback>
								)}
							</Avatar>
							<span className="flex-1 text-sm">{person.name}</span>
						</button>
					))
				)}
			</div>
		</div>
	)
}
