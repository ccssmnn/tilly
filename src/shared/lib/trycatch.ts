type Success<T> = {
	ok: true
	data: T
}

type Failure<E> = {
	ok: false
	error: E
}

type Result<T, E = Error> = Success<T> | Failure<E>

export function tryCatch<T, E = Error>(
	promise: Promise<T>,
): Promise<Result<T, E>>
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E>
export function tryCatch<T, E = Error>(
	arg: Promise<T> | (() => T),
): Promise<Result<T, E>> | Result<T, E> {
	if (typeof arg === "function") {
		try {
			let data = arg()
			return { ok: true, data }
		} catch (error) {
			return { ok: false, error: error as E }
		}
	}
	return arg
		.then(data => ({ ok: true, data }) as const)
		.catch(error => ({ ok: false, error: error as E }) as const)
}
