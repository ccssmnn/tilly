import {
	createRootRouteWithContext,
	Outlet,
	redirect,
} from "@tanstack/react-router"
import { co } from "jazz-tools"
import { UserAccount } from "#shared/schema/user"

export interface MyRouterContext {
	me: co.loaded<typeof UserAccount> | null
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: ({ location }) => {
		if (location.pathname === "/app") {
			throw redirect({ to: "/people" })
		}
	},
	component: () => <Outlet />,
})
