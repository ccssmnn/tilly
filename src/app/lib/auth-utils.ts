import { PUBLIC_CLERK_ACCOUNTS_URL } from "astro:env/client"

export function getSignInUrl(redirectPath: string = "/app"): string {
	let currentUrl = window.location.origin
	return `${getAccountsUrl()}/sign-in?redirect_url=${currentUrl}${redirectPath}`
}

export function getSignUpUrl(redirectPath: string = "/app"): string {
	let currentUrl = window.location.origin
	return `${getAccountsUrl()}/sign-up?redirect_url=${currentUrl}${redirectPath}`
}

function getAccountsUrl(): string {
	return PUBLIC_CLERK_ACCOUNTS_URL
}
