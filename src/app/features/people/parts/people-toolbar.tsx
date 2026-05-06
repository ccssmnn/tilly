import { useId, type ReactNode, type RefObject } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { useIntl } from "#shared/intl/setup"
import { useAutoFocusInput } from "#app/hooks/use-auto-focus-input"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#shared/ui/input-group"

export { PeopleToolbar, PeopleSearch }

function PeopleToolbar({ children }: { children?: ReactNode }) {
	return (
		<div className="my-6 flex items-center justify-end gap-3">{children}</div>
	)
}

function PeopleSearch({
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
				{t("people.search.placeholder")}
			</label>
			<InputGroup>
				<InputGroupInput
					ref={autoFocusRef}
					id={searchInputId}
					name="people-search"
					type="search"
					enterKeyHint="search"
					placeholder={t("people.search.placeholder")}
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
							aria-label={t("people.search.clearLabel")}
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
