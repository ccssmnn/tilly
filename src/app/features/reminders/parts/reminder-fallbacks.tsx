import { HugeiconsIcon } from "@hugeicons/react"
import {
	Search01Icon,
	Notification01Icon,
	Delete02Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { BellFill } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"

export {
	EmptyReminders,
	EmptyReminderSearch,
	AllCaughtUp,
	NoDoneReminders,
	NoDeletedReminders,
}

function EmptyReminders() {
	return (
		<div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BellFill />
					</EmptyMedia>
					<EmptyTitle>
						<T k="addReminder.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="addReminder.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function EmptyReminderSearch() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={Search01Icon} />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.noResults.suggestion" />
					</EmptyTitle>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function AllCaughtUp() {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={Notification01Icon} />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.allCaughtUp.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.allCaughtUp.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoDoneReminders() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon
							icon={CheckmarkCircle01Icon}
							className="text-muted-foreground"
						/>
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.empty.noDone" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.empty.noDone.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}

function NoDeletedReminders() {
	return (
		<div className="container mx-auto max-w-6xl px-3 py-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10">
						<HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>
						<T k="reminders.empty.noDeleted" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="reminders.empty.noDeleted.description" />
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
