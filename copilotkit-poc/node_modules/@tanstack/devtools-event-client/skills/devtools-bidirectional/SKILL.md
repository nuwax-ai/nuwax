---
name: devtools-bidirectional
description: Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only.
type: core
library: '@tanstack/devtools-event-client'
library_version: '0.10.12'
requires: devtools-event-client
sources:
  - packages/event-bus-client/src/plugin.ts
  - docs/bidirectional-communication.md
---

# devtools-bidirectional

> **Prerequisite:** Read and understand the `devtools-event-client` skill first. This skill builds on `EventClient`, its event map types, `emit()`/`on()` API, pluginId namespacing, connection lifecycle, and singleton pattern. Everything here assumes you already have a working `EventClient` instance.

Two-way communication between your application and a TanStack Devtools panel using `EventClient`. The same client instance handles both directions: the app emits observation events that the panel listens to, and the panel emits command events that the app listens to.

## Core Concept

`EventClient` is not unidirectional. Both `emit()` and `on()` work from either side -- application code or panel code -- on the same shared event bus. The direction is a convention you establish through your event map design, not a limitation of the API.

```
App code calls:    client.emit('state-update', ...)     // observation
Panel code calls:  client.on('state-update', ...)       // observation

Panel code calls:  client.emit('set-state', ...)        // command
App code calls:    client.on('set-state', ...)          // command
```

## Core Patterns

### 1. App-to-Devtools Observation

The app emits state changes. The panel listens and renders.

**Event map and client (shared module):**

```ts
import { EventClient } from '@tanstack/devtools-event-client'

type CounterEvents = {
  // Observation: app -> panel
  'state-update': { count: number; updatedAt: number }
}

class CounterDevtoolsClient extends EventClient<CounterEvents> {
  constructor() {
    super({
      pluginId: 'counter-inspector',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}

export const counterClient = new CounterDevtoolsClient()
```

**App side -- emit on state changes:**

```ts
import { counterClient } from './counter-devtools-client'

function increment() {
  count += 1
  counterClient.emit('state-update', {
    count,
    updatedAt: Date.now(),
  })
}
```

**Panel side -- listen and display:**

```ts
import { counterClient } from './counter-devtools-client'

const cleanup = counterClient.on('state-update', (event) => {
  // event.payload.count
  // event.payload.updatedAt
  renderPanel(event.payload)
})
```

### 2. Devtools-to-App Commands

The panel sends commands. The app listens and mutates state.

**Extend the event map with command events:**

```ts
type CounterEvents = {
  // Observation: app -> panel
  'state-update': { count: number; updatedAt: number }
  // Commands: panel -> app
  reset: void
  'set-count': { count: number }
}
```

**Panel side -- emit commands on user interaction:**

```ts
import { counterClient } from './counter-devtools-client'

function handleResetClick() {
  counterClient.emit('reset', undefined)
}

function handleSetCount(newCount: number) {
  counterClient.emit('set-count', { count: newCount })
}
```

**App side -- listen for commands and react:**

```ts
import { counterClient } from './counter-devtools-client'

counterClient.on('reset', () => {
  count = 0
  // Re-emit observation so panel updates
  counterClient.emit('state-update', {
    count,
    updatedAt: Date.now(),
  })
})

counterClient.on('set-count', (event) => {
  count = event.payload.count
  counterClient.emit('state-update', {
    count,
    updatedAt: Date.now(),
  })
})
```

The command handler re-emits an observation event after mutating state. This closes the loop so the panel sees the result of its own command.

### 3. Time-Travel Debugging

Combine observation (snapshots) with commands (revert) to build a time-travel slider.

**Event map:**

```ts
type TimeTravelEvents = {
  // Observation: app -> panel
  snapshot: { state: unknown; timestamp: number; label: string }
  // Command: panel -> app
  revert: { state: unknown }
}

class TimeTravelClient extends EventClient<TimeTravelEvents> {
  constructor() {
    super({
      pluginId: 'time-travel',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}

export const timeTravelClient = new TimeTravelClient()
```

**App side -- emit snapshots with structuredClone:**

