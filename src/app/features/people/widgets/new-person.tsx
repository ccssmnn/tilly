import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { PersonForm } from "./person-form"
import { createPerson } from "#shared/tools/person-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"

export { NewPerson }

function NewPerson({
	render,
	onSuccess,
}: {
	render: React.ComponentProps<typeof DialogTrigger>["render"]
	onSuccess?: (personId: string) => void
}) {
	let me = useAccount(UserAccount)
	let t = useIntl()

	async function handleSave(values: {
		name: string
		summary?: string
		avatar?: File | null
	}) {
		if (!me.$isLoaded) return
		let result = await tryCatch(
			createPerson(me, {
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

		onSuccess?.(result.data.current.personId)
		toast.success(t("person.created.success"))
	}

	return (
		<Dialog>
			<DialogTrigger render={render} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<T k="person.new.title" />
					</DialogTitle>
					<DialogDescription>
						<T k="person.new.description" />
					</DialogDescription>
				</DialogHeader>
				<PersonForm
					onSave={handleSave}
					submitButtonText={t("person.create.button")}
				/>
			</DialogContent>
		</Dialog>
	)
}
