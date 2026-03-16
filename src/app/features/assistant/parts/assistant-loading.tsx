import { TypographyMuted } from "#shared/ui/typography"
import { T } from "#shared/intl/setup"

export { AssistantLoading }

function AssistantLoading() {
	return (
		<div className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] items-center justify-center md:min-h-[calc(100dvh-6rem)]">
			<TypographyMuted>
				<T k="assistant.subscribe.loading" />
			</TypographyMuted>
		</div>
	)
}
