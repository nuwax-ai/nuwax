import { webcrypto as crypto } from 'node:crypto'
import { urlAlphabet as scopedUrlAlphabet } from './url-alphabet/index.js'
export { urlAlphabet } from './url-alphabet/index.js'
const POOL_SIZE_MULTIPLIER = 128
let pool, poolOffset
function fillPool(bytes) {
  if (bytes < 0 || bytes > 1024) throw new RangeError('Wrong ID size')
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER)
    crypto.getRandomValues(pool)
    poolOffset = 0
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool)
    poolOffset = 0
  }
  poolOffset += bytes
}
export function random(bytes) {
  fillPool((bytes |= 0))
  return pool.subarray(poolOffset - bytes, poolOffset)
}
export function customRandom(alphabet, defaultSize, getRandom) {
  let safeByteCutoff = 256 - (256 % alphabet.length)
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1
    return (size = defaultSize) => {
      if (!size) return ''
      let id = ''
      while (true) {
        let bytes = getRandom(size)
        let i = size
        while (i--) {
          id += alphabet[bytes[i] & mask]
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
      let i = step
      while (i--) {
        if (bytes[i] < safeByteCutoff) {
          id += alphabet[bytes[i] % alphabet.length]
          if (id.length >= size) return id
        }
      }
    }
  }
}
export function customAlphabet(alphabet, size = 21) {
  return customRandom(alphabet, size, random)
}
export function nanoid(size = 21) {
  fillPool((size |= 0))
  let id = ''
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += scopedUrlAlphabet[pool[i] & 63]
  }
  return id
}
