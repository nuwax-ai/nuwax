import { Store } from '@tanstack/store'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'

export interface QueuerState<TValue> {
  /**
   * Number of times addItem has been called (for reduction calculations)
   */
  addItemCount: number
  /**
   * Number of items that have been processed by the queuer
   */
  executionCount: number
  /**
   * Number of items that have been removed from the queue due to expiration
   */
  expirationCount: number
  /**
   * Whether the queuer has no items to process (items array is empty)
   */
  isEmpty: boolean
  /**
   * Whether the queuer has reached its maximum capacity
   */
  isFull: boolean
  /**
   * Whether the queuer is not currently processing any items
   */
  isIdle: boolean
  /**
   * Whether the queuer is active and will process items automatically
   */
  isRunning: boolean
  /**
   * Array of items currently waiting to be processed
   */
  items: Array<TValue>
  /**
   * Timestamps when items were added to the queue for expiration tracking
   */
  itemTimestamps: Array<number>
  /**
   * Whether the queuer has a pending timeout for processing the next item
   */
  pendingTick: boolean
  /**
   * Number of items that have been rejected from being added to the queue
   */
  rejectionCount: number
  /**
   * Number of items currently in the queue
   */
  size: number
  /**
   * Current processing status - 'idle' when not processing, 'running' when active, 'stopped' when paused
   */
  status: 'idle' | 'running' | 'stopped'
}

function getDefaultQueuerState<TValue>(): QueuerState<TValue> {
  return {
    executionCount: 0,
    expirationCount: 0,
    isEmpty: true,
    isFull: false,
    isIdle: true,
    isRunning: true,
    itemTimestamps: [],
    items: [],
    pendingTick: false,
    rejectionCount: 0,
    size: 0,
    status: 'idle',
    addItemCount: 0,
  }
}

/**
 * Options for configuring a Queuer instance.
 *
 * These options control queue behavior, item expiration, callbacks, and more.
 */
export interface QueuerOptions<TValue> {
  /**
   * Default position to add items to the queuer
   * @default 'back'
   */
  addItemsTo?: QueuePosition
  /**
   * Maximum time in milliseconds that an item can stay in the queue
   * If not provided, items will never expire
   */
  expirationDuration?: number
  /**
   * Function to determine if an item has expired
   * If provided, this overrides the expirationDuration behavior
   */
  getIsExpired?: (item: TValue, addedAt: number) => boolean
  /**
   * Default position to get items from during processing
   * @default 'front'
   */
  getItemsFrom?: QueuePosition
  /**
   * Function to determine priority of items in the queuer
   * Higher priority items will be processed first
   */
  getPriority?: (item: TValue) => number
  /**
   * Initial items to populate the queuer with
   */
  initialItems?: Array<TValue>
  /**
   * Initial state for the queuer
   */
  initialState?: Partial<QueuerState<TValue>>
  /**
   * Optional key to identify this queuer instance.
   * If provided, the queuer will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Maximum number of items allowed in the queuer
   */
  maxSize?: number
  /**
   * Callback fired whenever an item is removed from the queuer
   */
  onExecute?: (item: TValue, queuer: Queuer<TValue>) => void
  /**
   * Callback fired whenever an item expires in the queuer
   */
  onExpire?: (item: TValue, queuer: Queuer<TValue>) => void
  /**
   * Callback fired whenever an item is added or removed from the queuer
   */
  onItemsChange?: (queuer: Queuer<TValue>) => void
  /**
   * Callback fired whenever an item is rejected from being added to the queuer
   */
  onReject?: (item: TValue, queuer: Queuer<TValue>) => void
  /**
   * Whether the queuer should start processing tasks immediately
   */
  started?: boolean
  /**
   * Time in milliseconds to wait between processing items.
   * Can be a number or a function that returns a number.
   * @default 0
   */
  wait?: number | ((queuer: Queuer<TValue>) => number)
}

/**
 * Utility function for sharing common `QueuerOptions` options between different `Queuer` instances.
 */
export function queuerOptions<
  TValue = any,
  TOptions extends Partial<QueuerOptions<TValue>> = Partial<
    QueuerOptions<TValue>
  >,
