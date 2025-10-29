import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "#shared/ui/button"
import { Card } from "#shared/ui/card"
import { People, Bell, Chat, Gear, ArrowRight } from "react-bootstrap-icons"
import { getSignInUrl } from "#app/lib/auth-utils"

export const Route = createFileRoute("/tour")({
	component: TourComponent,
})

function TourComponent() {
	return <div>TOUR</div>
}
