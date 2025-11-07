import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { cn } from "#app/lib/utils"

const components: Partial<Components> = {
	code: ({ children, className, ...props }) => {
		let isInline = !className
		if (isInline) {
			return (
				<code
					className="bg-muted relative rounded px-[0.2rem] py-[0.1rem] font-mono text-xs font-semibold"
					{...props}
				>
					{children}
				</code>
			)
		}

		return (
		<pre className="bg-muted overflow-x-auto rounded p-2">
			<code className="font-mono text-xs" {...props}>
				{children}
			</code>
		</pre>
		)
	},
	pre: ({ children }) => <>{children}</>,

	a: ({ children, href, ...props }) => {
		return (
			<a
				className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
				href={href}
				target="_blank"
				rel="noreferrer"
				{...props}
			>
				{children}
			</a>
		)
	},
	h1: ({ children, ...props }) => {
		return (
			<h1
				className="mt-3 mb-2 scroll-m-20 text-xl font-bold tracking-tight first:mt-0"
				{...props}
			>
				{children}
			</h1>
		)
	},
	h2: ({ children, ...props }) => {
		return (
			<h2
				className="mt-3 mb-2 scroll-m-20 text-lg font-semibold tracking-tight first:mt-0"
				{...props}
			>
				{children}
			</h2>
		)
	},
	h3: ({ children, ...props }) => {
		return (
			<h3
				className="mt-3 mb-2 scroll-m-20 text-base font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h3>
		)
	},
	h4: ({ children, ...props }) => {
		return (
			<h4
				className="mt-3 mb-2 scroll-m-20 text-sm font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h4>
		)
	},
	h5: ({ children, ...props }) => {
		return (
			<h5
				className="mt-3 mb-2 scroll-m-20 text-sm font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h5>
		)
	},
	h6: ({ children, ...props }) => {
		return (
			<h6
				className="mt-3 mb-2 scroll-m-20 text-sm font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h6>
		)
	},
	p: ({ children, ...props }) => {
		return (
			<p className="leading-6 [&:not(:first-child)]:mt-2" {...props}>
				{children}
			</p>
		)
	},
	blockquote: ({ children, ...props }) => {
		return (
			<blockquote className="mt-2 border-l-2 pl-2 italic text-sm" {...props}>
				{children}
			</blockquote>
		)
	},
	table: ({ children, ...props }) => {
		return (
			<div className="my-2 w-full overflow-y-auto">
				<table className="w-full text-sm" {...props}>
					{children}
				</table>
			</div>
		)
	},

	tr: ({ children, ...props }) => {
		return (
			<tr className="even:bg-muted m-0 border-t p-0" {...props}>
				{children}
			</tr>
		)
	},
	th: ({ children, ...props }) => {
		return (
			<th
				className="border px-2 py-1 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right"
				{...props}
			>
				{children}
			</th>
		)
	},
	td: ({ children, ...props }) => {
		return (
			<td
				className="border px-2 py-1 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
				{...props}
			>
				{children}
			</td>
		)
	},
	hr: ({ ...props }) => {
		return <hr className="border-border my-3" {...props} />
	},
}

const remarkPlugins = [remarkGfm]
const rehypePlugins = [rehypeRaw]

interface MarkdownProps {
	children: string
	className?: string
}

const NonMemoizedMarkdown = ({ children, className }: MarkdownProps) => {
	return (
		<div
			className={cn(
				"prose prose-neutral dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
				className,
			)}
		>
			<ReactMarkdown
				remarkPlugins={remarkPlugins}
				rehypePlugins={rehypePlugins}
				components={components}
			>
				{children}
			</ReactMarkdown>
		</div>
	)
}

export const Markdown = memo(
	NonMemoizedMarkdown,
	(prevProps, nextProps) => prevProps.children === nextProps.children,
)