>(options: TOptions): TOptions {
  return options
}

const defaultOptions: Omit<
  Required<QueuerOptions<any>>,
  | 'initialState'
  | 'onExecute'
  | 'onIsRunningChange'
  | 'onItemsChange'
  | 'onReject'
  | 'onExpire'
  | 'key'
> = {
  addItemsTo: 'back',
  getItemsFrom: 'front',
  getPriority: (item) => item?.priority ?? 0,
  getIsExpired: () => false,
  expirationDuration: Infinity,
  initialItems: [],
  maxSize: Infinity,
  started: true,
  wait: 0,
}

/**
 * Position type for addItem and getNextItem operations.
 *
 * - 'front': Operate on the front of the queue (FIFO)
 * - 'back': Operate on the back of the queue (LIFO)
 */
export type QueuePosition = 'front' | 'back'

/**
 * A flexible queue that processes items with configurable wait times, expiration, and priority.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to AsyncQueuer when you need promises, retry support, abort capabilities, concurrent execution, or advanced error handling.
 *
 * Features:
 * - Automatic or manual processing of items
 * - FIFO (First In First Out), LIFO (Last In First Out), or double-ended queue behavior
 * - Priority-based ordering when getPriority is provided
 * - Item expiration and removal of stale items
 * - Callbacks for queue state changes, execution, rejection, and expiration
 *
 * Running behavior:
 * - `start()`: Begins automatically processing items in the queue (defaults to isRunning)
 * - `stop()`: Pauses processing but maintains queue state
 * - `wait`: Configurable delay between processing items
 * - `onItemsChange`/`onExecute`: Callbacks for monitoring queue state
 *
 * Manual processing is also supported when automatic processing is disabled:
 * - `execute()`: Processes the next item using the provided function
 * - `getNextItem()`: Removes and returns the next item without processing
 *
 * Queue behavior defaults to FIFO:
 * - `addItem(item)`: Adds to the back of the queue
 * - Items processed from the front of the queue
 *
 * Priority queue:
 * - Provide a `getPriority` function; higher values are processed first
 *
 * Stack (LIFO):
 * - `addItem(item, 'back')`: Adds to the back
 * - `getNextItem('back')`: Removes from the back
 *
 * Double-ended queue:
 * - `addItem(item, position)`: Adds to specified position ('front'/'back')
 * - `getNextItem(position)`: Removes from specified position
 *
 * Item expiration:
 * - `expirationDuration`: Maximum time items can stay in the queue
 * - `getIsExpired`: Function to override default expiration
 * - `onExpire`: Callback for expired items
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the queuer
 * - Use `onExecute` callback to react to item execution and implement custom logic
 * - Use `onItemsChange` callback to react to items being added or removed from the queue
 * - Use `onExpire` callback to react to items expiring and implement custom logic
 * - Use `onReject` callback to react to items being rejected when the queue is full
 * - The state includes execution count, expiration count, rejection count, and isRunning status
 * - State can be accessed via `queuer.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `queuer.state`
 *
 * Example usage:
 * ```ts
 * // Auto-processing queue with wait time
 * const autoQueue = new Queuer<number>((n) => console.log(n), {
 *   started: true, // Begin processing immediately
 *   wait: 1000, // Wait 1s between items
 *   onExecute: (item, queuer) => console.log(`Processed ${item}`)
 * });
 * autoQueue.addItem(1); // Will process after 1s
 * autoQueue.addItem(2); // Will process 1s after first item
 *
 * // Manual processing queue
 * const manualQueue = new Queuer<number>((n) => console.log(n), {
 *   started: false
 * });
 * manualQueue.addItem(1); // [1]
 * manualQueue.addItem(2); // [1, 2]
 * manualQueue.execute(); // logs 1, queue is [2]
 * manualQueue.getNextItem(); // returns 2, queue is empty
 * ```
 */
