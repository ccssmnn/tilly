import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "#shared/ui/drawer"
import { PersonForm } from "#app/features/person-form"
import { createPerson } from "#shared/tools/person-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"

export { NewPerson }

function NewPerson({
	render,
	onSuccess,
}: {
	render: React.ComponentProps<typeof DrawerTrigger>["render"]
	onSuccess?: (personId: string) => void
}) {
	let me = useAccount(UserAccount)
	let t = useIntl()

	async function handleSave(values: {
		name: string
		summary?: string
		avatar?: File | null
	}) {
		let result = await tryCatch(
			createPerson(me.$jazz.id, {
				name: values.name,
				summary: values.summary,
				avatarFile: values.avatar,
			}),
		)
		if (!result.ok) {
			toast.error(
				typeof result.error === "string" ? result.error : result.error.message,
			)
			return
		}

		onSuccess?.(result.data.personID)
		toast.success(t("person.created.success"))
	}

	return (
		<Drawer>
			<DrawerTrigger render={render} />
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>
						<T k="person.new.title" />
					</DrawerTitle>
					<DrawerDescription>
						<T k="person.new.description" />
					</DrawerDescription>
				</DrawerHeader>
				<PersonForm
					onSave={handleSave}
					submitButtonText={t("person.create.button")}
				/>
			</DrawerContent>
		</Drawer>
	)
}
