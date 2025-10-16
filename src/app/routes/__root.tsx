import {
	createRootRouteWithContext,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router"
import { useAccount } from "jazz-tools/react"
import type { ResolveQuery } from "jazz-tools"
import { useEffect } from "react"
import { toast } from "sonner"
import { UserAccount, isDeleted, isDueToday } from "#shared/schema/user"
import { Navigation } from "#app/components/navigation"
import { co } from "jazz-tools"
import { Button } from "#shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#shared/ui/card"
import { T, useIntl, useLocale } from "#shared/intl/setup"
import { StatusIndicator } from "#app/components/status-indicator"
import { ScrollReset } from "#app/components/scroll-reset"
import { ErrorUI } from "#app/components/error-ui"

export interface MyRouterContext {
	me: co.loaded<typeof UserAccount> | null
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: ({ context, location }) => {
		if (location.pathname === "/app") {
			throw redirect({ to: "/people" })
		}
		if (!context.me) {
			throw redirect({ to: "/" })
		}

		return { me: context.me }
	},
	component: RootComponent,
	errorComponent: ErrorComponent,
	notFoundComponent: NotFoundComponent,
})

function RootComponent() {
	let { me } = useAccount(UserAccount, { resolve: query })

	let people = me?.root?.people ?? []
	let dueReminderCount = people
		.filter(person => !isDeleted(person))
		.flatMap(person => person.reminders)
		.filter(reminder => reminder != null)
		.filter(reminder => !reminder.done && !isDeleted(reminder))
		.filter(reminder => isDueToday(reminder)).length

	useEffect(() => {
		setAppBadge(dueReminderCount)
	}, [dueReminderCount])

	return (
		<>
			<main
				id="scroll-area"
				className="max-h-[100%] overflow-y-scroll"
				style={{
					paddingTop: "max(1.5rem, env(safe-area-inset-top))",
					paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
					paddingRight: "max(0.75rem, env(safe-area-inset-right))",
					paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
				}}
			>
				<div className="container mx-auto max-w-6xl">
					<Outlet />
					<StatusIndicator />
					<div className="h-20 md:h-0" />
				</div>
			</main>
			<ScrollReset containerId="scroll-area" />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
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
	let location = useLocation()
	useEffect(() => {
		console.log("404 Page Not Found:", {
			pathname: location.pathname,
			search: location.search,
			hash: location.hash,
			href: location.href,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
		})
	}, [location.pathname, location.search, location.hash, location.href])

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

let query = {
	root: {
		people: {
			$each: {
				avatar: true,
				notes: { $each: true },
				reminders: { $each: true },
			},
		},
	},
} as const satisfies ResolveQuery<typeof UserAccount>

async function setAppBadge(count: number) {
	let isAppBadgeSupported =
		"setAppBadge" in navigator && "clearAppBadge" in navigator
	if (!isAppBadgeSupported) return

	try {
		if (count > 0) {
			await navigator.setAppBadge(count)
		} else {
			await navigator.clearAppBadge()
		}
	} catch (error) {
		console.warn("Failed to set app badge:", error)
	}
}
