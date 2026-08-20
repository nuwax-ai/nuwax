---
name: devtools-event-client
description: Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions.
type: core
library: '@tanstack/devtools-event-client'
library_version: '0.10.12'
sources:
  - packages/event-bus-client/src/plugin.ts
  - docs/event-system.md
  - docs/building-custom-plugins.md
---

# devtools-event-client

Typed event emitter/listener that connects application code to TanStack Devtools panels. Framework-agnostic. Works in React, Vue, Solid, Preact, and vanilla JS.

## Setup

Install the package:

```bash
npm i @tanstack/devtools-event-client
```

The package exports a single class:

```ts
import { EventClient } from '@tanstack/devtools-event-client'
```

### Constructor Options

| Option             | Type      | Required | Default | Description                                                                           |
| ------------------ | --------- | -------- | ------- | ------------------------------------------------------------------------------------- |
| `pluginId`         | `string`  | Yes      | --      | Identifies this plugin in the event system. Must be unique across all plugins.        |
| `debug`            | `boolean` | No       | `false` | Enable verbose console logging prefixed with `[tanstack-devtools:{pluginId}-plugin]`. |
| `enabled`          | `boolean` | No       | `true`  | When `false`, `emit()` is a no-op and `on()` returns a no-op cleanup function.        |
| `reconnectEveryMs` | `number`  | No       | `300`   | Interval in ms between connection retry attempts (max 5 retries).                     |

## Core Patterns

### 1. Define an Event Map and Create a Singleton Client

Define a TypeScript type mapping event suffixes to payload types. Extend `EventClient` and export a single instance at module level.

```ts
import { EventClient } from '@tanstack/devtools-event-client'

type StoreEvents = {
  'state-changed': { storeName: string; state: unknown; timestamp: number }
  'action-dispatched': { storeName: string; action: string; payload: unknown }
  reset: void
}

class StoreInspectorClient extends EventClient<StoreEvents> {
  constructor() {
    super({ pluginId: 'store-inspector' })
  }
}

// Module-level singleton -- one instance per plugin
export const storeInspector = new StoreInspectorClient()
```

Event map keys are suffixes only. The `pluginId` is prepended automatically. With `pluginId: 'store-inspector'` and key `'state-changed'`, the fully qualified event on the bus is `'store-inspector:state-changed'`.

### 2. Emit Events

Call `emit(suffix, payload)` from library code. Pass only the suffix.

```ts
function dispatch(action: string, payload: unknown) {
  state = reducer(state, action, payload)

  storeInspector.emit('state-changed', {
    storeName: 'main',
    state,
    timestamp: Date.now(),
  })
  storeInspector.emit('action-dispatched', {
    storeName: 'main',
    action,
    payload,
  })
}
```

If the bus is not connected yet, events are queued in memory and flushed once the connection succeeds. If the connection fails after 5 retries (1.5s at default settings), the client gives up and subsequent `emit()` calls are silently dropped.

Connection to the bus is initiated lazily on the first `emit()` call, not on construction or `on()`.

### 3. Listen to Events

All listener methods return a cleanup function.

**`on(suffix, callback)`** -- listen to a specific event from this plugin:

```ts
const cleanup = storeInspector.on('state-changed', (event) => {
  // event.type    === 'store-inspector:state-changed'
  // event.payload === { storeName: string; state: unknown; timestamp: number }
  // event.pluginId === 'store-inspector'
  console.log(event.payload.state)
})

// Stop listening
cleanup()
```

**`on(suffix, callback, { withEventTarget: true })`** -- also register on an internal EventTarget so events emitted and listened to on the same client instance are delivered immediately without going through the global bus:

```ts
const cleanup = storeInspector.on(
  'state-changed',
  (event) => {
    console.log(event.payload.state)
  },
  { withEventTarget: true },
)
```

**`onAll(callback)`** -- listen to all events from all plugins:

```ts
const cleanup = storeInspector.onAll((event) => {
  console.log(event.type, event.payload)
})
```

**`onAllPluginEvents(callback)`** -- listen to all events from this plugin only (filtered by `pluginId`):

```ts
const cleanup = storeInspector.onAllPluginEvents((event) => {
  // Only fires when event.pluginId === 'store-inspector'
  console.log(event.type, event.payload)
})
```

### 4. Connection Lifecycle and Disabling

The connection lifecycle is:

1. First `emit()` dispatches `tanstack-connect` and starts a retry loop.
2. Retries every `reconnectEveryMs` (default 300ms), up to 5 attempts.
3. On `tanstack-connect-success`, queued events are flushed in order.
4. After 5 failed retries, `failedToConnect` is set permanently. All subsequent `emit()` calls are silently dropped (not queued).

