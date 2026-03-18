import { createFileRoute } from "@tanstack/react-router"
import { TourScreen } from "#app/features/tour"

export const Route = createFileRoute("/tour")({
	component: TourScreen,
})
