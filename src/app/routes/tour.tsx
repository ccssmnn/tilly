import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/tour")({
	component: TourComponent,
})

function TourComponent() {
	return <div>TOUR</div>
}