To disable the client entirely (e.g., in production):

```ts
class StoreInspectorClient extends EventClient<StoreEvents> {
  constructor() {
    super({
      pluginId: 'store-inspector',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}
```

When `enabled` is `false`, `emit()` is a no-op and `on()`/`onAll()`/`onAllPluginEvents()` return no-op cleanup functions.

## Common Mistakes

### 1. Including pluginId prefix in event names (CRITICAL)

`EventClient` auto-prepends the `pluginId` to all event names. Including the prefix manually produces a double-prefixed event name that nothing will match.

Wrong:

```ts
storeInspector.emit('store-inspector:state-changed', data)
// Dispatches 'store-inspector:store-inspector:state-changed'
```

Correct:

```ts
storeInspector.emit('state-changed', data)
// Dispatches 'store-inspector:state-changed'
```

This applies to `on()` as well. Pass only the suffix.

### 2. Creating multiple EventClient instances per plugin (CRITICAL)

Each `EventClient` instance manages its own connection, event queue, and listeners independently. Creating multiple instances for the same plugin causes duplicate handlers, multiple connection attempts, and unpredictable event delivery.

Wrong:

```tsx
function MyComponent() {
  // New instance on every render
  const client = new StoreInspectorClient()
  client.emit('state-changed', data)
}
```

Correct:

```ts
// store-inspector-client.ts
export const storeInspector = new StoreInspectorClient()

// MyComponent.tsx
import { storeInspector } from './store-inspector-client'
function MyComponent() {
  storeInspector.emit('state-changed', data)
}
```

### 3. Non-unique pluginId causing event collisions (CRITICAL)

Two plugins with the same `pluginId` share an event namespace. Events emitted by one are received by listeners on the other. Choose a unique, descriptive `pluginId` (e.g., `'my-org-store-inspector'` rather than `'store'`).

### 4. Not realizing events drop after 5 failed retries (HIGH)

After 5 retries (1.5s at default `reconnectEveryMs: 300`), `failedToConnect` is set permanently. Subsequent `emit()` calls are silently dropped -- they are not queued and will never be delivered, even if the bus becomes available later.

If you need events to survive longer startup delays, increase `reconnectEveryMs`:

```ts
super({ pluginId: 'store-inspector', reconnectEveryMs: 1000 })
// 5 retries * 1000ms = 5s window
```

There is no way to increase the retry count (hardcoded to 5).

### 5. Expecting connection on construction or on() (HIGH)

The connection to the event bus is initiated lazily on the first `emit()` call. Calling `on()` alone does not trigger a connection. If your panel calls `on()` but the library side never calls `emit()`, the client never connects to the bus.

This means if you only listen (no emitting), the `on()` handler still works for events dispatched directly on the global event target, but the connection handshake (`tanstack-connect` / `tanstack-connect-success`) never runs.

### 6. Using non-serializable payloads (HIGH)

When the server event bus is enabled, events are serialized via JSON for transport over WebSocket/SSE/BroadcastChannel. Payloads containing functions, DOM nodes, class instances, `Map`/`Set`, or circular references will fail silently or lose data.

Wrong:

```ts
storeInspector.emit('state-changed', {
  storeName: 'main',
  state,
  callback: () => {}, // Function -- not serializable
  element: document.body, // DOM node -- not serializable
})
```

Correct:

```ts
storeInspector.emit('state-changed', {
  storeName: 'main',
  state: JSON.parse(JSON.stringify(state)), // Ensure serializable
  timestamp: Date.now(),
})
```

### 7. Not stripping EventClient emit calls for production (HIGH)

The Vite plugin strips adapter imports (e.g., `@tanstack/react-devtools`) from production builds, but it does NOT strip `@tanstack/devtools-event-client` imports or `emit()` calls. Library authors must guard emit calls themselves.

Options:

**Option A:** Use the `enabled` constructor option:

```ts
super({
  pluginId: 'store-inspector',
  enabled: process.env.NODE_ENV !== 'production',
})
```

**Option B:** Conditional guard at the call site:

```ts
if (process.env.NODE_ENV !== 'production') {
  storeInspector.emit('state-changed', data)
}
```

When `enabled` is `false`, `emit()` returns immediately (no event creation, no queuing, no connection attempt). This is the preferred approach.

## See Also

- `devtools-instrumentation` -- after creating a client, instrument library code with strategic emissions
- `devtools-plugin-panel` -- the client emits events, the panel listens using the same event map
- `devtools-bidirectional` -- two-way communication between panel and application using the same EventClient
