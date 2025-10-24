import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isTextSelectionOngoing() {
	let selection = window.getSelection()
	if (!selection) return false
	let selectedText = selection.toString()
	return selectedText.length > 0
}
