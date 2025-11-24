import { useState, useRef, type ChangeEvent } from "react"
import { Textarea, useResizeTextarea } from "./textarea"
import { Button } from "./button"
import { Markdown } from "./markdown"
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "./tooltip"
import { Kbd, KbdGroup } from "./kbd"
import { cn } from "#app/lib/utils"
import { useIsMac } from "#app/hooks/use-pwa"
import { T } from "#shared/intl/setup"
import {
	TypeBold,
	TypeItalic,
	Link45deg,
	Eye,
	PencilSquare,
	ListUl,
	TypeH3,
} from "react-bootstrap-icons"

export { MarkdownEditor }
export type { MarkdownEditorProps }

function MarkdownEditor({
	value,
	onChange,
	placeholder,
	rows = 4,
	className,
	onKeyDown,
	id,
}: MarkdownEditorProps) {
	let [showPreview, setShowPreview] = useState(false)
	let textareaRef = useRef<HTMLTextAreaElement>(null)
	let isMac = useIsMac()

	useResizeTextarea(textareaRef, value, { maxHeight: 400, minHeight: 80 })

	function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
		onChange(e.target.value)
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		onKeyDown?.(e)

		if (e.defaultPrevented) return

		if (showPreview) return

		let isModifierPressed = e.metaKey || e.ctrlKey
		if (!isModifierPressed) return

		let markdownShortcutKeys = ["b", "i", "k", "l", "h"]
		if (!markdownShortcutKeys.includes(e.key)) return

		e.preventDefault()
		switch (e.key) {
			case "b":
				applyMarkdownFormat(textareaRef, value, onChange, "bold")
				break
			case "i":
				applyMarkdownFormat(textareaRef, value, onChange, "italic")
				break
			case "k":
				applyMarkdownFormat(textareaRef, value, onChange, "link")
				break
			case "l":
				applyMarkdownFormat(textareaRef, value, onChange, "list")
				break
			case "h":
				applyMarkdownFormat(textareaRef, value, onChange, "heading")
				break
		}
	}

	let toolButtons = [
		{ format: "bold", icon: TypeBold, label: "markdown.bold", key: "B" },
		{ format: "italic", icon: TypeItalic, label: "markdown.italic", key: "I" },
		{ format: "link", icon: Link45deg, label: "markdown.link", key: "K" },
		{ format: "list", icon: ListUl, label: "markdown.list", key: "L" },
		{ format: "heading", icon: TypeH3, label: "markdown.heading", key: "H" },
	] as const

	return (
		<div
			className="flex flex-col-reverse md:flex-col"
			onKeyDown={handleKeyDown}
		>
			<div className="border-border bg-muted/30 flex items-center justify-between gap-2 rounded-b-md border border-t-0 px-2 py-1 md:rounded-t-md md:rounded-b-none md:border-t md:border-b-0">
				<TooltipProvider>
					<div className="flex gap-1">
						{toolButtons.map(tool => (
							<Tooltip key={tool.format}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onMouseDown={e => e.preventDefault()}
										onClick={() =>
											applyMarkdownFormat(
												textareaRef,
												value,
												onChange,
												tool.format,
											)
										}
										className="h-10 w-10 p-0 md:h-7 md:w-7"
										disabled={showPreview}
									>
										<tool.icon className="h-5 w-5 md:h-4 md:w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<T k={tool.label} />{" "}
									<KbdGroup>
										<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
										<Kbd>{tool.key}</Kbd>
									</KbdGroup>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				</TooltipProvider>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onMouseDown={e => e.preventDefault()}
					onClick={() => setShowPreview(!showPreview)}
					disabled={!value.trim()}
					className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
				>
					{showPreview ? (
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
					)}
				</Button>
			</div>
			{showPreview ? (
				<div
					className={cn(
						"border-border bg-background min-h-[100px] rounded-t-md border border-b-0 px-3 py-2 md:rounded-t-none md:rounded-b-md md:border-t-0 md:border-b",
						className,
					)}
				>
					{value ? (
						<Markdown>{value}</Markdown>
					) : (
						<p className="text-muted-foreground text-sm italic">
							<T k="markdown.noPreview" />
						</p>
					)}
				</div>
			) : (
				<Textarea
					ref={textareaRef}
					value={value}
					onChange={handleChange}
					placeholder={placeholder}
					rows={rows}
					autoResize={false}
					id={id}
					className={cn(
						"max-h-[80dvh] resize-none overflow-y-auto rounded-t-md rounded-b-none md:rounded-t-none md:rounded-b-md [&::-webkit-resizer]:hidden",
						className,
					)}
				/>
			)}
		</div>
	)
}

function applyMarkdownFormat(
	textareaRef: TextareaRef,
	value: string,
	onChange: (value: string) => void,
	format: MarkdownFormatType,
) {
	let textarea = textareaRef.current
	if (!textarea) return

	let start = textarea.selectionStart
	let end = textarea.selectionEnd

	if (format === "heading" || format === "list") {
		applyLineFormat(textarea, value, onChange, format, start, end)
	} else {
		applyInlineFormat(textarea, value, onChange, format, start, end)
	}
}

function applyInlineFormat(
	textarea: HTMLTextAreaElement,
	value: string,
	onChange: (value: string) => void,
	format: "bold" | "italic" | "link",
	start: number,
	end: number,
) {
	let selectedText = value.substring(start, end)

	if (start === end) {
		let bounds = getWordBounds(value, start)
		selectedText = value.substring(bounds.start, bounds.end)
		start = bounds.start
		end = bounds.end
	}

	let formatConfig: InlineFormatConfig = getInlineFormatConfig(
		format,
		value,
		start,
		end,
		selectedText,
	)
	let result = formatConfig.toggle()

	onChange(result.newValue)

	setTimeout(() => {
		textarea.focus()
		textarea.setSelectionRange(result.newStart, result.newEnd)
	}, 0)
}

function applyLineFormat(
	textarea: HTMLTextAreaElement,
	value: string,
	onChange: (value: string) => void,
	format: "heading" | "list",
	start: number,
	end: number,
) {
	let lines = value.split("\n")
	let currentLineIndex = 0
	let charCount = 0

	for (let i = 0; i < lines.length; i++) {
		if (charCount + lines[i].length >= start) {
			currentLineIndex = i
			break
		}
		charCount += lines[i].length + 1
	}

	let currentLine = lines[currentLineIndex]
	let lineStartPos = charCount
	let startOffsetInLine = start - lineStartPos
	let endOffsetInLine = end - lineStartPos

	let formatConfig = getLineFormatConfig(format, currentLine)
	let result = formatConfig.toggle(startOffsetInLine, endOffsetInLine)

	lines[currentLineIndex] = result.newLine
	let newValue = lines.join("\n")

	onChange(newValue)

	setTimeout(() => {
		textarea.focus()
		let newStart = lineStartPos + result.newStartOffset
		let newEnd = lineStartPos + result.newEndOffset
		textarea.setSelectionRange(newStart, newEnd)
	}, 0)
}

function getWordBounds(text: string, pos: number): WordBounds {
	let start = pos
	let end = pos

	while (start > 0 && /\S/.test(text[start - 1])) {
		start--
	}

	while (end < text.length && /\S/.test(text[end])) {
		end++
	}

	return { start, end }
}

function getInlineFormatConfig(
	format: "bold" | "italic" | "link",
	value: string,
	start: number,
	end: number,
	selectedText: string,
): InlineFormatConfig {
	if (format === "bold") {
		return getBoldFormatConfig(value, start, end, selectedText)
	} else if (format === "italic") {
		return getItalicFormatConfig(value, start, end, selectedText)
	} else {
		return getLinkFormatConfig(value, start, end, selectedText)
	}
}

function getBoldFormatConfig(
	value: string,
	start: number,
	end: number,
	selectedText: string,
): InlineFormatConfig {
	let before = value.substring(Math.max(0, start - 2), start)
	let after = value.substring(end, Math.min(value.length, end + 2))

	return {
		toggle: () => {
			if (before === "**" && after === "**") {
				return {
					newValue:
						value.substring(0, start - 2) +
						selectedText +
						value.substring(end + 2),
					newStart: start - 2,
					newEnd: start - 2 + selectedText.length,
				}
			} else if (
				selectedText.startsWith("**") &&
				selectedText.endsWith("**") &&
				selectedText.length > 4
			) {
				let unwrapped = selectedText.slice(2, -2)
				return {
					newValue:
						value.substring(0, start) + unwrapped + value.substring(end),
					newStart: start,
					newEnd: start + unwrapped.length,
				}
			} else {
				let wrapped = "**" + selectedText + "**"
				return {
					newValue: value.substring(0, start) + wrapped + value.substring(end),
					newStart: start + 2,
					newEnd: start + 2 + selectedText.length,
				}
			}
		},
	}
}

function getItalicFormatConfig(
	value: string,
	start: number,
	end: number,
	selectedText: string,
): InlineFormatConfig {
	let before = value.substring(Math.max(0, start - 1), start)
	let after = value.substring(end, Math.min(value.length, end + 1))
	let beforeBold = value.substring(Math.max(0, start - 2), start)
	let afterBold = value.substring(end, Math.min(value.length, end + 2))

	return {
		toggle: () => {
			if (
				before === "*" &&
				after === "*" &&
				!(beforeBold === "**" && afterBold === "**")
			) {
				return {
					newValue:
						value.substring(0, start - 1) +
						selectedText +
						value.substring(end + 1),
					newStart: start - 1,
					newEnd: start - 1 + selectedText.length,
				}
			} else if (
				selectedText.startsWith("*") &&
				selectedText.endsWith("*") &&
				!selectedText.startsWith("**") &&
				selectedText.length > 2
			) {
				let unwrapped = selectedText.slice(1, -1)
				return {
					newValue:
						value.substring(0, start) + unwrapped + value.substring(end),
					newStart: start,
					newEnd: start + unwrapped.length,
				}
			} else {
				let wrapped = "*" + selectedText + "*"
				return {
					newValue: value.substring(0, start) + wrapped + value.substring(end),
					newStart: start + 1,
					newEnd: start + 1 + selectedText.length,
				}
			}
		},
	}
}

function getLinkFormatConfig(
	value: string,
	start: number,
	end: number,
	selectedText: string,
): InlineFormatConfig {
	let before = value.substring(Math.max(0, start - 1), start)
	let afterMatch = value.substring(end).match(/^\]\([^)]*\)/)

	return {
		toggle: () => {
			if (before === "[" && afterMatch) {
				let afterLength = afterMatch[0].length
				return {
					newValue:
						value.substring(0, start - 1) +
						selectedText +
						value.substring(end + afterLength),
					newStart: start - 1,
					newEnd: start - 1 + selectedText.length,
				}
			} else {
				let linkPattern = /^\[(.+)\]\((.+)\)$/
				let match = selectedText.match(linkPattern)

				if (match) {
					let linkText = match[1]
					return {
						newValue:
							value.substring(0, start) + linkText + value.substring(end),
						newStart: start,
						newEnd: start + linkText.length,
					}
				} else {
					let wrapped = "[" + selectedText + "](url)"
					return {
						newValue:
							value.substring(0, start) + wrapped + value.substring(end),
						newStart: start + 1,
						newEnd: start + 1 + selectedText.length,
					}
				}
			}
		},
	}
}

