export { getDeviceName, getBrowserRecommendation }

function getDeviceName(): string {
	let userAgent = navigator.userAgent

	let os = "Unknown OS"
	if (userAgent.includes("Windows")) os = "Windows"
	else if (userAgent.includes("Mac")) os = "macOS"
	else if (userAgent.includes("Linux")) os = "Linux"
	else if (userAgent.includes("Android")) os = "Android"
	else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
		os = "iOS"

	let browser = "Unknown Browser"
	if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
		browser = "Chrome"
	else if (userAgent.includes("Firefox")) browser = "Firefox"
	else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
		browser = "Safari"
	else if (userAgent.includes("Edg")) browser = "Edge"

	return `${os} ${browser}`
}

function getBrowserRecommendation(isInAppBrowser: boolean) {
	let userAgent = navigator.userAgent

	if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
		if (isInAppBrowser) {
			return "notifications.browserNotSupported.recommendation.iosInApp" as const
		}
		return "notifications.browserNotSupported.recommendation.ios" as const
	}

	if (userAgent.includes("Android")) {
		if (isInAppBrowser) {
			return "notifications.browserNotSupported.recommendation.androidInApp" as const
		}
		return "notifications.browserNotSupported.recommendation.android" as const
	}

	if (userAgent.includes("Windows")) {
		return "notifications.browserNotSupported.recommendation.windows" as const
	}

	if (userAgent.includes("Mac")) {
		return "notifications.browserNotSupported.recommendation.macos" as const
	}

	return "notifications.browserNotSupported.recommendation.generic" as const
}
