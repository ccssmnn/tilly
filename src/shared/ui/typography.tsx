import { Slot as SlotPrimitive } from "radix-ui"

let { Slot } = SlotPrimitive
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

function TypographyH1({
	children,
	className,
	asChild,
	...props
}: TypographyH1Props) {
	let Component = asChild ? Slot : "h1"
	return (
		<Component
			className={cn(
				"scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyH2({
	children,
	className,
	asChild,
	...props
}: TypographyH2Props) {
	let Component = asChild ? Slot : "h2"
	return (
		<Component
			className={cn(
				"text-foreground mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyH3({
	children,
	className,
	asChild,
	...props
}: TypographyH3Props) {
	let Component = asChild ? Slot : "h3"
	return (
		<Component
			className={cn(
				"mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyH4({
	children,
	className,
	asChild,
	...props
}: TypographyH4Props) {
	let Component = asChild ? Slot : "h4"
	return (
		<Component
			className={cn(
				"scroll-m-20 text-xl font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyP({
	children,
	className,
	asChild,
	...props
}: TypographyPProps) {
	let Component = asChild ? Slot : "p"
	return (
		<Component
			className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyBlockquote({
	children,
	className,
	asChild,
	...props
}: TypographyBlockquoteProps) {
	let Component = asChild ? Slot : "blockquote"
	return (
		<Component
			className={cn("mt-6 border-l-2 pl-6 italic", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyList({
	children,
	className,
	asChild,
	...props
}: TypographyListProps) {
	let Component = asChild ? Slot : "ul"
	return (
		<Component
			className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyInlineCode({
	children,
	className,
	asChild,
	...props
}: TypographyInlineCodeProps) {
	let Component = asChild ? Slot : "code"
	return (
		<Component
			className={cn(
				"bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyLead({
	children,
	className,
	asChild,
	...props
}: TypographyLeadProps) {
	let Component = asChild ? Slot : "p"
	return (
		<Component
			className={cn("text-muted-foreground text-xl", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyLarge({
	children,
	className,
	asChild,
	...props
}: TypographyLargeProps) {
	let Component = asChild ? Slot : "div"
	return (
		<Component className={cn("text-lg font-semibold", className)} {...props}>
			{children}
		</Component>
	)
}

function TypographySmall({
	children,
	className,
	asChild,
	...props
}: TypographySmallProps) {
	let Component = asChild ? Slot : "small"
	return (
		<Component
			className={cn("text-sm leading-none font-medium", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

function TypographyMuted({
	children,
	className,
	asChild,
	...props
}: TypographyMutedProps) {
	let Component = asChild ? Slot : "p"
	return (
		<Component
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		>
			{children}
		</Component>
	)
}

type TypographyProps<T extends keyof JSX.IntrinsicElements> = {
	children: ReactNode
	className?: string
	asChild?: boolean
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
