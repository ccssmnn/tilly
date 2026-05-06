import { cn } from "#app/lib/utils"
import type { JSX, ReactNode } from "react"

export {
	TypographyBlockquote,
	TypographyH1,
	TypographyH2,
	TypographyH3,
	TypographyH4,
	TypographyInlineCode,
	TypographyLarge,
	TypographyLead,
	TypographyList,
	TypographyMuted,
	TypographyP,
	TypographySmall,
}

function TypographyH1({ children, className, ...props }: TypographyH1Props) {
	return (
		<h1
			className={cn(
				"scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
				className,
			)}
			{...props}
		>
			{children}
		</h1>
	)
}

function TypographyH2({ children, className, ...props }: TypographyH2Props) {
	return (
		<h2
			className={cn(
				"text-foreground mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
				className,
			)}
			{...props}
		>
			{children}
		</h2>
	)
}

function TypographyH3({ children, className, ...props }: TypographyH3Props) {
	return (
		<h3
			className={cn(
				"mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			{children}
		</h3>
	)
}

function TypographyH4({ children, className, ...props }: TypographyH4Props) {
	return (
		<h4
			className={cn(
				"scroll-m-20 text-xl font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			{children}
		</h4>
	)
}

function TypographyP({ children, className, ...props }: TypographyPProps) {
	return (
		<p
			className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
			{...props}
		>
			{children}
		</p>
	)
}

function TypographyBlockquote({
	children,
	className,
	...props
}: TypographyBlockquoteProps) {
	return (
		<blockquote
			className={cn("mt-6 border-l-2 pl-6 italic", className)}
			{...props}
		>
			{children}
		</blockquote>
	)
}

function TypographyList({
	children,
	className,
	...props
}: TypographyListProps) {
	return (
		<ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props}>
			{children}
		</ul>
	)
}

function TypographyInlineCode({
	children,
	className,
	...props
}: TypographyInlineCodeProps) {
	return (
		<code
			className={cn(
				"bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
				className,
			)}
			{...props}
		>
			{children}
		</code>
	)
}

function TypographyLead({
	children,
	className,
	...props
}: TypographyLeadProps) {
	return (
		<p className={cn("text-muted-foreground text-xl", className)} {...props}>
			{children}
		</p>
	)
}

function TypographyLarge({
	children,
	className,
	...props
}: TypographyLargeProps) {
	return (
		<div className={cn("text-lg font-semibold", className)} {...props}>
			{children}
		</div>
	)
}

function TypographySmall({
	children,
	className,
	...props
}: TypographySmallProps) {
	return (
		<small
			className={cn("text-sm leading-none font-medium", className)}
			{...props}
		>
			{children}
		</small>
	)
}

function TypographyMuted({
	children,
	className,
	...props
}: TypographyMutedProps) {
	return (
		<p className={cn("text-muted-foreground text-sm", className)} {...props}>
			{children}
		</p>
	)
}

type TypographyProps<T extends keyof JSX.IntrinsicElements> = {
	children: ReactNode
	className?: string
} & Omit<JSX.IntrinsicElements[T], "className" | "children">

type TypographyH1Props = TypographyProps<"h1">
type TypographyH2Props = TypographyProps<"h2">
type TypographyH3Props = TypographyProps<"h3">
type TypographyH4Props = TypographyProps<"h4">
type TypographyPProps = TypographyProps<"p">
type TypographyBlockquoteProps = TypographyProps<"blockquote">
type TypographyListProps = TypographyProps<"ul">
type TypographyInlineCodeProps = TypographyProps<"code">
type TypographyLeadProps = TypographyProps<"p">
type TypographyLargeProps = TypographyProps<"div">
type TypographySmallProps = TypographyProps<"small">
type TypographyMutedProps = TypographyProps<"p">
