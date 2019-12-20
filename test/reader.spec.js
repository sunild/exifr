import {promises as fs} from 'fs'
import {assert} from './test-util.js'
import {isBrowser, isNode, getPath, getUrl, getFile} from './test-util.js'
import Exifr from '../src/index-full.js'


export function createImg(url) {
	var img = document.createElement('img')
	img.src = url
	document.querySelector('#temp').append(img)
	return img
}

export async function createArrayBuffer(urlOrPath) {
	let bufferOrAb = await getFile(urlOrPath)
	if (bufferOrAb instanceof Uint8Array)
		return bufferOrAb.buffer
	else
		return bufferOrAb
}

export function createBlob(url) {
	return fetch(url).then(res => res.blob())
}

export async function createObjectUrl(url) {
	return URL.createObjectURL(await createBlob(url))
}

export async function createBase64Url(url) {
	if (isBrowser) {
		return new Promise(async (resolve, reject) => {
			var blob = await createBlob(url)
			var reader = new FileReader()
			reader.onloadend = () => resolve(reader.result)
			reader.onerror = reject
			reader.readAsDataURL(blob) 
		})
	} else if (isNode) {
		var buffer = await fs.readFile(url)
		return 'data:image/jpeg;base64,' + buffer.toString('base64')
	}
}

export function createWorker(input) {
	return new Promise((resolve, reject) => {
		let worker = new Worker('worker.js', { type: "module" })
		worker.postMessage(input)
		worker.onmessage = e => resolve(e.data)
		worker.onerror = err => reject('WebWorker onerror')
	})
}

describe('reader', () => {

	describe('input formats', () => {

		it(`ArrayBuffer`, async () => {
			var arrayBuffer = await createArrayBuffer('IMG_20180725_163423.jpg')
			var output = await Exifr.parse(arrayBuffer)
			assert.exists(output, `output is undefined`)
		})

		it(`DataView`, async () => {
			var arrayBuffer = await createArrayBuffer('IMG_20180725_163423.jpg')
			let dataView = new DataView(arrayBuffer)
			var output = await Exifr.parse(dataView)
			assert.exists(output, `output is undefined`)
		})

		it(`Uint8Array`, async () => {
			var arrayBuffer = await createArrayBuffer('IMG_20180725_163423.jpg')
			let uint8Array = new Uint8Array(arrayBuffer)
			var output = await Exifr.parse(uint8Array)
			assert.exists(output, `output is undefined`)
		})

		isNode && it(`Node: Buffer`, async () => {
			var buffer = await fs.readFile(getPath('IMG_20180725_163423.jpg'))
			var output = await Exifr.parse(buffer)
			assert.exists(output, `output is undefined`)
		})

		isBrowser && it(`Browser: Blob`, async () => {
			var blob = await createBlob(getPath('IMG_20180725_163423.jpg'))
			var output = await Exifr.parse(blob)
			assert.exists(output, `output is undefined`)
		})

		isNode && it(`Node: string file path`, async () => {
			let path = getPath('IMG_20180725_163423.jpg')
			var output = await Exifr.parse(path)
			assert.exists(output, `output is undefined`)
		})

		isBrowser && it(`Browser: string URL`, async () => {
			let url = getUrl('IMG_20180725_163423.jpg')
			var output = await Exifr.parse(url)
			assert.exists(output, `output is undefined`)
		})

		isBrowser && it(`Browser: Object URL`, async () => {
			var blob = await createObjectUrl(getPath('IMG_20180725_163423.jpg'))
			var output = await Exifr.parse(blob)
			assert.exists(output, `output is undefined`)
		})

		it(`Browser & Node: base64 URL`, async () => {
			var blob = await createBase64Url(getPath('IMG_20180725_163423.jpg'))
			var output = await Exifr.parse(blob)
			assert.exists(output, `output is undefined`)
		})

		isBrowser && it(`Browser: <img> element with normal URL`, async () => {
			var img = createImg(getPath('IMG_20180725_163423.jpg'))
			var output = await Exifr.parse(img)
			assert.exists(output, `output is undefined`)
		})

		isBrowser && it(`Browser: <img> element with Object URL`, async () => {
			var img = createImg(await createObjectUrl(getPath('IMG_20180725_163423.jpg')))
			var output = await Exifr.parse(img)
			assert.exists(output, `output is undefined`)
		})

		describe('Browser: WebWoker', () => {

			isBrowser && it(`MJS: string URL`, async () => {
				let url = getUrl('IMG_20180725_163423.jpg')
				let output = await createWorker(url)
				assert.isObject(output, `output is undefined`)
			})

			isBrowser && it(`MJS: ArrayBuffer`, async () => {
				let arrayBuffer = await createArrayBuffer('IMG_20180725_163423.jpg')
				let output = await createWorker(arrayBuffer)
				assert.isObject(output, `output is undefined`)
			})

		})

	})

})
