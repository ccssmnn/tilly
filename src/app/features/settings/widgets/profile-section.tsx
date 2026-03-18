import { useState } from "react"
import { z } from "zod"
import { Button } from "#shared/ui/button"
import { DisplayField } from "#shared/ui/display-field"
import { T, useIntl } from "#shared/intl/setup"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"
import {
	ProfileNameDialog,
	profileFormSchema,
} from "../parts/profile-name-dialog"

export { ProfileSection }

function ProfileSection({ me }: { me: SettingsAccount }) {
	let [isDisplayNameDialogOpen, setIsDisplayNameDialogOpen] = useState(false)
	let t = useIntl()

	function onSubmit(values: z.infer<typeof profileFormSchema>) {
		if (me?.profile) {
			me.profile.$jazz.set("name", values.name)
		}
		setIsDisplayNameDialogOpen(false)
	}

	return (
		<SettingsSection
			title={t("settings.profile.title")}
			description={t("settings.profile.description")}
		>
			<div className={sectionStackClass}>
				<div className="space-y-2.5">
					<p className="text-sm font-medium">
						<T k="settings.profile.displayName.label" />
					</p>
					<div className="flex items-center gap-2">
						<DisplayField
							value={me?.profile?.name ?? ""}
							placeholder={<T k="settings.profile.displayName.placeholder" />}
							className="border-border/60 bg-muted/30 h-10 flex-1 rounded-lg text-sm font-medium shadow-none"
						/>
						<Button
							variant="outline"
							onClick={() => setIsDisplayNameDialogOpen(true)}
							disabled={!me?.profile}
						>
							<T k="settings.profile.displayName.change" />
						</Button>
					</div>
				</div>
			</div>
			<ProfileNameDialog
				currentName={me?.profile?.name || ""}
				isOpen={isDisplayNameDialogOpen}
				onClose={() => setIsDisplayNameDialogOpen(false)}
				onSave={onSubmit}
			/>
		</SettingsSection>
	)
}
