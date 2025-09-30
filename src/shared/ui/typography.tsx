import { cn } from "#app/lib/utils"
import type { ReactNode } from "react"

interface TypographyProps {
	children: ReactNode
	className?: string
}

export function TypographyH1({ children, className }: TypographyProps) {
	return (
		<h1
			className={cn(
				"scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
				className,
			)}
		>
			{children}
		</h1>
	)
}

export function TypographyH2({ children, className }: TypographyProps) {
	return (
		<h2
			className={cn(
				"mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
				className,
			)}
		>
			{children}
		</h2>
	)
}

export function TypographyH3({ children, className }: TypographyProps) {
	return (
		<h3
			className={cn(
				"mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
				className,
			)}
		>
			{children}
		</h3>
	)
}

export function TypographyH4({ children, className }: TypographyProps) {
	return (
		<h4
			className={cn(
				"scroll-m-20 text-xl font-semibold tracking-tight",
				className,
			)}
		>
			{children}
		</h4>
	)
}

export function TypographyP({ children, className }: TypographyProps) {
	return (
		<p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
			{children}
		</p>
	)
}

export function TypographyBlockquote({ children, className }: TypographyProps) {
	return (
		<blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
			{children}
		</blockquote>
	)
}

export function TypographyList({ children, className }: TypographyProps) {
	return (
		<ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
			{children}
		</ul>
	)
}

export function TypographyInlineCode({ children, className }: TypographyProps) {
	return (
		<code
			className={cn(
				"bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
				className,
			)}
		>
			{children}
		</code>
	)
}

export function TypographyLead({ children, className }: TypographyProps) {
	return (
		<p className={cn("text-muted-foreground text-xl", className)}>{children}</p>
	)
}

export function TypographyLarge({ children, className }: TypographyProps) {
	return (
		<div className={cn("text-lg font-semibold", className)}>{children}</div>
	)
}

export function TypographySmall({ children, className }: TypographyProps) {
	return (
		<small className={cn("text-sm leading-none font-medium", className)}>
			{children}
		</small>
	)
}

export function TypographyMuted({ children, className }: TypographyProps) {
	return (
		<p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
	)
}
