export { blobToDataURL, dataURLToFile }

async function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise(resolve => {
		let reader = new FileReader()
		reader.onloadend = () => resolve(reader.result as string)
		reader.readAsDataURL(blob)
	})
}

async function dataURLToFile(
	dataURL: string,
	filename = "avatar.jpg",
): Promise<File> {
	let response = await fetch(dataURL)
	let blob = await response.blob()
	return new File([blob], filename, { type: blob.type })
}