```ts
import { timeTravelClient } from './time-travel-client'

function applyAction(action: { type: string; payload: unknown }) {
  state = reducer(state, action)

  timeTravelClient.emit('snapshot', {
    state: structuredClone(state),
    timestamp: Date.now(),
    label: action.type,
  })
}

// Listen for revert commands from devtools
timeTravelClient.on('revert', (event) => {
  state = event.payload.state
  rerender()
})
```

`structuredClone(state)` is required here. Without it, the snapshot payload holds a reference to the live state object. When the app mutates state later, all previously stored snapshots in the panel are corrupted because they point to the same object.

**Panel side -- collect snapshots and revert:**

```tsx
import { timeTravelClient } from './time-travel-client'

function TimeTravelPanel() {
  const [snapshots, setSnapshots] = useState<
    Array<{ state: unknown; timestamp: number; label: string }>
  >([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    return timeTravelClient.on('snapshot', (event) => {
      setSnapshots((prev) => [...prev, event.payload])
      setIndex((prev) => prev + 1)
    })
  }, [])

  const handleSliderChange = (newIndex: number) => {
    setIndex(newIndex)
    timeTravelClient.emit('revert', {
      state: snapshots[newIndex].state,
    })
  }

  return (
    <div>
      <input
        type="range"
        min={0}
        max={snapshots.length - 1}
        value={index}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
      />
      <p>
        {snapshots[index]?.label} (
        {new Date(snapshots[index]?.timestamp).toLocaleTimeString()})
      </p>
      <pre>{JSON.stringify(snapshots[index]?.state, null, 2)}</pre>
    </div>
  )
}
```

After the app handles `revert`, it should re-emit a `snapshot` so the panel timeline stays current. The revert handler in the app side example above does not re-emit -- add it if your UI needs the timeline to update after a revert:

```ts
timeTravelClient.on('revert', (event) => {
  state = event.payload.state
  rerender()
  // Optional: re-emit so the timeline reflects the revert
  timeTravelClient.emit('snapshot', {
    state: structuredClone(state),
    timestamp: Date.now(),
    label: 'revert',
  })
})
```

### 4. Bidirectional Event Map Design

When a single plugin needs both observation and command events, define them all in one event map. Use naming conventions to distinguish direction:

```ts
type StoreInspectorEvents = {
  // Observation: app -> panel (describe what happened)
  'state-update': { storeName: string; state: unknown; timestamp: number }
  'action-dispatched': { storeName: string; action: string; payload: unknown }
  'error-caught': { storeName: string; error: string; stack?: string }

  // Commands: panel -> app (describe what to do)
  'set-state': { storeName: string; state: unknown }
  'dispatch-action': { storeName: string; action: string; payload: unknown }
  reset: void
  revert: { state: unknown }
}
```

Naming convention:

- **Observation events** describe what happened: `state-update`, `action-dispatched`, `error-caught`, `snapshot`
- **Command events** describe what to do: `set-state`, `dispatch-action`, `reset`, `revert`

This distinction is purely a convention in your event map keys. The `EventClient` API is the same for both. But maintaining it makes your event map self-documenting and prevents confusion about which side emits vs listens.

**Full bidirectional wiring with one client:**

```ts
import { EventClient } from '@tanstack/devtools-event-client'

type StoreInspectorEvents = {
  'state-update': { storeName: string; state: unknown; timestamp: number }
  'set-state': { storeName: string; state: unknown }
  reset: void
}

class StoreInspectorClient extends EventClient<StoreInspectorEvents> {
  constructor() {
    super({
      pluginId: 'store-inspector',
      enabled: process.env.NODE_ENV !== 'production',
    })
  }
}

export const storeInspector = new StoreInspectorClient()
```

**App side:**

```ts
import { storeInspector } from './store-inspector-client'

// Observation: emit state changes
function updateStore(storeName: string, newState: unknown) {
  stores[storeName] = newState
  storeInspector.emit('state-update', {
    storeName,
    state: structuredClone(newState),
    timestamp: Date.now(),
  })
}

// Command handlers: listen for panel commands
storeInspector.on('set-state', (event) => {
  const { storeName, state } = event.payload
  stores[storeName] = state
  storeInspector.emit('state-update', {
    storeName,
    state: structuredClone(state),
    timestamp: Date.now(),
  })
})

storeInspector.on('reset', () => {
  for (const storeName of Object.keys(stores)) {
    stores[storeName] = initialStates[storeName]
    storeInspector.emit('state-update', {
      storeName,
      state: structuredClone(initialStates[storeName]),
      timestamp: Date.now(),
    })
  }
})
```

