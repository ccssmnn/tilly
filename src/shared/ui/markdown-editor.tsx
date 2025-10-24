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
import { cn } from "#app/lib/utils"
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

	function insertMarkdown(before: string, after: string, placeholder: string) {
		let textarea = textareaRef.current
		if (!textarea) return

		let start = textarea.selectionStart
		let end = textarea.selectionEnd
		let selectedText = value.substring(start, end)
		let replacement = selectedText || placeholder

		let newValue =
			value.substring(0, start) +
			before +
			replacement +
			after +
			value.substring(end)

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			let newCursorPos = start + before.length + replacement.length
			textarea.setSelectionRange(newCursorPos, newCursorPos)
		}, 0)
	}

	function insertBold() {
		insertMarkdown("**", "**", "bold text")
	}

	function insertItalic() {
		insertMarkdown("*", "*", "italic text")
	}

	function insertLink() {
		insertMarkdown("[", "](url)", "link text")
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

		let cursorPos = textarea.selectionStart
		let lines = value.split("\n")

		let currentLineIndex = 0
		let charCount = 0
		for (let i = 0; i < lines.length; i++) {
			if (charCount + lines[i].length >= cursorPos) {
				currentLineIndex = i
				break
			}
			charCount += lines[i].length + 1
		}

		let currentLine = lines[currentLineIndex]
		let lineStartPos = charCount
		let cursorOffsetInLine = cursorPos - lineStartPos
		let newLine = ""
		let newCursorOffset = cursorOffsetInLine

		if (currentLine.match(/^###\s/)) {
			newLine = currentLine.replace(/^###\s/, "")
			newCursorOffset = Math.max(0, cursorOffsetInLine - 4)
		} else {
			newLine = "### " + currentLine
			newCursorOffset = cursorOffsetInLine + 4
		}

		lines[currentLineIndex] = newLine
		let newValue = lines.join("\n")

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			let newCursorPos = lineStartPos + newCursorOffset
			textarea.setSelectionRange(newCursorPos, newCursorPos)
		}, 0)
	}

	function insertList() {
		let textarea = textareaRef.current
		if (!textarea) return

		let cursorPos = textarea.selectionStart
		let lines = value.split("\n")

		let currentLineIndex = 0
		let charCount = 0
		for (let i = 0; i < lines.length; i++) {
			if (charCount + lines[i].length >= cursorPos) {
				currentLineIndex = i
				break
			}
			charCount += lines[i].length + 1
		}

		let currentLine = lines[currentLineIndex]
		let lineStartPos = charCount
		let cursorOffsetInLine = cursorPos - lineStartPos
		let newLine = ""
		let newCursorOffset = cursorOffsetInLine

		if (currentLine.match(/^\s*-\s/)) {
			newLine = currentLine.replace(/^\s*-\s/, "")
			newCursorOffset = Math.max(0, cursorOffsetInLine - 2)
		} else {
			newLine = "- " + currentLine
			newCursorOffset = cursorOffsetInLine + 2
		}

		lines[currentLineIndex] = newLine
		let newValue = lines.join("\n")

		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			let newCursorPos = lineStartPos + newCursorOffset
			textarea.setSelectionRange(newCursorPos, newCursorPos)
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
							<TooltipContent>Bold (⌘B)</TooltipContent>
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
							<TooltipContent>Italic (⌘I)</TooltipContent>
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
							<TooltipContent>Link (⌘K)</TooltipContent>
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
							<TooltipContent>List (⌘L)</TooltipContent>
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
							<TooltipContent>Heading (⌘H)</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowPreview(!showPreview)}
					className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
				>
					{showPreview ? (
						<>
							<PencilSquare className="h-3 w-3" />
							<span>Edit</span>
						</>
					) : (
						<>
							<Eye className="h-3 w-3" />
							<span>Preview</span>
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
							Nothing to preview
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
					className={cn(
						"max-h-[400px] resize-none overflow-y-auto rounded-t-md rounded-br-none rounded-bl-none md:rounded-t-none md:rounded-b-md md:rounded-br-none",
						className,
					)}
				/>
			)}
		</div>
	)
}
