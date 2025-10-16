import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "#shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "#shared/ui/card"
import { ExclamationTriangle, Clipboard, Check } from "react-bootstrap-icons"

type ErrorUIProps = {
	error?: Error
	componentStack?: string
	title: ReactNode
	description: ReactNode
	feedbackLink?: ReactNode
	actions?: ReactNode
	showDetailsLabel?: ReactNode
	detailsLabel?: ReactNode
	messageLabel?: ReactNode
	stackTraceLabel?: ReactNode
	componentStackLabel?: ReactNode
	copyLabel?: ReactNode
	copiedLabel?: ReactNode
	onCopySuccess?: () => void
	onCopyError?: () => void
}

export { ErrorUI }

function ErrorUI({
	error,
	componentStack,
	title,
	description,
	feedbackLink,
	actions,
	showDetailsLabel = "Show error details",
	detailsLabel = "Error Details",
	messageLabel = "Error Message:",
	stackTraceLabel = "Stack Trace",
	componentStackLabel = "Component Stack",
	copyLabel = "Copy",
	copiedLabel = "Copied!",
	onCopySuccess,
	onCopyError,
}: ErrorUIProps) {
	let [copied, setCopied] = useState(false)

	function handleCopyError() {
		if (!error) return

		let errorText = `Error Message:\n${error.message}\n\nStack Trace:\n${error.stack || "No stack trace available"}`

		if (componentStack) {
			errorText += `\n\nComponent Stack:\n${componentStack}`
		}

		navigator.clipboard.writeText(errorText).then(
			() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
				onCopySuccess?.()
			},
			() => {
				onCopyError?.()
			},
		)
	}

	return (
		<main className="container mx-auto max-w-6xl px-3 py-6 pb-20 md:pt-20 md:pb-0">
			<Card className="mx-auto max-w-lg">
				<CardHeader>
					<div className="flex items-center gap-3">
						<ExclamationTriangle className="text-destructive size-5" />
						<h3 className="font-medium">{title}</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground text-sm">{description}</p>
					{feedbackLink}
					{error && (
						<details className="group">
							<summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
								{showDetailsLabel}
							</summary>
							<div className="mt-3 space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-xs font-medium">{detailsLabel}</p>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleCopyError}
										className="h-6 px-2 text-xs"
									>
										{copied ? (
											<>
												<Check className="size-3" />
												{copiedLabel}
											</>
										) : (
											<>
												<Clipboard className="size-3" />
												{copyLabel}
											</>
										)}
									</Button>
								</div>
								<div>
									<p className="mb-1 text-xs font-medium">{messageLabel}</p>
									<pre className="bg-muted overflow-auto rounded p-3 text-xs select-text">
										{error.message}
									</pre>
								</div>
								{error.stack && (
									<details>
										<summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
											{stackTraceLabel}
										</summary>
										<pre className="bg-muted mt-2 max-h-40 overflow-auto rounded p-3 text-xs select-text">
											{error.stack}
										</pre>
									</details>
								)}
								{componentStack && (
									<details>
										<summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
											{componentStackLabel}
										</summary>
										<pre className="bg-muted mt-2 max-h-40 overflow-auto rounded p-3 text-xs select-text">
											{componentStack}
										</pre>
									</details>
								)}
							</div>
						</details>
					)}
				</CardContent>
				<CardFooter className="flex gap-2">{actions}</CardFooter>
			</Card>
		</main>
	)
}
