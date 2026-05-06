import { formatDistanceToNow } from "date-fns"
import { de as dfnsDe } from "date-fns/locale"
import { useLocale, useIntl } from "#shared/intl/setup"

export { CreatedAtTimestamp, UpdatedAtTimestamp }

type WithCreatedAt = {
	createdAt?: Date | null
	$jazz: { createdAt: number }
}

type WithUpdatedAt = {
	createdAt?: Date | null
	updatedAt?: Date | null
	$jazz: { createdAt: number; lastUpdatedAt?: number }
}

function CreatedAtTimestamp({ value }: { value: WithCreatedAt }) {
	let locale = useLocale()
	let t = useIntl()
	let date = value.createdAt || new Date(value.$jazz.createdAt)

	return (
		<>
			{t("person.added.suffix", {
				ago: formatDistanceToNow(date, {
					addSuffix: true,
					locale: locale === "de" ? dfnsDe : undefined,
				}),
			})}
		</>
	)
}

function UpdatedAtTimestamp({ value }: { value: WithUpdatedAt }) {
	let locale = useLocale()
	let t = useIntl()
	let createdAt = value.createdAt || new Date(value.$jazz.createdAt)
	let updatedAt =
		value.updatedAt ||
		(value.$jazz.lastUpdatedAt && new Date(value.$jazz.lastUpdatedAt))

	if (!updatedAt || updatedAt.getTime() === createdAt.getTime()) return null

	return (
		<>
			{t("person.updated.suffix", {
				ago: formatDistanceToNow(updatedAt, {
					addSuffix: true,
					locale: locale === "de" ? dfnsDe : undefined,
				}),
			})}
		</>
	)
}
