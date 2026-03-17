import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Label } from "#shared/ui/label"
import { Switch } from "#shared/ui/switch"
import { Progress } from "#shared/ui/progress"
import { TypographyMuted } from "#shared/ui/typography"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { T, useIntl } from "#shared/intl/setup"
import { toast } from "sonner"
import { SettingsSection } from "#app/components/settings-section"
import { mobileActionButtonClass, sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"

export { AssistantSection }

function AssistantSection({ me }: { me: SettingsAccount }) {
	let [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
	let t = useIntl()

	let usageTracking = me.root.usageTracking
	let usagePercentage = Math.round(usageTracking?.weeklyPercentUsed ?? 0)
	let usageResetDateString =
		usageTracking?.resetDate?.toLocaleDateString(me.root.language ?? "en") ??
		""

	let hasPushDevices =
		(me.root.notificationSettings?.pushDevices?.length ?? 0) > 0

	function handleNotifyOnCompleteChange(checked: boolean) {
		if (!me.root.assistant?.$isLoaded) return
		me.root.assistant.$jazz.set("notifyOnComplete", checked)
	}

	function handleResetAssistant() {
		if (!me.root.assistant) return
		me.root.$jazz.delete("assistant")
		toast.success(t("settings.agent.reset.success"))
		setIsResetDialogOpen(false)
	}

	return (
		<SettingsSection
			title={t("settings.agent.title")}
			description={t("settings.agent.description")}
		>
			<div className={sectionStackClass}>
				{hasPushDevices && (
					<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<Label htmlFor="notify-on-complete">
								<T k="settings.agent.notifyOnComplete.label" />
							</Label>
							<TypographyMuted>
								<T k="settings.agent.notifyOnComplete.description" />
							</TypographyMuted>
						</div>
						<Switch
							id="notify-on-complete"
							checked={me.root.assistant?.notifyOnComplete !== false}
							onCheckedChange={handleNotifyOnCompleteChange}
						/>
					</div>
				)}
				{usageTracking && (
					<div className="space-y-4">
						<p className="mb-1 text-sm font-medium">
							<T k="settings.agent.usage.title" />
						</p>
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>
										<T k="settings.agent.usage.budget.label" />
									</span>
									<span>{usagePercentage}%</span>
								</div>
								<Progress value={usagePercentage} className="h-2" />
								<p className="text-muted-foreground text-xs">
									<T
										k="settings.agent.usage.budget.reset"
										params={{
											date: usageResetDateString,
										}}
									/>
								</p>
							</div>
						</div>
					</div>
				)}
				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.agent.reset.title" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.agent.reset.description" />
					</p>
					<Button
						variant="outline"
						className={mobileActionButtonClass}
						onClick={() => setIsResetDialogOpen(true)}
					>
						<T k="settings.agent.reset.button" />
					</Button>
				</div>
			</div>
			<Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<T k="settings.agent.reset.dialog.title" />
						</DialogTitle>
						<DialogDescription>
							<T k="settings.agent.reset.dialog.description" />
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2 sm:grid-cols-2">
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setIsResetDialogOpen(false)}
						>
							<T k="common.cancel" />
						</Button>
						<Button className="w-full" onClick={handleResetAssistant}>
							<T k="settings.agent.reset.button" />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</SettingsSection>
	)
}
