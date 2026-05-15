import { useState, useRef, type KeyboardEvent } from "react"
import {
	TypeBold,
	TypeItalic,
	Link45deg,
	ListUl,
	TypeH3,
	Eye,
	PencilSquare,
} from "react-bootstrap-icons"
import { T } from "#shared/intl/setup"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "#shared/ui/input-group"
import { Markdown } from "#shared/ui/markdown"
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "#shared/ui/tooltip"
import { Kbd, KbdGroup } from "#shared/ui/kbd"
import { applyMarkdownFormat } from "#shared/ui/markdown-editor"
import { isMac } from "#app/hooks/use-pwa"

export { NoteContentEditor }

let toolButtons = [
	{ format: "bold", icon: TypeBold, label: "markdown.bold", key: "B" },
	{ format: "italic", icon: TypeItalic, label: "markdown.italic", key: "I" },
	{ format: "link", icon: Link45deg, label: "markdown.link", key: "K" },
	{ format: "list", icon: ListUl, label: "markdown.list", key: "L" },
	{ format: "heading", icon: TypeH3, label: "markdown.heading", key: "H" },
] as const

function NoteContentEditor({
	value,
	onChange,
	onKeyDown,
	placeholder,
	"data-testid": dataTestId,
}: {
	value: string
	onChange: (value: string) => void
	onKeyDown?: (e: KeyboardEvent) => void
	placeholder?: string
	"data-testid"?: string
}) {
	let [showPreview, setShowPreview] = useState(false)
	let textareaRef = useRef<HTMLTextAreaElement>(null)

	function handleKeyDown(e: React.KeyboardEvent) {
		onKeyDown?.(e)
		if (e.defaultPrevented || showPreview) return

		let isModifier = e.metaKey || e.ctrlKey
		if (!isModifier) return

		let shortcuts = ["b", "i", "k", "l", "h"]
		if (!shortcuts.includes(e.key)) return

		e.preventDefault()
		applyMarkdownFormat(
			textareaRef,
			value,
			onChange,
			e.key === "b"
				? "bold"
				: e.key === "i"
					? "italic"
					: e.key === "k"
						? "link"
						: e.key === "l"
							? "list"
							: "heading",
		)
	}

	let previewToggleDisabled = !value.trim()

	let previewToggleContent = showPreview ? (
		<>
			<PencilSquare className="h-3 w-3" />
			<span>
				<T k="markdown.edit" />
			</span>
		</>
	) : (
		<>
			<Eye className="h-3 w-3" />
			<span>
				<T k="markdown.preview" />
			</span>
		</>
	)

	let toolbar = (
		<TooltipProvider>
			<div className="flex gap-1">
				{toolButtons.map(tool => (
					<Tooltip key={tool.format}>
						<TooltipTrigger
							render={
								<InputGroupButton
									variant="ghost"
									size="icon-xs"
									onMouseDown={e => e.preventDefault()}
									onClick={() =>
										applyMarkdownFormat(
											textareaRef,
											value,
											onChange,
											tool.format,
										)
									}
									disabled={showPreview}
								>
									<tool.icon className="h-5 w-5 pointer-fine:h-4 pointer-fine:w-4" />
								</InputGroupButton>
							}
						/>
						<TooltipContent>
							<T k={tool.label} />{" "}
							<KbdGroup>
								<Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd>
								<Kbd>{tool.key}</Kbd>
							</KbdGroup>
						</TooltipContent>
					</Tooltip>
				))}
			</div>
		</TooltipProvider>
	)

	let previewToggle = (
		<InputGroupButton
			variant="ghost"
			size="xs"
			onMouseDown={e => e.preventDefault()}
			onClick={() => setShowPreview(!showPreview)}
			disabled={previewToggleDisabled}
			className="text-muted-foreground pointer-fine:hover:text-foreground gap-1 text-sm pointer-fine:text-xs"
		>
			{previewToggleContent}
		</InputGroupButton>
	)

	let toolbarAddon = (
		<InputGroupAddon
			align="block-start"
			className="bg-muted/30 hidden items-center justify-between gap-2 border-b px-2 py-1 pointer-fine:flex"
		>
			{toolbar}
			{previewToggle}
		</InputGroupAddon>
	)

	let toolbarAddonBottom = (
		<InputGroupAddon
			align="block-end"
			className="bg-muted/30 flex items-center justify-between gap-2 border-t px-2 py-1 pointer-fine:hidden"
		>
			{toolbar}
			{previewToggle}
		</InputGroupAddon>
	)

	if (showPreview) {
		let closePreviewToggle = (
			<InputGroupButton
				variant="ghost"
				size="xs"
				onMouseDown={e => e.preventDefault()}
				onClick={() => setShowPreview(false)}
				disabled={previewToggleDisabled}
				className="text-muted-foreground pointer-fine:hover:text-foreground gap-1 text-sm pointer-fine:text-xs"
			>
				{previewToggleContent}
			</InputGroupButton>
		)

		return (
			<div className="border-input bg-input/30 overflow-hidden rounded-xl border">
				<div className="bg-muted/30 hidden items-center justify-between gap-2 border-b px-2 py-1 pointer-fine:flex">
					{toolbar}
					{closePreviewToggle}
				</div>
				<div className="min-h-[100px] px-3 py-2">
					{value ? (
						<Markdown>{value}</Markdown>
					) : (
						<p className="text-muted-foreground text-sm italic">
							<T k="markdown.noPreview" />
						</p>
					)}
				</div>
				<div className="bg-muted/30 flex items-center justify-between gap-2 border-t px-2 py-1 pointer-fine:hidden">
					{toolbar}
					{closePreviewToggle}
				</div>
			</div>
		)
	}

	return (
		<div onKeyDown={handleKeyDown}>
			<InputGroup className="h-auto rounded-xl">
				{toolbarAddon}
				<InputGroupTextarea
					ref={textareaRef}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					rows={4}
					data-testid={dataTestId}
					className="[&::-webkit-resizer]:hidden"
				/>
				{toolbarAddonBottom}
			</InputGroup>
		</div>
	)
}
