import { defineMiddleware } from "astro:middleware"

export let onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname === "/") {
		let acceptLanguage = context.request.headers.get("accept-language")
		let preferredLang = acceptLanguage?.split(",")[0].split("-")[0].toLowerCase()
		let locale = preferredLang === "de" ? "de" : "en"
		return context.redirect(`/${locale}/`, 301)
	}

	let response = await next()

	if (response.status === 404) {
		let pathname = context.url.pathname
		let locale = pathname.startsWith("/de") ? "de" : "en"
		let notFoundPage = `/${locale}/404`

		return context.rewrite(notFoundPage)
	}

	return response
})
