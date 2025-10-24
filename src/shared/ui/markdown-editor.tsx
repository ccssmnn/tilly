import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Textarea } from "./textarea"
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

type MarkdownEditorProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	rows?: number
	className?: string
}

function MarkdownEditor({
	value,
	onChange,
	placeholder,
	rows = 4,
	className,
}: MarkdownEditorProps) {
	let [showPreview, setShowPreview] = useState(false)
	let textareaRef = useRef<HTMLTextAreaElement>(null)
	let isMac = useIsMac()

	useEffect(() => {
		let textarea = textareaRef.current
		if (!textarea) return

		textarea.style.height = "auto"
		let scrollHeight = textarea.scrollHeight
		let maxHeight = 400
		textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
	}, [value])

	function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
		onChange(e.target.value)
	}

	function getWordBounds(
		text: string,
		pos: number,
	): { start: number; end: number } {
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

	function insertBold() {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
		let selectedText = value.substring(start, end)

		if (start === end) {
			let { start: wordStart, end: wordEnd } = getWordBounds(value, start)
			selectedText = value.substring(wordStart, wordEnd)
			start = wordStart
			end = wordEnd
		}

		let before = value.substring(Math.max(0, start - 2), start)
		let after = value.substring(end, Math.min(value.length, end + 2))

		let newValue = ""
		let newStart = start
		let newEnd = end

		if (before === "**" && after === "**") {
			newValue =
				value.substring(0, start - 2) + selectedText + value.substring(end + 2)
			newStart = start - 2
			newEnd = start - 2 + selectedText.length
		} else if (
			selectedText.startsWith("**") &&
			selectedText.endsWith("**") &&
			selectedText.length > 4
		) {
			let unwrapped = selectedText.slice(2, -2)
			newValue = value.substring(0, start) + unwrapped + value.substring(end)
			newStart = start
			newEnd = start + unwrapped.length
		} else {
			let wrapped = "**" + selectedText + "**"
			newValue = value.substring(0, start) + wrapped + value.substring(end)
			newStart = start + 2
			newEnd = start + 2 + selectedText.length
		}

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(newStart, newEnd)
		}, 0)
	}

	function insertItalic() {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
		let selectedText = value.substring(start, end)

		if (start === end) {
			let { start: wordStart, end: wordEnd } = getWordBounds(value, start)
			selectedText = value.substring(wordStart, wordEnd)
			start = wordStart
			end = wordEnd
		}

		let before = value.substring(Math.max(0, start - 1), start)
		let after = value.substring(end, Math.min(value.length, end + 1))
		let beforeBold = value.substring(Math.max(0, start - 2), start)
		let afterBold = value.substring(end, Math.min(value.length, end + 2))

		let newValue = ""
		let newStart = start
		let newEnd = end

		if (
			before === "*" &&
			after === "*" &&
			!(beforeBold === "**" && afterBold === "**")
		) {
			newValue =
				value.substring(0, start - 1) + selectedText + value.substring(end + 1)
			newStart = start - 1
			newEnd = start - 1 + selectedText.length
		} else if (
			selectedText.startsWith("*") &&
			selectedText.endsWith("*") &&
			!selectedText.startsWith("**") &&
			selectedText.length > 2
		) {
			let unwrapped = selectedText.slice(1, -1)
			newValue = value.substring(0, start) + unwrapped + value.substring(end)
			newStart = start
			newEnd = start + unwrapped.length
		} else {
			let wrapped = "*" + selectedText + "*"
			newValue = value.substring(0, start) + wrapped + value.substring(end)
			newStart = start + 1
			newEnd = start + 1 + selectedText.length
		}

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(newStart, newEnd)
		}, 0)
	}

	function insertLink() {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
		let selectedText = value.substring(start, end)

		if (start === end) {
			let { start: wordStart, end: wordEnd } = getWordBounds(value, start)
			selectedText = value.substring(wordStart, wordEnd)
			start = wordStart
			end = wordEnd
		}

		let before = value.substring(Math.max(0, start - 1), start)
		let afterMatch = value.substring(end).match(/^\]\([^)]*\)/)

		let newValue = ""
		let newStart = start
		let newEnd = end

		if (before === "[" && afterMatch) {
			let afterLength = afterMatch[0].length
			newValue =
				value.substring(0, start - 1) +
				selectedText +
				value.substring(end + afterLength)
			newStart = start - 1
			newEnd = start - 1 + selectedText.length
		} else {
			let linkPattern = /^\[(.+)\]\((.+)\)$/
			let match = selectedText.match(linkPattern)

			if (match) {
				let linkText = match[1]
				newValue = value.substring(0, start) + linkText + value.substring(end)
				newStart = start
				newEnd = start + linkText.length
			} else {
				let wrapped = "[" + selectedText + "](url)"
				newValue = value.substring(0, start) + wrapped + value.substring(end)
				newStart = start + 1
				newEnd = start + 1 + selectedText.length
			}
		}

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(newStart, newEnd)
		}, 0)
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.metaKey || e.ctrlKey) {
			if (e.key === "b") {
				e.preventDefault()
				insertBold()
			} else if (e.key === "i") {
				e.preventDefault()
				insertItalic()
			} else if (e.key === "k") {
				e.preventDefault()
				insertLink()
			} else if (e.key === "l") {
				e.preventDefault()
				insertList()
			} else if (e.key === "h") {
				e.preventDefault()
				insertHeading()
			}
		}
	}

	function insertHeading() {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
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
		let newLine = ""
		let newStartOffset = startOffsetInLine
		let newEndOffset = endOffsetInLine

		if (currentLine.match(/^###\s/)) {
			newLine = currentLine.replace(/^###\s/, "")
			newStartOffset = Math.max(0, startOffsetInLine - 4)
			newEndOffset = Math.max(0, endOffsetInLine - 4)
		} else {
			newLine = "### " + currentLine
			newStartOffset = startOffsetInLine + 4
			newEndOffset = endOffsetInLine + 4
		}

		lines[currentLineIndex] = newLine
		let newValue = lines.join("\n")

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			let newStart = lineStartPos + newStartOffset
			let newEnd = lineStartPos + newEndOffset
			textarea.setSelectionRange(newStart, newEnd)
		}, 0)
	}

	function insertList() {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
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
		let newLine = ""
		let newStartOffset = startOffsetInLine
		let newEndOffset = endOffsetInLine

		if (currentLine.match(/^\s*-\s/)) {
			newLine = currentLine.replace(/^\s*-\s/, "")
			newStartOffset = Math.max(0, startOffsetInLine - 2)
			newEndOffset = Math.max(0, endOffsetInLine - 2)
		} else {
			newLine = "- " + currentLine
			newStartOffset = startOffsetInLine + 2
			newEndOffset = endOffsetInLine + 2
		}

		lines[currentLineIndex] = newLine
		let newValue = lines.join("\n")

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			let newStart = lineStartPos + newStartOffset
			let newEnd = lineStartPos + newEndOffset
			textarea.setSelectionRange(newStart, newEnd)
		}, 0)
	}

	return (
		<div className="flex flex-col-reverse md:flex-col">
			<div className="border-border bg-muted/30 flex items-center justify-between gap-2 rounded-b-md border border-t-0 px-2 py-1 md:rounded-t-md md:rounded-b-none md:border-t md:border-b-0">
				<TooltipProvider>
					<div className="flex gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={insertBold}
									className="h-10 w-10 p-0 md:h-7 md:w-7"
									disabled={showPreview}
								>
									<TypeBold className="h-5 w-5 md:h-4 md:w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<T k="markdown.bold" />{" "}
								<KbdGroup>
									<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
									<Kbd>B</Kbd>
								</KbdGroup>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={insertItalic}
									className="h-10 w-10 p-0 md:h-7 md:w-7"
									disabled={showPreview}
								>
									<TypeItalic className="h-5 w-5 md:h-4 md:w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<T k="markdown.italic" />{" "}
								<KbdGroup>
									<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
									<Kbd>I</Kbd>
								</KbdGroup>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={insertLink}
									className="h-10 w-10 p-0 md:h-7 md:w-7"
									disabled={showPreview}
								>
									<Link45deg className="h-5 w-5 md:h-4 md:w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<T k="markdown.link" />{" "}
								<KbdGroup>
									<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
									<Kbd>K</Kbd>
								</KbdGroup>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={insertList}
									className="h-10 w-10 p-0 md:h-7 md:w-7"
									disabled={showPreview}
								>
									<ListUl className="h-5 w-5 md:h-4 md:w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<T k="markdown.list" />{" "}
								<KbdGroup>
									<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
									<Kbd>L</Kbd>
								</KbdGroup>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={insertHeading}
									className="h-10 w-10 p-0 md:h-7 md:w-7"
									disabled={showPreview}
								>
									<TypeH3 className="h-5 w-5 md:h-4 md:w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<T k="markdown.heading" />{" "}
								<KbdGroup>
									<Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
									<Kbd>H</Kbd>
								</KbdGroup>
							</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
				<Button
					type="button"
					variant="ghost"
					size="sm"
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
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					rows={rows}
					autoResize={false}
					className={cn(
						"max-h-[400px] resize-none overflow-y-auto rounded-t-md rounded-br-none rounded-bl-none md:rounded-t-none md:rounded-b-md md:rounded-br-none [&::-webkit-resizer]:hidden",
						className,
					)}
				/>
			)}
		</div>
	)
}
