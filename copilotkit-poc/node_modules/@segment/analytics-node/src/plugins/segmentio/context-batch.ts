import { uuid } from '../../lib/uuid'
import type { Context } from '../../app/context'
import { SegmentEvent } from '../../app/types'

const MAX_EVENT_SIZE_IN_KB = 32
const MAX_BATCH_SIZE_IN_KB = 480 //  (500 KB is the limit, leaving some padding)

interface PendingItem {
  resolver: (ctx: Context) => void
  context: Context
}

export class ContextBatch {
  public id = uuid()
  private items: PendingItem[] = []
  private sizeInBytes = 0
  private maxEventCount: number

  constructor(maxEventCount: number) {
    this.maxEventCount = Math.max(1, maxEventCount)
  }
  public tryAdd(
    item: PendingItem
  ): { success: true } | { success: false; message: string } {
    if (this.length === this.maxEventCount)
      return {
        success: false,
        message: `Event limit of ${this.maxEventCount} has been exceeded.`,
      }

    const eventSize = this.calculateSize(item.context)
    if (eventSize > MAX_EVENT_SIZE_IN_KB * 1024) {
      return {
        success: false,
        message: `Event exceeds maximum event size of ${MAX_EVENT_SIZE_IN_KB} KB`,
      }
    }

    if (this.sizeInBytes + eventSize > MAX_BATCH_SIZE_IN_KB * 1024) {
      return {
        success: false,
        message: `Event has caused batch size to exceed ${MAX_BATCH_SIZE_IN_KB} KB`,
      }
    }

    this.items.push(item)
    this.sizeInBytes += eventSize
    return { success: true }
  }

  get length(): number {
    return this.items.length
  }

  private calculateSize(ctx: Context): number {
    return encodeURI(JSON.stringify(ctx.event)).split(/%..|i/).length
  }

  getEvents(): SegmentEvent[] {
    const events = this.items.map(({ context }) => context.event)
    return events
  }

  getContexts(): Context[] {
    return this.items.map((item) => item.context)
  }

  resolveEvents(): void {
    this.items.forEach(({ resolver, context }) => resolver(context))
  }
}
