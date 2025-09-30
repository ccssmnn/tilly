import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useIsMobile } from "#app/hooks/use-mobile"

export function Toaster({ ...props }: ToasterProps) {
	let isMobile = useIsMobile()

	return (
		<Sonner
			position={isMobile ? "top-center" : "bottom-right"}
			mobileOffset={{
				top: "max(calc(var(--spacing) * 3), env(safe-area-inset-top))",
				bottom: "max(calc(var(--spacing) * 3), env(safe-area-inset-bottom))",
				left: "max(calc(var(--spacing) * 3), env(safe-area-inset-left))",
				right: "max(calc(var(--spacing) * 3), env(safe-area-inset-right))",
			}}
			theme="system"
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			{...props}
		/>
	)
}
