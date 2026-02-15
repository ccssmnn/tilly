export {
	getCoListLength,
	getLoadedCoListValues,
	hasCoListRefById,
	removeCoListRefsById,
	removeCoValueRefsByLoadingStates,
	removeDeletedCoValueRefs,
}

function getCoListLength(list: unknown): number {
	return hasCoListShape(list) ? list.length : 0
}

function getLoadedCoListValues<T extends { $isLoaded?: boolean }>(
	list: unknown,
): Array<T & { $isLoaded: true }> {
	if (!hasCoListShape(list) || typeof list.values !== "function") return []
	let values = Array.from(list.values()) as Array<T | null | undefined>
	return values.filter((value): value is T & { $isLoaded: true } =>
		Boolean(value?.$isLoaded),
	)
}

function removeDeletedCoValueRefs(list: unknown): void {
	removeCoValueRefsByLoadingStates(list, ["deleted"])
}

function removeCoValueRefsByLoadingStates(
	list: unknown,
	states: ReadonlyArray<string>,
): void {
	if (!hasMutableCoListShape(list)) return
	let listAny = list as unknown as Array<
		| { $isLoaded?: boolean; $jazz?: { loadingState?: string } }
		| null
		| undefined
	>

	for (let i = listAny.length - 1; i >= 0; i--) {
		let value = listAny[i]
		if (!value || value.$isLoaded !== false) continue
		if (
			value.$jazz?.loadingState &&
			states.includes(value.$jazz.loadingState)
		) {
			list.$jazz.splice(i, 1)
		}
	}
}

function hasCoListRefById(list: unknown, id: string): boolean {
	if (!hasCoListShape(list)) return false
	let listAny = list as unknown as Array<{ $jazz?: { id?: string } } | null>
	for (let item of listAny) {
		if (item?.$jazz?.id === id) return true
	}
	return false
}

function removeCoListRefsById(list: unknown, id: string): void {
	if (!hasMutableCoListShape(list)) return
	let listAny = list as unknown as Array<{ $jazz?: { id?: string } } | null>
	for (let i = listAny.length - 1; i >= 0; i--) {
		if (listAny[i]?.$jazz?.id === id) list.$jazz.splice(i, 1)
	}
}

function hasCoListShape(list: unknown): list is {
	length: number
	values: () => Iterable<unknown>
	$jazz: { splice: (start: number, deleteCount: number) => unknown }
} {
	if (!list || typeof list !== "object") return false
	if (!("$jazz" in list) || !("length" in list) || !("values" in list)) {
		return false
	}
	let maybeJazz = (list as { $jazz?: unknown }).$jazz
	return Boolean(
		maybeJazz &&
		typeof (maybeJazz as { splice?: unknown }).splice === "function" &&
		typeof (list as { values?: unknown }).values === "function",
	)
}

function hasMutableCoListShape(list: unknown): list is {
	length: number
	$jazz: { splice: (start: number, deleteCount: number) => unknown }
} {
	if (!list || typeof list !== "object") return false
	if (!("$jazz" in list) || !("length" in list)) return false
	let maybeJazz = (list as { $jazz?: unknown }).$jazz
	return Boolean(
		maybeJazz &&
		typeof (maybeJazz as { splice?: unknown }).splice === "function",
	)
}
