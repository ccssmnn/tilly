import { useId, type ReactNode, type RefObject } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Add01Icon,
	Cancel01Icon,
	Search01Icon,
} from "@hugeicons/core-free-icons"
import { useIntl, T } from "#shared/intl/setup"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import { Button } from "#shared/ui/button"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#shared/ui/input-group"

export { ReminderToolbar, ReminderSearch, NewReminderButton }

function ReminderToolbar({ children }: { children?: ReactNode }) {
	return (
		<div className="mt-6 mb-3 flex items-center justify-end gap-3">
			{children}
		</div>
	)
}

function ReminderSearch({
	query,
	onChange,
	trailing,
}: {
	query: string
	onChange: (query: string) => void
	trailing?: ReactNode
}) {
	let t = useIntl()
	let searchInputId = useId()
	let autoFocusRef = useAutoFocusInput() as RefObject<HTMLInputElement>

	return (
		<div className="w-full">
			<label htmlFor={searchInputId} className="sr-only">
				{t("reminders.search.placeholder")}
			</label>
			<InputGroup>
				<InputGroupInput
					ref={autoFocusRef}
					id={searchInputId}
					name="reminders-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("reminders.search.placeholder")}
					value={query}
					onChange={e => onChange(e.target.value)}
				/>
				<InputGroupAddon align="inline-start">
					<HugeiconsIcon icon={Search01Icon} className="size-4" />
				</InputGroupAddon>
				{query !== "" && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							variant="ghost"
							size="icon-xs"
							aria-label={t("common.clear")}
							onClick={() => onChange("")}
						>
							<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
						</InputGroupButton>
					</InputGroupAddon>
				)}
				{trailing && (
					<InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
				)}
			</InputGroup>
		</div>
	)
}

function NewReminderButton({ onClick }: { onClick: () => void }) {
	return (
		<Button onClick={onClick}>
			<HugeiconsIcon icon={Add01Icon} className="size-4" />
			<span className="sr-only md:not-sr-only">
				<T k="reminders.addButton" />
			</span>
		</Button>
	)
}
