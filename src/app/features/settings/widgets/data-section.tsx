import { T, useIntl } from "#shared/intl/setup"
import { SettingsSection } from "#app/features/settings/parts/settings-section"
import { ExportButton as DownloadButton } from "../parts/data-download-button"
import { UploadButton } from "../parts/data-upload-button"
import { sectionStackClass } from "../lib/layout"
import type { SettingsAccount } from "../lib/data"
import { FileDataSchema } from "../lib/data-file-schema"
import { blobToDataURL, dataURLToFile } from "../lib/data-utils"
import { DeleteDataButton } from "../parts/delete-data-button"

export { DataSection }

function DataSection({ me }: { me: SettingsAccount }) {
	let t = useIntl()

	return (
		<SettingsSection
			title={t("settings.data.title")}
			description={t("settings.data.description")}
		>
			<div className={sectionStackClass}>
				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.export.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.export.description" />
					</p>
					<DownloadButton account={me} blobToDataURL={blobToDataURL} />
				</div>

				<div className="space-y-2">
					<p className="mb-1 text-sm font-medium">
						<T k="settings.data.import.label" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.import.description" />
					</p>
					<UploadButton
						userID={me.$jazz.id}
						fileDataSchema={FileDataSchema}
						dataURLToFile={dataURLToFile}
					/>
				</div>

				<div className="space-y-2">
					<p className="text-destructive mb-1 text-sm font-medium">
						<T k="settings.data.delete.title" />
					</p>
					<p className="text-muted-foreground text-sm">
						<T k="settings.data.delete.description" />
					</p>
					<DeleteDataButton currentMe={me} />
				</div>
			</div>
		</SettingsSection>
	)
}
