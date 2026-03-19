import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import { useState } from "react"
import Cropper from "react-easy-crop"
import { tryCatch } from "#shared/lib/trycatch"
import { T } from "#shared/intl/setup"

export { AvatarCropperDialog }

type CropArea = { x: number; y: number; width: number; height: number }

function AvatarCropperDialog({
	open,
	onOpenChange,
	imageSrc,
	onCrop,
	getCroppedImg,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	imageSrc: string | null
	onCrop: (croppedFile: File) => void
	getCroppedImg: (
		imageSrc: string,
		pixelCrop: CropArea,
		fileName: string,
	) => Promise<File>
}) {
	let [crop, setCrop] = useState({ x: 0, y: 0 })
	let [zoom, setZoom] = useState(1)
	let [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
		null,
	)

	function onCropComplete(_: unknown, croppedAreaPixels: CropArea) {
		setCroppedAreaPixels(croppedAreaPixels)
	}

	async function handleCrop() {
		if (!imageSrc || !croppedAreaPixels) return

		let result = await tryCatch(
			getCroppedImg(imageSrc, croppedAreaPixels, "avatar.jpg"),
		)
		if (result.ok) {
			onCrop(result.data)
			onOpenChange(false)
		} else {
			console.error("Error cropping image:", result.error)
		}
	}

	function handleCancel() {
		onOpenChange(false)
	}

	if (!imageSrc) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						<T k="person.crop.title" />
					</DialogTitle>
					<DialogDescription>
						<T k="person.crop.description" />
					</DialogDescription>
				</DialogHeader>
				<div className="relative h-64 w-full">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={1}
						onCropChange={setCrop}
						onCropComplete={onCropComplete}
						onZoomChange={setZoom}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						<T k="person.crop.cancel" />
					</Button>
					<Button onClick={handleCrop}>
						<T k="person.crop.confirm" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
