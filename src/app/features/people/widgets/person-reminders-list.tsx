import { Reminder, Person } from "#shared/schema/user"
import { co } from "jazz-tools"
import { Bell, BellFill, Trash, Check } from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import { Button } from "#shared/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"
import {
	ActiveReminder,
	DoneReminder,
	DeletedReminder,
	NewReminder,
} from "#app/features/reminders"

export { PersonRemindersList }

type PersonRemindersListProps = {
	reminders: co.loaded<typeof Reminder>[]
	person: co.loaded<typeof Person>
	searchQuery: string
	statusFilter: "active" | "done" | "deleted"
}

function PersonRemindersList({
	reminders,
	person,
	searchQuery,
	statusFilter,
}: PersonRemindersListProps) {
	if (reminders.length === 0) {
		if (!searchQuery) {
			if (statusFilter === "deleted") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon" className="bg-destructive/10">
									<Trash className="text-destructive" />
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
			if (statusFilter === "done") {
				return (
					<div className="flex flex-col items-center justify-center py-12">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Check className="text-muted-foreground" />
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
			return (
				<div className="flex flex-col items-center justify-center py-12">
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
						<EmptyContent>
							<NewReminder
								personId={person.$jazz.id}
								render={
									<Button>
										<BellFill />
										<T k="addReminder.button" params={{ name: person.name }} />
									</Button>
								}
							/>
						</EmptyContent>
					</Empty>
				</div>
			)
		}

		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Bell />
						</EmptyMedia>
						<EmptyTitle>
							<T
								k="reminders.empty.withSearch"
								params={{ query: searchQuery }}
							/>
						</EmptyTitle>
						<EmptyDescription>
							<T k="reminders.empty.suggestion.withSearch" />
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<>
			{reminders.map(reminder =>
				reminder.deletedAt ? (
					<DeletedReminder
						key={reminder.$jazz.id}
						reminder={reminder}
						person={person}
						showPerson={false}
						searchQuery={searchQuery}
					/>
				) : reminder.done ? (
					<DoneReminder
						key={reminder.$jazz.id}
						reminder={reminder}
						person={person}
						showPerson={false}
						searchQuery={searchQuery}
					/>
				) : (
					<ActiveReminder
						key={reminder.$jazz.id}
						reminder={reminder}
						person={person}
						showPerson={false}
						searchQuery={searchQuery}
					/>
				),
			)}
		</>
	)
}
