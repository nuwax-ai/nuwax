---
name: devtools-instrumentation
description: Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging.
type: core
library: '@tanstack/devtools-event-client'
library_version: '0.10.12'
requires: devtools-event-client
sources:
  - packages/event-bus-client/src/plugin.ts
  - packages/event-bus/src/client/client.ts
  - packages/event-bus/src/server/server.ts
  - packages/devtools-client/src/index.ts
  - docs/building-custom-plugins.md
  - docs/bidirectional-communication.md
---

# devtools-instrumentation

> **Prerequisite:** Read the `devtools-event-client` skill first for EventClient creation, event maps, and `emit()`/`on()` API.

Strategic placement of `emit()` calls inside a library to send high-value diagnostic data to TanStack Devtools panels. Maximum insight with minimum noise.

## Key Insight

The event bus transparently bridges server/client and cross-tab boundaries. `emit()` on the server arrives on the client via WebSocket/SSE. `emit()` in one tab reaches other tabs via `BroadcastChannel`. No transport code needed -- just emit at the right place.

For prototyping, throw in many events. For production, consolidate down to the fewest events that carry the most information.

## Where to Instrument

Emit at **architecture boundaries**, not inside implementation details:

1. **Middleware/interceptor entry and exit** -- wrap the chain, not each middleware
2. **State transitions** -- when state moves between logical phases (idle -> loading -> success/error)
3. **Lifecycle hooks** -- mount, unmount, connect, disconnect, ready
4. **Error boundaries** -- caught exceptions, retries, fallbacks
5. **User-initiated actions processed** -- after fully applied, not before

Do NOT emit from: internal utility functions, loop iterations, getter/setter accesses, intermediate computation steps.

## Core Patterns

### 1. Middleware/Interceptor Instrumentation

Wrap the pipeline at the boundary, not each middleware individually.

```ts
import { EventClient } from '@tanstack/devtools-event-client'

type RouterEvents = {
  'request-processed': {
    id: string
    method: string
    path: string
    duration: number
    middlewareChain: Array<{ name: string; durationMs: number }>
    status: number
    error?: string
  }
}

class RouterDevtoolsClient extends EventClient<RouterEvents> {
  constructor() {
    super({
      pluginId: 'my-router',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}

export const routerDevtools = new RouterDevtoolsClient()
```

```ts
async function runMiddlewarePipeline(
  req: Request,
  middlewares: Middleware[],
): Promise<Response> {
  const requestId = crypto.randomUUID()
  const pipelineStart = performance.now()
  const chain: Array<{ name: string; durationMs: number }> = []
  let status = 200
  let error: string | undefined

  for (const mw of middlewares) {
    const mwStart = performance.now()
    try {
      await mw.handle(req)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      status = 500
      break
    }
    chain.push({ name: mw.name, durationMs: performance.now() - mwStart })
  }

  // Single consolidated event at the boundary
  routerDevtools.emit('request-processed', {
    id: requestId,
    method: req.method,
    path: req.url,
    duration: performance.now() - pipelineStart,
    middlewareChain: chain,
    status,
    error,
  })

  return new Response(null, { status })
}
```

ONE event per request, not 2N events (start + end for each middleware).

### 2. State Transition Emission

Emit when the state machine moves between phases, not on every internal mutation.

```ts
type QueryEvents = {
  'query-lifecycle': {
    queryKey: string
    from: 'idle' | 'loading' | 'success' | 'error' | 'stale'
    to: 'idle' | 'loading' | 'success' | 'error' | 'stale'
    data?: unknown
    error?: string
    fetchDuration?: number
    timestamp: number
  }
}

class QueryDevtoolsClient extends EventClient<QueryEvents> {
  constructor() {
    super({
      pluginId: 'my-query-lib',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}

export const queryDevtools = new QueryDevtoolsClient()
```

```ts
class Query {
  #state: QueryState = 'idle'

  private transition(
    to: QueryState,
    extra?: Partial<QueryEvents['query-lifecycle']>,
  ) {
    const from = this.#state
    if (from === to) return // No transition, no event
    this.#state = to
    queryDevtools.emit('query-lifecycle', {
      queryKey: this.key,
      from,
      to,
      timestamp: Date.now(),
      ...extra,
    })
  }

  async fetch() {
    this.transition('loading')
    const start = performance.now()
    try {
      const data = await this.fetcher()
      this.transition('success', {
        data: structuredClone(data),
        fetchDuration: performance.now() - start,
      })
    } catch (e) {
      this.transition('error', {
        error: e instanceof Error ? e.message : String(e),
        fetchDuration: performance.now() - start,
      })
    }
  }
}
```

### 3. Consolidated Events with DRY Payloads

When multiple events share fields, build a shared base and spread it.

```ts
class Store {
  private basePayload() {
    return {
      storeName: this.#name,
      version: this.#version,
      sessionId: this.#sessionId,
      timestamp: Date.now(),
    }
  }

  dispatch(
    action: string,
    updater: (s: Record<string, unknown>) => Record<string, unknown>,
  ) {
    const prevState = structuredClone(this.#state)
    this.#state = updater(this.#state)
    this.#version++
    storeDevtools.emit('store-updated', {
      ...this.basePayload(),
      action,
      prevState,
      nextState: structuredClone(this.#state),
    })
  }

  reset(initial: Record<string, unknown>) {
    this.#state = initial
    this.#version++
    storeDevtools.emit('store-reset', this.basePayload())
  }
}
```

