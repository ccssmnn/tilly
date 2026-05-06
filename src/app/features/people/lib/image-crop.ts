export { getCroppedImg }

async function getCroppedImg(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
	fileName: string,
): Promise<File> {
	let image = new Image()
	let canvas = document.createElement("canvas")
	let ctx = canvas.getContext("2d")

	if (!ctx) {
		throw new Error("No 2d context")
	}

	return new Promise((resolve, reject) => {
		image.onload = () => {
			canvas.width = pixelCrop.width
			canvas.height = pixelCrop.height

			ctx.drawImage(
				image,
				pixelCrop.x,
				pixelCrop.y,
				pixelCrop.width,
				pixelCrop.height,
				0,
				0,
				pixelCrop.width,
				pixelCrop.height,
			)

			canvas.toBlob(
				blob => {
					if (!blob) {
						reject(new Error("Canvas is empty"))
						return
					}
					let file = new File([blob], fileName, { type: "image/jpeg" })
					resolve(file)
				},
				"image/jpeg",
				0.95,
			)
		}
		image.onerror = reject
		image.src = imageSrc
	})
}
