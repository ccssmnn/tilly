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
import { ExclamationTriangle, Clipboard } from "react-bootstrap-icons"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#shared/ui/accordion"
import { T, useIntl } from "#shared/intl/setup"
import { StatusIndicator } from "#app/components/status-indicator"
import { ScrollReset } from "#app/components/scroll-reset"

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
				className="container mx-auto max-h-[100%] max-w-6xl overflow-y-scroll"
				style={{
					paddingTop: "max(1.5rem, env(safe-area-inset-top))",
					paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
					paddingRight: "max(0.75rem, env(safe-area-inset-right))",
					paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
				}}
			>
				<Outlet />
				<StatusIndicator />
				<div className="h-20 md:h-0" />
			</main>
			<ScrollReset containerId="scroll-area" />
			<Navigation dueReminderCount={dueReminderCount} />
		</>
	)
}

function ErrorComponent({ error }: { error?: Error }) {
	let t = useIntl()
	async function handleCopyError(error: Error) {
		let errorText = `Error Message:\n${error.message}\n\nStack Trace:\n${error.stack || "No stack trace available"}`

		try {
			await navigator.clipboard.writeText(errorText)
			toast.success(t("error.copySuccess"))
		} catch {
			toast.error(t("error.copyFailure"))
		}
	}
	return (
		<main className="container mx-auto max-w-6xl px-3 py-6 pb-20 md:pt-20 md:pb-0">
			<Card className="mx-auto max-w-lg">
				<CardHeader>
					<div className="flex items-center gap-3">
						<ExclamationTriangle className="text-destructive size-5" />
						<h3 className="font-medium">
							<T k="error.title" />
						</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground text-sm">
						<T k="error.description" />
					</p>
					<a
						href="/feedback"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary text-sm hover:underline"
					>
						<T k="error.feedback" />
					</a>
					{error && (
						<Accordion type="single" collapsible>
							<AccordionItem value="error-details">
								<AccordionTrigger className="text-sm">
									<T k="error.showDetails" />
								</AccordionTrigger>
								<AccordionContent>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<p className="text-xs font-medium">
												<T k="error.details" />
											</p>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopyError(error)}
												className="h-6 px-2 text-xs"
											>
												<Clipboard className="size-3" />
												<T k="error.copy" />
											</Button>
										</div>
										<div>
											<p className="mb-1 text-xs font-medium">
												<T k="error.message" />
											</p>
											<pre className="bg-muted overflow-auto rounded p-3 text-xs select-text">
												{error.message}
											</pre>
										</div>
										{error.stack && (
											<div>
												<p className="mb-1 text-xs font-medium">
													<T k="error.stackTrace" />
												</p>
												<pre className="bg-muted max-h-40 overflow-auto rounded p-3 text-xs select-text">
													{error.stack}
												</pre>
											</div>
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					)}
				</CardContent>
				<CardFooter>
					<Button asChild variant="outline" className="w-full">
						<Link to="/">
							<T k="error.goBack" />
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</main>
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
	}, [])

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
