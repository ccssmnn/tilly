import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "#app/lib/utils"

const components: Partial<Components> = {
	code: ({ children, className, ...props }) => {
		const isInline = !className

		if (isInline) {
			return (
				<code
					className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
					{...props}
				>
					{children}
				</code>
			)
		}

		return (
			<pre className="bg-muted overflow-x-auto rounded-lg p-4">
				<code className="font-mono text-sm" {...props}>
					{children}
				</code>
			</pre>
		)
	},
	pre: ({ children }) => <>{children}</>,
	ol: ({ children, ...props }) => {
		return (
			<ol
				className="my-6 ml-6 list-outside list-decimal [&>li]:mt-2"
				{...props}
			>
				{children}
			</ol>
		)
	},
	li: ({ children, ...props }) => {
		return (
			<li className="leading-7" {...props}>
				{children}
			</li>
		)
	},
	ul: ({ children, ...props }) => {
		return (
			<ul className="my-6 ml-6 list-outside list-disc [&>li]:mt-2" {...props}>
				{children}
			</ul>
		)
	},
	strong: ({ children, ...props }) => {
		return (
			<strong className="font-semibold" {...props}>
				{children}
			</strong>
		)
	},
	em: ({ children, ...props }) => {
		return (
			<em className="italic" {...props}>
				{children}
			</em>
		)
	},
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
				className="mt-6 mb-4 scroll-m-20 text-4xl font-extrabold tracking-tight text-balance first:mt-0"
				{...props}
			>
				{children}
			</h1>
		)
	},
	h2: ({ children, ...props }) => {
		return (
			<h2
				className="mt-6 mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
				{...props}
			>
				{children}
			</h2>
		)
	},
	h3: ({ children, ...props }) => {
		return (
			<h3
				className="mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h3>
		)
	},
	h4: ({ children, ...props }) => {
		return (
			<h4
				className="mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h4>
		)
	},
	h5: ({ children, ...props }) => {
		return (
			<h5
				className="mt-6 mb-4 scroll-m-20 text-lg font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h5>
		)
	},
	h6: ({ children, ...props }) => {
		return (
			<h6
				className="mt-6 mb-4 scroll-m-20 text-base font-semibold tracking-tight"
				{...props}
			>
				{children}
			</h6>
		)
	},
	p: ({ children, ...props }) => {
		return (
			<p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
				{children}
			</p>
		)
	},
	blockquote: ({ children, ...props }) => {
		return (
			<blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
				{children}
			</blockquote>
		)
	},
	table: ({ children, ...props }) => {
		return (
			<div className="my-6 w-full overflow-y-auto">
				<table className="w-full" {...props}>
					{children}
				</table>
			</div>
		)
	},
	thead: ({ children, ...props }) => {
		return <thead {...props}>{children}</thead>
	},
	tbody: ({ children, ...props }) => {
		return <tbody {...props}>{children}</tbody>
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
				className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
				{...props}
			>
				{children}
			</th>
		)
	},
	td: ({ children, ...props }) => {
		return (
			<td
				className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
				{...props}
			>
				{children}
			</td>
		)
	},
	hr: ({ ...props }) => {
		return <hr className="border-border my-6" {...props} />
	},
}

const remarkPlugins = [remarkGfm]

interface MarkdownProps {
	children: string
	className?: string
}

const NonMemoizedMarkdown = ({ children, className }: MarkdownProps) => {
	return (
		<div
			className={cn(
				"prose prose-neutral dark:prose-invert max-w-none",
				className,
			)}
		>
			<ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
				{children}
			</ReactMarkdown>
		</div>
	)
}

export const Markdown = memo(
	NonMemoizedMarkdown,
	(prevProps, nextProps) => prevProps.children === nextProps.children,
)
