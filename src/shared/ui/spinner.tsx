import { ArrowRepeat } from "react-bootstrap-icons"

import { cn } from "#app/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<ArrowRepeat
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	)
}

export { Spinner }
