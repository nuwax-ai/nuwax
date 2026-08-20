/**
 * use non-native event emitter for the benefit of non-node runtimes like CF workers.
 */
import { Emitter } from '@segment/analytics-generic-utils'
import { detectRuntime } from './env'

/**
 * adapted from: https://www.npmjs.com/package/node-abort-controller
 */
export class AbortSignal {
  onabort: globalThis.AbortSignal['onabort'] = null
  aborted = false
  eventEmitter = new Emitter()

  toString() {
    return '[object AbortSignal]'
  }
  get [Symbol.toStringTag]() {
    return 'AbortSignal'
  }
  removeEventListener(...args: Parameters<Emitter['off']>) {
    this.eventEmitter.off(...args)
  }
  addEventListener(...args: Parameters<Emitter['on']>) {
    this.eventEmitter.on(...args)
  }
  dispatchEvent(type: string) {
    const event = { type, target: this }

    const handlerName = `on${type}`

    if (typeof (this as any)[handlerName] === 'function') {
      ;(this as any)[handlerName](event)
    }

    this.eventEmitter.emit(type, event)
  }
}

/**
 * This polyfill is only neccessary to support versions of node < 14.17.
 * Can be removed once node 14 support is dropped.
 */
export class AbortController {
  signal = new AbortSignal()
  abort() {
    if (this.signal.aborted) return

    this.signal.aborted = true
    this.signal.dispatchEvent('abort')
  }
  toString() {
    return '[object AbortController]'
  }
  get [Symbol.toStringTag]() {
    return 'AbortController'
  }
}

/**
 * @param timeoutMs - Set a request timeout, after which the request is cancelled.
 */
export const abortSignalAfterTimeout = (timeoutMs: number) => {
  if (detectRuntime() === 'cloudflare-worker') {
    return [] // TODO: this is broken in cloudflare workers, otherwise results in "A hanging Promise was canceled..." error.
  }
  const ac = new (globalThis.AbortController || AbortController)()

  const timeoutId = setTimeout(() => {
    ac.abort()
  }, timeoutMs)

  // Allow Node.js processes to exit early if only the timeout is running
  timeoutId?.unref?.()

  return [ac.signal, timeoutId] as const
}
