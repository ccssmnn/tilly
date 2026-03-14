import { T } from "#shared/intl/setup"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#shared/ui/alert-dialog"

export { ConfirmPermanentDelete }

type ConfirmPermanentDeleteProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
}

function ConfirmPermanentDelete({
	open,
	onOpenChange,
	onConfirm,
}: ConfirmPermanentDeleteProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						<T k="reminder.permanentDelete.title" />
					</AlertDialogTitle>
					<AlertDialogDescription>
						<T k="reminder.permanentDelete.confirmation" />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						<T k="reminder.permanentDelete.cancel" />
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						<T k="reminder.permanentDelete.confirm" />
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
