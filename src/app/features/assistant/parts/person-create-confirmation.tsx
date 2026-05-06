import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shared/ui/card"
import { TypographyMuted } from "#shared/ui/typography"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useAccount } from "jazz-tools/react-core"
import { UserAccount } from "#shared/schema/user"
import {
	createPersonExecute,
	createPersonTool,
} from "#shared/tools/person-create"
import type { AddToolResultFunction } from "#shared/tools/tools"
import type { InferUITool } from "ai"
import { tryCatch } from "#shared/lib/trycatch"
import { T, useIntl } from "#shared/intl/setup"

export { PersonCreateConfirmation }

type CreatePersonToolUI = InferUITool<typeof createPersonTool>

function PersonCreateConfirmation({
	part,
	addToolResult,
}: {
	part: {
		toolCallId: string
		input: CreatePersonToolUI["input"]
		state: "input-available"
	}
	addToolResult: AddToolResultFunction
}) {
	let me = useAccount(UserAccount)
	let [isCreating, setIsCreating] = useState(false)
	let t = useIntl()

	let handleConfirm = async () => {
		if (!me.$isLoaded) return
		setIsCreating(true)
		let res = await tryCatch(createPersonExecute(me.$jazz.id, part.input))
		if (res.ok) {
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: res.data,
			})
		} else {
			addToolResult({
				tool: "createPerson",
				toolCallId: part.toolCallId,
				output: {
					error:
						res.error instanceof Error
							? res.error.message
							: t("tool.error.failedToCreate"),
				},
			})
		}
		setIsCreating(false)
	}

	let handleReject = () => {
		addToolResult({
			tool: "createPerson",
			toolCallId: part.toolCallId,
			output: {
				cancelled: true,
				reason: t("tool.person.createCancel.reason"),
			},
		})
	}

	return (
		<Card className="border-primary">
			<CardHeader>
				<CardTitle className="font-medium">
					<T
						k="tool.person.createConfirm.title"
						params={{ name: part.input.name }}
					/>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TypographyMuted>
					<T k="tool.person.createConfirm.description" />
				</TypographyMuted>
			</CardContent>
			<CardFooter className="flex justify-end gap-3">
				<Button
					variant="secondary"
					onClick={handleReject}
					disabled={isCreating}
				>
					<HugeiconsIcon icon={Cancel01Icon} className="mr-1 h-4 w-4" />
					<T k="tool.cancel" />
				</Button>
				<Button variant="default" onClick={handleConfirm} disabled={isCreating}>
					<HugeiconsIcon icon={Tick02Icon} className="mr-1 h-4 w-4" />
					<T k="tool.create" />
				</Button>
			</CardFooter>
		</Card>
	)
}
