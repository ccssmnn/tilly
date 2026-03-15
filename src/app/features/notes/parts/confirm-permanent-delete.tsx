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
						<T k="note.permanentDelete.title" />
					</AlertDialogTitle>
					<AlertDialogDescription>
						<T k="note.permanentDelete.confirmation" />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						<T k="note.permanentDelete.cancel" />
					</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onConfirm}>
						<T k="note.permanentDelete.confirm" />
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
