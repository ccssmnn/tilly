import { defineMiddleware } from "astro:middleware"

export let onRequest = defineMiddleware(async (context, next) => {
	let response = await next()

	if (response.status === 404) {
		let pathname = context.url.pathname
		let locale = pathname.startsWith("/de") ? "de" : "en"
		let notFoundPage = `/${locale}/404`

		return context.rewrite(notFoundPage)
	}

	return response
})
