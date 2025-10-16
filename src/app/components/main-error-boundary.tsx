import { Component, useState } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { Button } from "#shared/ui/button"
import { Clipboard, Check } from "react-bootstrap-icons"
import { ErrorUI } from "./error-ui"

type Props = {
	children: ReactNode
}

type State = {
	hasError: boolean
	error?: Error
	errorInfo?: ErrorInfo
}

export { MainErrorBoundary }

class MainErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): State {
		console.error("🚨 Main Error Boundary caught an error:", error)
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("🚨 Error Details:", {
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		})
		this.setState({ errorInfo })
	}

	render() {
		if (this.state.hasError) {
			return (
				<ErrorFallback
					error={this.state.error}
					errorInfo={this.state.errorInfo}
				/>
			)
		}

		return this.props.children
	}
}

function ErrorFallback({
	error,
	errorInfo,
}: {
	error?: Error
	errorInfo?: ErrorInfo
}) {
	let [locale] = useState(() => {
		try {
			let stored = localStorage.getItem("tilly-locale")
			return stored === "de" ? "de" : "en"
		} catch {
			return "en"
		}
	})

	let [copied, setCopied] = useState(false)

	function handleCopyError() {
		if (!error) return

		let errorText = `Error Message:\n${error.message}\n\nStack Trace:\n${error.stack || "No stack trace available"}\n\nComponent Stack:\n${errorInfo?.componentStack || "No component stack available"}`

		navigator.clipboard.writeText(errorText).then(
			() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			},
			() => alert("Failed to copy error details"),
		)
	}

	return (
		<ErrorUI
			error={error}
			componentStack={errorInfo?.componentStack ?? undefined}
			title="Application Error"
			description="An unexpected error occurred. Please try reloading the page or contact support if the problem persists."
			feedbackLink={
				<a
					href={`/${locale}/feedback`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary block text-sm hover:underline"
				>
					Report this issue →
				</a>
			}
			actions={
				<>
					<Button
						variant="outline"
						onClick={() => window.location.reload()}
						className="flex-1"
					>
						Reload Page
					</Button>
					<Button variant="ghost" onClick={handleCopyError} className="flex-1">
						{copied ? (
							<>
								<Check className="size-4" />
								Copied!
							</>
						) : (
							<>
								<Clipboard className="size-4" />
								Copy Error
							</>
						)}
					</Button>
				</>
			}
			onCopyError={() => alert("Failed to copy error details")}
		/>
	)
}