### 4. Debouncing High-Frequency Emissions

Reactive systems, scroll handlers, and streaming data can trigger hundreds of emissions per second. Debounce or throttle these.

```ts
function createDebouncedEmitter<TEvents extends Record<string, any>>(
  client: EventClient<TEvents>,
  delayMs: number,
) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  return function debouncedEmit<K extends keyof TEvents & string>(
    event: K,
    payload: TEvents[K],
  ) {
    const existing = timers.get(event)
    if (existing) clearTimeout(existing)
    timers.set(
      event,
      setTimeout(() => {
        client.emit(event, payload)
        timers.delete(event)
      }, delayMs),
    )
  }
}

const debouncedEmit = createDebouncedEmitter(storeDevtools, 100)
signal.subscribe((value) => {
  debouncedEmit('signal-updated', { value, timestamp: Date.now() })
})
```

For leading+trailing (throttle), use the same pattern with a `lastEmit` timestamp check to emit immediately on the leading edge.

### 5. Production Guarding

`enabled: false` is the primary guard -- `emit()` returns immediately with no allocation, no queuing, no connection.

```ts
class MyLibDevtools extends EventClient<MyEvents> {
  constructor() {
    super({
      pluginId: 'my-lib',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}
```

For expensive payload construction (e.g., `structuredClone` of large state), guard at the call site:

```ts
if (process.env.NODE_ENV !== 'production') {
  myDevtools.emit('state-snapshot', {
    state: structuredClone(largeState),
    timestamp: Date.now(),
  })
}
```

**Important:** The Vite plugin strips `@tanstack/react-devtools` from production but does NOT strip `@tanstack/devtools-event-client`. You must guard yourself.

### 6. Server/Client Transparent Bridging

The same `emit()` works on server and client:

- **Client**: dispatches `CustomEvent` on `window` -> `ClientEventBus` -> other tabs via `BroadcastChannel` + server via WebSocket
- **Server**: dispatches on `globalThis.__TANSTACK_EVENT_TARGET__` -> `ServerEventBus` -> all WebSocket/SSE clients

```ts
// Server-side (e.g., SSR handler) -- arrives in browser devtools panel automatically
routerDevtools.emit('request-processed', {
  id: crypto.randomUUID(),
  method: req.method,
  path: new URL(req.url).pathname,
  duration: performance.now() - start,
  middlewareChain: chain,
  status: 200,
})
```

## Instrumentation Checklist

1. Map architecture boundaries (middleware chain, state machine, lifecycle hooks, error paths)
2. Design ONE consolidated event per boundary with full context payload
3. Keep event map small (3-7 types typical, not 15-30)
4. Create EventClient with `enabled: process.env.NODE_ENV !== 'production'`
5. Use shared base payloads (DRY) for fields common across events
6. Debounce any emission point that fires >10 times/second
7. Guard expensive payload construction with `process.env.NODE_ENV` check
8. Test with `debug: true` to see `[tanstack-devtools:{pluginId}-plugin]` prefixed logs

## Common Mistakes

### HIGH: Emitting too many granular events

Wrong -- 15 events per request:

```ts
routerDevtools.emit('request-start', { id, method, path })
routerDevtools.emit('middleware-1-start', { id, name: 'auth' })
routerDevtools.emit('middleware-1-end', { id, name: 'auth', duration: 5 })
// ... 10 more ...
routerDevtools.emit('response-end', { id, duration: 50 })
```

Correct -- 1 event with all data:

```ts
routerDevtools.emit('request-processed', {
  id,
  method,
  path,
  duration: 50,
  middlewareChain: [
    { name: 'auth', durationMs: 5 },
    { name: 'cors', durationMs: 1 },
  ],
  status: 200,
})
```

Source: maintainer interview

### HIGH: Emitting in hot loops without debouncing

Wrong:

```ts
signal.subscribe((value) => {
  devtools.emit('signal-updated', { value, timestamp: Date.now() }) // 60+ times/sec
})
```

Correct:

```ts
const debouncedEmit = createDebouncedEmitter(devtools, 100)
signal.subscribe((value) => {
  debouncedEmit('signal-updated', { value, timestamp: Date.now() })
})
```

Source: docs/bidirectional-communication.md

### MEDIUM: Not emitting at architecture boundaries

Wrong -- instrumented inside a helper:

```ts
function parseQueryString(url: string) {
  const params = new URLSearchParams(url)
  devtools.emit('query-parsed', { params: Object.fromEntries(params) })
  return params
}
```

Correct -- instrumented at the handler boundary:

```ts
function handleRequest(req: Request) {
  const params = parseQueryString(req.url)
  const result = processRequest(params)
  devtools.emit('request-processed', {
    path: req.url,
    params: Object.fromEntries(params),
    result: result.summary,
    duration: performance.now() - start,
  })
}
```

Source: maintainer interview

### MEDIUM: Hardcoding repeated payload fields

Wrong:

```ts
devtools.emit('action-a', {
  storeName: this.name,
  version: this.version,
  sessionId: this.sessionId,
  timestamp: Date.now(),
  data,
})
devtools.emit('action-b', {
  storeName: this.name,
  version: this.version,
  sessionId: this.sessionId,
  timestamp: Date.now(),
  other,
})
```

Correct:

```ts
const base = this.basePayload()
devtools.emit('action-a', { ...base, data })
devtools.emit('action-b', { ...base, other })
```

Source: maintainer interview
