import { dispatch } from '@segment/analytics-core'
import type { NodeEmitter } from './emitter'
import { Context } from './context'
import { NodeEventQueue } from './event-queue'
import { SegmentEvent } from './types'

export type Callback = (err?: unknown, ctx?: Context) => void

const normalizeDispatchCb = (cb: Callback) => (ctx: Context) => {
  const failedDelivery = ctx.failedDelivery()
  return failedDelivery ? cb(failedDelivery.reason, ctx) : cb(undefined, ctx)
}

/* Dispatch function, but swallow promise rejections and use event emitter instead */
export const dispatchAndEmit = async (
  event: SegmentEvent,
  queue: NodeEventQueue,
  emitter: NodeEmitter,
  callback?: Callback
): Promise<void> => {
  try {
    const context = new Context(event)
    const ctx = await dispatch(context, queue, emitter, {
      ...(callback ? { callback: normalizeDispatchCb(callback) } : {}),
    })
    const failedDelivery = ctx.failedDelivery()
    if (failedDelivery) {
      emitter.emit('error', {
        code: 'delivery_failure',
        reason: failedDelivery.reason,
        ctx: ctx,
      })
    } else {
      emitter.emit(event.type, ctx)
    }
  } catch (err) {
    emitter.emit('error', {
      code: 'unknown',
      reason: err,
    })
  }
}
