import { Button } from "#shared/ui/button"
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons"
import { cn } from "#app/lib/utils"
import { T } from "#shared/intl"

export function StepNavigation({
	currentStep,
	stepCount,
	onPrev,
	onNext,
	onDotClick,
}: {
	currentStep: number
	stepCount: number
	onPrev: () => void
	onNext: () => void
	onDotClick: (index: number) => void
}) {
	return (
		<div className="absolute inset-x-0 bottom-0 flex items-center justify-between">
			<div className="w-32">
				{currentStep > 0 && (
					<Button variant="outline" onClick={onPrev}>
						<ChevronLeft />
						<T k="navigation.previous" />
					</Button>
				)}
			</div>
			<div className="flex items-center justify-center gap-2">
				{Array.from({ length: stepCount }, (_, index) => (
					<button
						type="button"
						key={index}
						onClick={() => onDotClick(index)}
						aria-label={`Go to step ${index + 1}`}
						className={cn(
							"relative rounded-full transition-all",
							currentStep === index ? "size-6" : "size-2",
						)}
					>
						<span
							className={cn(
								"absolute top-1/2 left-1/2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
								currentStep === index
									? "bg-foreground w-6"
									: "bg-foreground/50 pointer-fine:hover:bg-foreground/75 w-2",
							)}
						/>
					</button>
				))}
			</div>
			<div className="flex w-32 justify-end">
				{currentStep !== stepCount - 1 && (
					<Button onClick={onNext}>
						<T k="navigation.next" />
						<ChevronRight />
					</Button>
				)}
			</div>
		</div>
	)
}
