import { HugeiconsIcon } from "@hugeicons/react"
import {
	RefreshIcon,
	Calendar01Icon,
	CheckmarkCircle01Icon,
	CircleIcon,
} from "@hugeicons/core-free-icons"
import { T, useIntl, useLocale } from "#shared/intl/setup"

export { ReminderDetails }

function ReminderDetails({
	text,
	dueAt,
	repeat,
	done,
}: {
	text: string
	dueAt?: string
	repeat?: { interval: number; unit: "day" | "week" | "month" | "year" }
	done?: boolean
}) {
	let t = useIntl()
	let locale = useLocale()
	return (
		<>
			<p className="text-sm">{text}</p>
			<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
				{repeat ? (
					<HugeiconsIcon icon={RefreshIcon} className="h-4 w-4" />
				) : (
					<HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
				)}
				<span className="whitespace-nowrap">
					{dueAt
						? new Date(dueAt).toLocaleDateString(locale)
						: t("tool.reminder.noDate")}
				</span>
				{repeat && (
					<span className="whitespace-nowrap">
						<T
							k="tool.reminder.repeats"
							params={{ interval: repeat.interval, unit: repeat.unit }}
						/>
					</span>
				)}
				{done !== undefined && (
					<span className="flex items-center gap-1 whitespace-nowrap">
						{done ? (
							<>
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									className="h-3 w-3 text-green-600"
								/>{" "}
								<T k="tool.reminder.done" />
							</>
						) : (
							<>
								<HugeiconsIcon icon={CircleIcon} className="h-3 w-3" />{" "}
								<T k="tool.reminder.notDone" />
							</>
						)}
					</span>
				)}
			</div>
		</>
	)
}
