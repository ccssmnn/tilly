import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"

import { ErrorUI } from "#app/components/error-ui"
import { Button } from "#shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#shared/ui/card"
import { Link } from "@tanstack/react-router"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { toast } from "sonner"

export interface MyRouterContext {
	me: Extract<co.loaded<typeof UserAccount>, { $isLoaded: true }> | null
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	errorComponent: ErrorComponent,
	notFoundComponent: NotFoundComponent,
})

function RootComponent() {
	return (
		<main
			style={{
				paddingTop: "env(safe-area-inset-top)",
				paddingBottom: "env(safe-area-inset-bottom)",
				paddingRight: "env(safe-area-inset-right)",
				paddingLeft: "env(safe-area-inset-left)",
			}}
		>
			<div className="container mx-auto max-w-4xl px-3 py-6">
				<Outlet />
			</div>
		</main>
	)
}

function ErrorComponent({ error }: { error?: Error }) {
	let t = useIntl()
	let locale = useLocale()

	return (
		<ErrorUI
			error={error}
			title={<T k="error.title" />}
			description={<T k="error.description" />}
			feedbackLink={
				<a
					href={`/${locale}/feedback`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary text-sm hover:underline"
				>
					<T k="error.feedback" />
				</a>
			}
			actions={
				<Button asChild variant="outline" className="w-full">
					<Link to="/">
						<T k="error.goBack" />
					</Link>
				</Button>
			}
			showDetailsLabel={<T k="error.showDetails" />}
			detailsLabel={<T k="error.details" />}
			messageLabel={<T k="error.message" />}
			stackTraceLabel={<T k="error.stackTrace" />}
			copyLabel={<T k="error.copy" />}
			onCopySuccess={() => toast.success(t("error.copySuccess"))}
			onCopyError={() => toast.error(t("error.copyFailure"))}
		/>
	)
}

function NotFoundComponent() {
	return (
		<main className="container mx-auto max-w-6xl px-3 py-6 pb-20 md:pt-20 md:pb-0">
			<Card className="mx-auto max-w-lg">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="text-muted-foreground text-4xl font-bold">404</div>
						<h3 className="font-medium">
							<T k="notFound.title" />
						</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground text-sm">
						<T k="notFound.description" />
					</p>
				</CardContent>
				<CardFooter className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => window.history.back()}
						className="flex-1"
					>
						<T k="notFound.goBack" />
					</Button>
					<Button asChild className="flex-1">
						<Link to="/people">
							<T k="notFound.goToPeople" />
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</main>
	)
}
