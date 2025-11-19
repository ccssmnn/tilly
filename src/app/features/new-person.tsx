import { useAccount } from "jazz-tools/react"
import { UserAccount } from "#shared/schema/user"
import { type ReactNode } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shared/ui/dialog"
import { PersonForm } from "#app/features/person-form"
import { createPerson } from "#shared/tools/person-create"
import { tryCatch } from "#shared/lib/trycatch"
import { toast } from "sonner"
import { T, useIntl } from "#shared/intl/setup"

export { NewPerson }

function NewPerson({
	children,
	onSuccess,
}: {
	children: ReactNode
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
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				titleSlot={
					<DialogHeader>
						<DialogTitle>
							<T k="person.new.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="person.new.description" />
						</DialogDescription>
					</DialogHeader>
				}
			>
				<PersonForm
					onSave={handleSave}
					submitButtonText={t("person.create.button")}
				/>
			</DialogContent>
		</Dialog>
	)
}
