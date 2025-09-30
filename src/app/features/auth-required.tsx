import { useIsAuthenticated } from "jazz-tools/react"
import { Button } from "#shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#shared/ui/card"
import { Lock, Gear } from "react-bootstrap-icons"
import { TypographyMuted } from "#shared/ui/typography"
import { T } from "#shared/intl/setup"
import { Link } from "@tanstack/react-router"

export { SignInRequired }

function SignInRequired() {
	let isAuthenticated = useIsAuthenticated()

	if (isAuthenticated) return null

	return (
		<Card className="mx-auto max-w-sm">
			<CardHeader>
				<div className="flex items-center gap-3">
					<Lock className="text-primary size-5" />
					<h3 className="font-medium">
						<T k="auth.plusRequired.title" />
					</h3>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<TypographyMuted>
					<T k="auth.plusRequired.description" />
				</TypographyMuted>
			</CardContent>
			<CardFooter className="flex-col gap-2">
				<Link to="/settings">
					<Button className="w-full">
						<Gear className="mr-2 size-4" />
						<T k="nav.settings" />
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}