function getLineFormatConfig(
	format: "heading" | "list",
	currentLine: string,
): LineFormatConfig {
	if (format === "heading") {
		return {
			toggle: (startOffsetInLine: number, endOffsetInLine: number) => {
				if (currentLine.match(/^###\s/)) {
					return {
						newLine: currentLine.replace(/^###\s/, ""),
						newStartOffset: Math.max(0, startOffsetInLine - 4),
						newEndOffset: Math.max(0, endOffsetInLine - 4),
					}
				} else {
					return {
						newLine: "### " + currentLine,
						newStartOffset: startOffsetInLine + 4,
						newEndOffset: endOffsetInLine + 4,
					}
				}
			},
		}
	} else {
		return {
			toggle: (startOffsetInLine: number, endOffsetInLine: number) => {
				if (currentLine.match(/^\s*-\s/)) {
					return {
						newLine: currentLine.replace(/^\s*-\s/, ""),
						newStartOffset: Math.max(0, startOffsetInLine - 2),
						newEndOffset: Math.max(0, endOffsetInLine - 2),
					}
				} else {
					return {
						newLine: "- " + currentLine,
						newStartOffset: startOffsetInLine + 2,
						newEndOffset: endOffsetInLine + 2,
					}
				}
			},
		}
	}
}

type MarkdownEditorProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	rows?: number
	className?: string
	onKeyDown?: (e: React.KeyboardEvent) => void
	id?: string
}

type MarkdownFormatType = "bold" | "italic" | "link" | "heading" | "list"

type TextareaRef = React.RefObject<HTMLTextAreaElement | null>

type WordBounds = {
	start: number
	end: number
}

type FormatResult = {
	newValue: string
	newStart: number
	newEnd: number
}

type InlineFormatConfig = {
	toggle: () => FormatResult
}

type LineFormatResult = {
	newLine: string
	newStartOffset: number
	newEndOffset: number
}

type LineFormatConfig = {
	toggle: (
		startOffsetInLine: number,
		endOffsetInLine: number,
	) => LineFormatResult
}
