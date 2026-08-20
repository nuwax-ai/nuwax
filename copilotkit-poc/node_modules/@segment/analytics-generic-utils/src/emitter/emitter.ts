type EventName = string
type EventFnArgs = any[]
type EmitterContract = Record<EventName, EventFnArgs>

export interface EmitterOptions {
  /** How many event listeners for a particular event before emitting a warning (0 = disabled)
   *  @default 10
   **/
  maxListeners?: number
}

/**
 * Event Emitter that takes the expected contract as a generic
 * @example
 * ```ts
 *  type Contract = {
 *    delivery_success: [DeliverySuccessResponse, Metrics],
 *    delivery_failure: [DeliveryError]
 * }
 *  new Emitter<Contract>()
 *  .on('delivery_success', (res, metrics) => ...)
 *  .on('delivery_failure', (err) => ...)
 * ```
 */
export class Emitter<Contract extends EmitterContract = EmitterContract> {
  maxListeners: number
  constructor(options?: EmitterOptions) {
    this.maxListeners = options?.maxListeners ?? 10
  }
  private callbacks: Partial<Contract> = {}
  private warned = false

  private warnIfPossibleMemoryLeak<EventName extends keyof Contract>(
    event: EventName
  ) {
    if (this.warned) {
      return
    }
    if (
      this.maxListeners &&
      this.callbacks[event]!.length > this.maxListeners
    ) {
      console.warn(
        `Event Emitter: Possible memory leak detected; ${String(
          event
        )} has exceeded ${this.maxListeners} listeners.`
      )
      this.warned = true
    }
  }

  on<EventName extends keyof Contract>(
    event: EventName,
    callback: (...args: Contract[EventName]) => void
  ): this {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [callback] as Contract[EventName]
    } else {
      this.callbacks[event]!.push(callback)
      this.warnIfPossibleMemoryLeak(event)
    }
    return this
  }

  once<EventName extends keyof Contract>(
    event: EventName,
    callback: (...args: Contract[EventName]) => void
  ): this {
    const on = (...args: Contract[EventName]): void => {
      this.off(event, on)
      callback.apply(this, args)
    }

    this.on(event, on)
    return this
  }

  off<EventName extends keyof Contract>(
    event: EventName,
    callback: (...args: Contract[EventName]) => void
  ): this {
    const fns = this.callbacks[event] ?? []
    const without = fns.filter((fn) => fn !== callback) as Contract[EventName]
    this.callbacks[event] = without
    return this
  }

  emit<EventName extends keyof Contract>(
    event: EventName,
    ...args: Contract[EventName]
  ): this {
    const callbacks = this.callbacks[event] ?? []
    callbacks.forEach((callback) => {
      callback.apply(this, args)
    })
    return this
  }
}