**Panel side:**

```ts
import { storeInspector } from './store-inspector-client'

// Observation: listen for state changes
storeInspector.on('state-update', (event) => {
  renderStore(event.payload.storeName, event.payload.state)
})

// Commands: emit on user action
function handleEditState(storeName: string, newState: unknown) {
  storeInspector.emit('set-state', { storeName, state: newState })
}

function handleReset() {
  storeInspector.emit('reset', undefined)
}
```

## Debouncing Frequent Observations

High-frequency state changes (e.g., mouse tracking, animation frames) can flood the event bus. Debounce on the emit side:

```ts
import { storeInspector } from './store-inspector-client'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function emitStateUpdate(storeName: string, state: unknown) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    storeInspector.emit('state-update', {
      storeName,
      state: structuredClone(state),
      timestamp: Date.now(),
    })
  }, 16) // ~60fps cap
}
```

Do not debounce command events. Commands are user-initiated and infrequent.

## Common Mistakes

### 1. Not using structuredClone for snapshots (HIGH)

Without `structuredClone`, snapshot payloads hold references to the live state object. When the app mutates state later, every stored snapshot in the panel is silently corrupted.

Wrong:

```ts
timeTravelClient.emit('snapshot', {
  state,
  timestamp: Date.now(),
  label: action.type,
})
```

The panel stores `event.payload.state`, which is a reference to the app's `state` variable. On the next mutation, the panel's stored snapshot now reflects the new state, not the historical state.

Correct:

```ts
timeTravelClient.emit('snapshot', {
  state: structuredClone(state),
  timestamp: Date.now(),
  label: action.type,
})
```

`structuredClone` creates a deep copy. The snapshot is frozen in time regardless of future mutations. This applies to any observation event where the panel accumulates historical data -- not just time-travel.

### 2. Non-serializable payloads in cross-tab scenarios (HIGH)

When using the server event bus (WebSocket/SSE/BroadcastChannel), payloads are serialized for transport. Functions, DOM nodes, class instances with methods, `Map`, `Set`, `WeakRef`, and circular references all fail silently or lose data.

This is especially dangerous in bidirectional patterns because command payloads flow panel-to-app and may cross transport boundaries.

Wrong:

```ts
storeInspector.emit('set-state', {
  storeName: 'main',
  state: {
    items: new Map([['a', 1]]), // Map -- lost on serialization
    onClick: () => alert('hi'), // Function -- lost on serialization
    ref: document.getElementById('x'), // DOM node -- lost on serialization
  },
})
```

Correct:

```ts
storeInspector.emit('set-state', {
  storeName: 'main',
  state: {
    items: Object.fromEntries(new Map([['a', 1]])),
    timestamp: Date.now(),
  },
})
```

Rule of thumb: if `JSON.parse(JSON.stringify(payload))` does not round-trip cleanly, the payload is not safe for the event bus.

### 3. Not distinguishing observation from command events (MEDIUM)

Mixing naming conventions makes the event map confusing and error-prone. Developers end up emitting observation events from the panel or command events from the app, breaking the communication contract.

Wrong:

```ts
type MyEvents = {
  state: unknown // Is this observation or command?
  update: unknown // Who emits this?
  count: number // Unclear direction
}
```

Correct:

```ts
type MyEvents = {
  'state-update': unknown // Observation: describes what happened
  'set-state': unknown // Command: describes what to do
  'count-changed': number // Observation: past tense / descriptive
  reset: void // Command: imperative
}
```

Use observation suffixes that describe what happened (`-update`, `-changed`, `-dispatched`, `-caught`). Use command suffixes that describe what to do (`set-`, `dispatch-`, `reset`, `revert`). The naming convention is not enforced by the API, but consistent naming prevents wiring mistakes.

## See Also

- `devtools-event-client` -- base event system: event maps, `emit()`/`on()`, connection lifecycle, singleton pattern
- `devtools-instrumentation` -- strategic placement of `emit()` calls in library code benefits from bidirectional awareness (knowing that commands will flow back)
