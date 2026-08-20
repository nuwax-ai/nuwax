import { EventClient } from '@tanstack/devtools-event-client'

/**
 * Payload on the devtools event bus must be JSON-serializable: `ClientEventBus`
 * always stringifies events for `emitToServer` and `BroadcastChannel`, so live
 * util instances (with reactive `store` graphs) cannot be sent as-is.
 *
 * Live instances are kept in {@link pacerDevtoolsInstancesByKey} for the panel.
 */
export interface PacerDevtoolsWirePayload {
  key: string
  store: { state: unknown }
  options: unknown
}

const pacerDevtoolsInstancesByKey = new Map<string, unknown>()

export function registerPacerDevtoolsInstance(
  key: string,
  instance: unknown,
): void {
  pacerDevtoolsInstancesByKey.set(key, instance)
}

export function getPacerDevtoolsInstance(key: string): unknown {
  return pacerDevtoolsInstancesByKey.get(key)
}

function cloneJsonSafe(value: unknown): unknown {
  if (value === undefined) {
    return undefined
  }
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    return null
  }
}

function readStoreSnapshot(store: {
  get?: () => unknown
  state?: unknown
}): unknown {
  if (typeof store.get === 'function') {
    return store.get()
  }
  return store.state
}

function toPacerDevtoolsWirePayload(instance: {
  key: string
  store: { get?: () => unknown; state?: unknown }
  options: unknown
}): PacerDevtoolsWirePayload {
  return {
    key: instance.key,
    store: { state: cloneJsonSafe(readStoreSnapshot(instance.store)) },
    options: cloneJsonSafe(instance.options),
  }
}

/**
 * Suffix-only keys: {@link EventClient} prepends `pluginId:` (`pacer:`) at runtime
 * for `emit` / `on`. Wire `type` values are `pacer:${key}`.
 */
export interface PacerEventMap {
  'd-AsyncBatcher': PacerDevtoolsWirePayload
  'd-AsyncDebouncer': PacerDevtoolsWirePayload
  'd-AsyncQueuer': PacerDevtoolsWirePayload
  'd-AsyncRateLimiter': PacerDevtoolsWirePayload
  'd-AsyncRetryer': PacerDevtoolsWirePayload
  'd-AsyncThrottler': PacerDevtoolsWirePayload
  'd-Batcher': PacerDevtoolsWirePayload
  'd-Debouncer': PacerDevtoolsWirePayload
  'd-Queuer': PacerDevtoolsWirePayload
  'd-RateLimiter': PacerDevtoolsWirePayload
  'd-Throttler': PacerDevtoolsWirePayload
  AsyncBatcher: PacerDevtoolsWirePayload
  AsyncDebouncer: PacerDevtoolsWirePayload
  AsyncQueuer: PacerDevtoolsWirePayload
  AsyncRateLimiter: PacerDevtoolsWirePayload
  AsyncRetryer: PacerDevtoolsWirePayload
  AsyncThrottler: PacerDevtoolsWirePayload
  Batcher: PacerDevtoolsWirePayload
  Debouncer: PacerDevtoolsWirePayload
  Queuer: PacerDevtoolsWirePayload
  RateLimiter: PacerDevtoolsWirePayload
  Throttler: PacerDevtoolsWirePayload
}

export type PacerEventName = keyof PacerEventMap

type PacerUtilEmitSource = {
  key?: string
  store: { get?: () => unknown; state?: unknown }
  options: unknown
}

class PacerEventClient extends EventClient<PacerEventMap> {
  constructor(props?: { debug: boolean }) {
    super({
      pluginId: 'pacer',
      debug: props?.debug,
      /**
       * TanStack Devtools starts `ClientEventBus` inside an async dynamic import
       * after the first commit. Pacer utils often emit during the first render
       * (constructor → store sync). `EventClient` only retries `tanstack-connect`
       * `#maxRetries` times at `reconnectEveryMs` before it gives up and drops
       * all queued events permanently. Default 300ms × 5 ≈ 1.5s is often too
       * short; Form uses 1000ms here for the same reason.
       */
      reconnectEveryMs: 1000,
    })
  }
}

export const emitChange = <TEvent extends keyof PacerEventMap>(
  event: TEvent,
  instance: PacerUtilEmitSource,
) => {
  const key = instance.key
  if (!key) {
    return
  }
  registerPacerDevtoolsInstance(key, instance)
  pacerEventClient.emit(event, toPacerDevtoolsWirePayload({ ...instance, key }))
}

export const pacerEventClient = new PacerEventClient()
