import type { ReactNode } from "react"
import { TypographyH1 } from "#shared/ui/typography"
import { useIntl } from "#shared/intl/setup"
import { T } from "#shared/intl/setup"

export { AssistantLayout }

function AssistantLayout({
	children,
	hideTitle = false,
}: {
	children: ReactNode
	hideTitle?: boolean
}) {
	let t = useIntl()
	return (
		<div className="space-y-6 md:mt-12">
			<title>{t("assistant.pageTitle")}</title>
			{!hideTitle && (
				<TypographyH1>
					<T k="assistant.title" />
				</TypographyH1>
			)}
			{children}
		</div>
	)
}