export class Queuer<TValue> {
  readonly store: Store<Readonly<QueuerState<TValue>>> = new Store(
    getDefaultQueuerState<TValue>(),
  )
  key: string | undefined
  options: QueuerOptions<TValue>
  #timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(
    public fn: (item: TValue) => void,
    initialOptions: QueuerOptions<TValue> = {},
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
    }
    const isInitiallyRunning =
      this.options.initialState?.isRunning ?? this.options.started ?? true
    this.#setState({
      ...this.options.initialState,
      isRunning: isInitiallyRunning,
    })

    if (this.options.initialState?.items) {
      if (this.store.state.isRunning) {
        this.#tick()
      }
    } else {
      for (let i = 0; i < (this.options.initialItems?.length ?? 0); i++) {
        const item = this.options.initialItems![i]!
        const isLast = i === (this.options.initialItems?.length ?? 0) - 1
        this.addItem(item, this.options.addItemsTo ?? 'back', isLast)
      }
    }

    if (this.key) {
      pacerEventClient.on('d-Queuer', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(
          event.payload.store.state as Partial<QueuerState<TValue>>,
        )
        this.setOptions(event.payload.options as Partial<QueuerOptions<TValue>>)
      })
    }
  }

  /**
   * Updates the queuer options. New options are merged with existing options.
   */
  setOptions = (newOptions: Partial<QueuerOptions<TValue>>): void => {
    this.options = { ...this.options, ...newOptions }
  }

  #setState = (newState: Partial<QueuerState<TValue>>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }

      const { items, isRunning } = combinedState

      const size = items.length
      const isFull = size >= (this.options.maxSize ?? Infinity)
      const isEmpty = size === 0
      const isIdle = isRunning && isEmpty

      const status = isIdle ? 'idle' : isRunning ? 'running' : 'stopped'

      return {
        ...combinedState,
        isEmpty,
        isFull,
        isIdle,
        size,
        status,
      }
    })
    emitChange('Queuer', this)
  }

  /**
   * Returns the current wait time (in milliseconds) between processing items.
   * If a function is provided, it is called with the queuer instance.
   */
  #getWait = (): number => {
    return parseFunctionOrValue(this.options.wait ?? 0, this)
  }

  /**
   * Processes items in the queue up to the wait interval. Internal use only.
   */
  #tick = () => {
    if (!this.store.state.isRunning) {
      this.#setState({ pendingTick: false })
      return
    }

    this.#setState({ pendingTick: true })

    // Check for expired items
    this.#checkExpiredItems()

    while (this.store.state.items.length > 0) {
      const nextItem = this.execute(this.options.getItemsFrom ?? 'front')
      if (nextItem === undefined) {
        break
      }

      const wait = this.#getWait()
      if (wait > 0) {
        // Use setTimeout to wait before processing next item
        this.#timeoutId = setTimeout(() => this.#tick(), wait)
        return
      }

      this.#tick()
    }
    this.#setState({ pendingTick: false })
  }

  /**
   * Adds an item to the queue. If the queue is full, the item is rejected and onReject is called.
   * Items can be inserted based on priority or at the front/back depending on configuration.
   *
   * Returns true if the item was added, false if the queue is full.
   *
   * Example usage:
   * ```ts
   * queuer.addItem('task');
   * queuer.addItem('task2', 'front');
   * ```
   */
  addItem = (
    item: TValue,
    position: QueuePosition = this.options.addItemsTo ?? 'back',
    runOnItemsChange: boolean = true,
  ): boolean => {
    this.#setState({
      addItemCount: this.store.state.addItemCount + 1,
    })

    if (this.store.state.items.length >= (this.options.maxSize ?? Infinity)) {
      this.#setState({
        rejectionCount: this.store.state.rejectionCount + 1,
      })
      this.options.onReject?.(item, this)
      return false
    }

    // Get priority either from the function or from getPriority option
    const priority =
      this.options.getPriority !== defaultOptions.getPriority
        ? this.options.getPriority!(item)
        : (item as any).priority

    const items = this.store.state.items
    const itemTimestamps = this.store.state.itemTimestamps

    if (priority !== undefined) {
      // Insert based on priority - higher priority items go to front
      const insertIndex = items.findIndex((existing) => {
        const existingPriority: number =
          this.options.getPriority !== defaultOptions.getPriority
            ? this.options.getPriority!(existing)
            : (existing as any).priority
        return existingPriority < priority
      })

      if (insertIndex === -1) {
        items.push(item)
        itemTimestamps.push(Date.now())
      } else {
        items.splice(insertIndex, 0, item)
        itemTimestamps.splice(insertIndex, 0, Date.now())
      }
    } else {
      if (position === 'front') {
        // Default FIFO/LIFO behavior
        items.unshift(item)
        itemTimestamps.unshift(Date.now())
      } else {
        // LIFO
        items.push(item)
        itemTimestamps.push(Date.now())
      }
    }

    this.#setState({
      items,
      itemTimestamps,
    })

    if (runOnItemsChange) {
      this.options.onItemsChange?.(this)
    }

    if (this.store.state.isRunning && !this.store.state.pendingTick) {
      this.#setState({ pendingTick: true })
      this.#tick()
    }

    return true
  }

  /**
   * Removes and returns the next item from the queue without executing the function.
   * Use for manual queue management. Normally, use execute() to process items.
   *
   * Example usage:
   * ```ts
   * // FIFO
   * queuer.getNextItem();
   * // LIFO
   * queuer.getNextItem('back');
   * ```
   */
  getNextItem = (
    position: QueuePosition = this.options.getItemsFrom ?? 'front',
  ): TValue | undefined => {
    const { items, itemTimestamps } = this.store.state
    let item: TValue | undefined

    // When priority function is provided, always get from front (highest priority)
    // Priority takes precedence over FIFO/LIFO behavior
    if (
      this.options.getPriority !== defaultOptions.getPriority ||
      position === 'front'
    ) {
      item = items[0]
      if (item !== undefined) {
        this.#setState({
          items: items.slice(1),
          itemTimestamps: itemTimestamps.slice(1),
        })
      }
    } else {
      item = items[items.length - 1]
      if (item !== undefined) {
        this.#setState({
          items: items.slice(0, -1),
          itemTimestamps: itemTimestamps.slice(0, -1),
        })
      }
    }

    if (item !== undefined) {
      this.options.onItemsChange?.(this)
    }

    return item
  }

  #getAllItems = (): Array<TValue> => {
    const items = this.peekAllItems()
    this.clear()
    return items
  }

  /**
   * Removes and returns the next item from the queue and processes it using the provided function.
   *
   * Example usage:
   * ```ts
   * queuer.execute();
   * // LIFO
   * queuer.execute('back');
   * ```
   */
  execute = (position?: QueuePosition): TValue | undefined => {
    const item = this.getNextItem(position)
    if (item !== undefined) {
      this.fn(item)
      this.#setState({
        executionCount: this.store.state.executionCount + 1,
      })
      this.options.onExecute?.(item, this)
    }
    return item
  }

  /**
   * Processes a specified number of items to execute immediately with no wait time
   * If no numberOfItems is provided, all items will be processed
   */
  flush = (
    numberOfItems: number = this.store.state.items.length,
    position?: QueuePosition,
  ): void => {
    this.#clearTimeout() // clear any pending timeout
    for (let i = 0; i < numberOfItems; i++) {
      this.execute(position)
    }
    this.#tick()
  }

  /**
   * Processes all items in the queue as a batch using the provided function as an argument
   * The queue is cleared after processing
   */
  flushAsBatch = (batchFunction: (items: Array<TValue>) => void): void => {
    const items = this.#getAllItems()
    this.clear()
    batchFunction(items)
  }

  /**
   * Checks for expired items in the queue and removes them. Calls onExpire for each expired item.
   * Internal use only.
   */
  #checkExpiredItems = (): void => {
    if (
      (this.options.expirationDuration ?? Infinity) === Infinity &&
      this.options.getIsExpired === defaultOptions.getIsExpired
    ) {
      return
    }

    const now = Date.now()
    const expiredIndices: Array<number> = []

    // Find indices of expired items
    for (let i = 0; i < this.store.state.items.length; i++) {
      const timestamp = this.store.state.itemTimestamps[i]
      if (timestamp === undefined) continue

      const item = this.store.state.items[i]
      if (item === undefined) continue

      const isExpired =
        this.options.getIsExpired !== defaultOptions.getIsExpired
          ? this.options.getIsExpired!(item, timestamp)
          : now - timestamp > (this.options.expirationDuration ?? Infinity)

      if (isExpired) {
        expiredIndices.push(i)
      }
    }

    // Remove expired items from back to front to maintain indices
    for (let i = expiredIndices.length - 1; i >= 0; i--) {
      const index = expiredIndices[i]
      if (index === undefined) continue

      const expiredItem = this.store.state.items[index]
      if (expiredItem === undefined) continue

      const newItems = [...this.store.state.items]
      const newTimestamps = [...this.store.state.itemTimestamps]
      newItems.splice(index, 1)
      newTimestamps.splice(index, 1)
      this.#setState({
        items: newItems,
        itemTimestamps: newTimestamps,
        expirationCount: this.store.state.expirationCount + 1,
      })
      this.options.onExpire?.(expiredItem, this)
    }

    if (expiredIndices.length > 0) {
      this.options.onItemsChange?.(this)
    }
  }

  /**
   * Returns the next item in the queue without removing it.
   *
   * Example usage:
   * ```ts
   * queuer.peekNextItem(); // front
   * queuer.peekNextItem('back'); // back
   * ```
   */
  peekNextItem = (position: QueuePosition = 'front'): TValue | undefined => {
    if (position === 'front') {
      return this.store.state.items[0]
    }
    return this.store.state.items[this.store.state.items.length - 1]
  }

  /**
   * Returns a copy of all items in the queue.
   */
  peekAllItems = (): Array<TValue> => {
    return [...this.store.state.items]
  }

  /**
   * Starts processing items in the queue. If already isRunning, does nothing.
   */
  start = () => {
    this.#setState({ isRunning: true })
    if (!this.store.state.pendingTick && this.store.state.items.length > 0) {
      this.#tick()
    }
  }

  /**
   * Stops processing items in the queue. Does not clear the queue.
   */
  stop = () => {
    this.#clearTimeout()
    this.#setState({ isRunning: false, pendingTick: false })
  }

  #clearTimeout = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = null
    }
  }

  /**
   * Removes all pending items from the queue. Does not affect items being processed.
   */
  clear = (): void => {
    this.#setState({ items: [], itemTimestamps: [] })
    this.options.onItemsChange?.(this)
  }

  /**
   * Resets the queuer state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultQueuerState<TValue>())
    this.options.onItemsChange?.(this)
  }
}

/**
 * Creates a queue that processes items immediately upon addition.
 * Items are processed sequentially in FIFO order by default.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to asyncQueue when you need promises, retry support, abort capabilities, concurrent execution, or advanced error handling.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the queuer
 * - Use `onExecute` callback to react to item execution and implement custom logic
 * - Use `onItemsChange` callback to react to items being added or removed from the queue
 * - Use `onExpire` callback to react to items expiring and implement custom logic
 * - Use `onReject` callback to react to items being rejected when the queue is full
 * - The state includes execution count, expiration count, rejection count, and isRunning status
 * - State can be accessed via the underlying Queuer instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * Example usage:
 * ```ts
 * // Basic sequential processing
 * const processItems = queue<number>((n) => console.log(n), {
 *   wait: 1000,
 *   onItemsChange: (queuer) => console.log(queuer.peekAllItems())
 * });
 * processItems(1); // Logs: 1
 * processItems(2); // Logs: 2 after 1 completes
 *
 * // Priority queue
 * const processPriority = queue<number>((n) => console.log(n), {
 *   getPriority: n => n // Higher numbers processed first
 * });
 * processPriority(1);
 * processPriority(3); // Processed before 1
 * ```
 */
export function queue<TValue>(
  fn: (item: TValue) => void,
  initialOptions: QueuerOptions<TValue>,
) {
  const queuer = new Queuer<TValue>(fn, initialOptions)
  return queuer.addItem
}
