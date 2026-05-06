import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#shared/ui/empty"

export function TourStep({
	icon,
	title,
	description,
	children,
}: {
	icon: React.ReactNode
	title: React.ReactNode
	description: React.ReactNode
	children?: React.ReactNode
}) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">{icon}</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			{children && <EmptyContent>{children}</EmptyContent>}
		</Empty>
	)
}
