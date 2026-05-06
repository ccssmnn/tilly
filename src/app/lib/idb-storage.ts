import { del, get, set } from "idb-keyval"
import { z } from "zod"
import type { PersistStorage } from "zustand/middleware"

type StorageValue<T> = {
	state: T
	version: number
}

export function createIdbStorage<T>(
	schema: z.ZodSchema<T>,
	initialState: T,
	version: number = 1,
): PersistStorage<T> {
	return {
		getItem: async function (name): Promise<StorageValue<T> | null> {
			try {
				let item = await get(name)
				if (!item) return null

				let check = z
					.object({ state: schema, version: z.number() })
					.safeParse(item)

				if (!check.success) {
					console.warn("Invalid store data, using initial state", check.error)
					return { state: initialState, version }
				}

				return {
					state: check.data.state as T,
					version: check.data.version,
				}
			} catch (error) {
				console.error("Failed to get store from idb", error)
				return { state: initialState, version }
			}
		},
		setItem: async function (name, value) {
			try {
				await set(name, value)
			} catch (error) {
				console.error("Failed to persist store to idb", error)
			}
		},
		removeItem: async function (name) {
			try {
				await del(name)
			} catch (error) {
				console.error("Failed to remove store from idb", error)
			}
		},
	}
}
