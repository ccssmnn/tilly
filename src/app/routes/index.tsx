import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	beforeLoad: ({ location }) => {
		console.log("INDEX beforeLoad:", {
			pathname: location.pathname,
			href: location.href,
			timestamp: new Date().toISOString(),
		})
		console.log("INDEX beforeLoad: Redirecting to /people")
		throw redirect({ to: "/people" })
	},
})
