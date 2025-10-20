import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isTextSelectionOngoing() {
	let selection = window.getSelection()
	return selection !== null && selection.toString().length > 0
}
