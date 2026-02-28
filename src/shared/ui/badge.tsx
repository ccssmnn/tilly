import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#app/lib/utils"

const badgeVariants = cva(
	"h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground pointer-fine:[a]:hover:bg-primary/80",
				secondary:
					"bg-secondary text-secondary-foreground pointer-fine:[a]:hover:bg-secondary/80",
				destructive:
					"bg-destructive/10 pointer-fine:[a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
				outline:
					"border-border text-foreground pointer-fine:[a]:hover:bg-muted pointer-fine:[a]:hover:text-muted-foreground bg-input/30",
				ghost:
					"pointer-fine:hover:bg-muted pointer-fine:hover:text-muted-foreground dark:pointer-fine:hover:bg-muted/50",
				link: "text-primary underline-offset-4 pointer-fine:hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

function Badge({
	className,
	variant = "default",
	render,
	...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ variant }), className),
			},
			props,
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	})
}

export { Badge, badgeVariants }
