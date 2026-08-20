/* @ts-self-types="./index.d.ts" */
import { urlAlphabet as scopedUrlAlphabet } from './url-alphabet/index.js'
export { urlAlphabet } from './url-alphabet/index.js'
export let random = bytes => crypto.getRandomValues(new Uint8Array(bytes))
export let customRandom = (alphabet, defaultSize, getRandom) => {
  let safeByteCutoff = 256 - (256 % alphabet.length)
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1
    return (size = defaultSize) => {
      if (!size) return ''
      let id = ''
      while (true) {
        let bytes = getRandom(size)
        let j = size
        while (j--) {
          id += alphabet[bytes[j] & mask]
          if (id.length >= size) return id
        }
      }
    }
  }
  let step = Math.ceil((1.6 * 256 * defaultSize) / safeByteCutoff)
  return (size = defaultSize) => {
    if (!size) return ''
    let id = ''
    while (true) {
      let bytes = getRandom(step)
      let j = step
      while (j--) {
        if (bytes[j] < safeByteCutoff) {
          id += alphabet[bytes[j] % alphabet.length]
          if (id.length >= size) return id
        }
      }
    }
  }
}
export let customAlphabet = (alphabet, size = 21) =>
  customRandom(alphabet, size | 0, random)
export let nanoid = (size = 21) => {
  let id = ''
  let bytes = crypto.getRandomValues(new Uint8Array((size |= 0)))
  while (size--) {
    id += scopedUrlAlphabet[bytes[size] & 63]
  }
  return id
}
