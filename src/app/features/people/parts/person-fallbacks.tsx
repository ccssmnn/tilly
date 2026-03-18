import { Link } from "@tanstack/react-router"
import { ShieldSlash } from "react-bootstrap-icons"
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

export { PersonNotFound, PersonUnauthorized }

function PersonNotFound() {
	return (
		<div className="flex flex-col items-center justify-center py-12 md:mt-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<span className="text-3xl font-bold">404</span>
					</EmptyMedia>
					<EmptyTitle>
						<T k="person.notFound.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="person.notFound.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => window.history.back()}>
							<T k="person.notFound.goBack" />
						</Button>
						<Button>
							<Link to="/people">
								<T k="person.notFound.goToPeople" />
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function PersonUnauthorized() {
	return (
		<div className="flex flex-col items-center justify-center py-12 md:mt-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ShieldSlash />
					</EmptyMedia>
					<EmptyTitle>
						<T k="person.unauthorized.title" />
					</EmptyTitle>
					<EmptyDescription>
						<T k="person.unauthorized.description" />
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => window.history.back()}>
							<T k="person.unauthorized.goBack" />
						</Button>
						<Button>
							<Link to="/people">
								<T k="person.unauthorized.goToPeople" />
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}
