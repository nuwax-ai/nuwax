import { Store } from '@tanstack/store'
import { AsyncRetryer } from './async-retryer'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { AsyncRetryerOptions } from './async-retryer'
import type { OptionalKeys } from './types'
import type { QueuePosition } from './queuer'

export interface AsyncQueuerState<TValue> {
  /**
   * Items currently being processed by the queuer
   */
  activeItems: Array<TValue>
  /**
   * Number of times addItem has been called (for reduction calculations)
   */
  addItemCount: number
  /**
   * Number of task executions that have resulted in errors
   */
  errorCount: number
  /**
   * Number of times execute has been called
   */
  executeCount: number
  /**
   * Number of items that have been removed from the queue due to expiration
   */
  expirationCount: number
  /**
   * Whether the queuer has no items to process (items array is empty)
   */
  isEmpty: boolean
  /**
   * Whether the queuer is currently executing
   */
  isExecuting: boolean
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
   * The result from the most recent task execution
   */
  lastResult: any
  /**
   * Whether the queuer has a pending timeout for processing the next item
   */
  pendingTick: boolean
  /**
   * Number of items that have been rejected from being added to the queue
   */
  rejectionCount: number
  /**
   * Number of task executions that have completed (either successfully or with errors)
   */
  settledCount: number
  /**
   * Number of items currently in the queue
   */
  size: number
  /**
   * Current processing status - 'idle' when not processing, 'running' when active, 'stopped' when paused
   */
  status: 'idle' | 'running' | 'stopped'
  /**
   * Number of task executions that have completed successfully
   */
  successCount: number
}

function getDefaultAsyncQueuerState<TValue>(): AsyncQueuerState<TValue> {
  return {
    activeItems: [],
    addItemCount: 0,
    errorCount: 0,
    executeCount: 0,
    expirationCount: 0,
    isEmpty: true,
    isExecuting: false,
    isFull: false,
    isIdle: true,
    isRunning: true,
    itemTimestamps: [],
    items: [],
    lastResult: null,
    pendingTick: false,
    rejectionCount: 0,
    settledCount: 0,
    size: 0,
    status: 'idle',
    successCount: 0,
  }
}

export interface AsyncQueuerOptions<TValue> {
  /**
   * Options for configuring the underlying async retryer
   */
  asyncRetryerOptions?: AsyncRetryerOptions<(item: TValue) => Promise<any>>
  /**
   * Default position to add items to the queuer
   * @default 'back'
   */
  addItemsTo?: QueuePosition
  /**
   * Maximum number of concurrent tasks to process.
   * Can be a number or a function that returns a number.
   * @default 1
   */
  concurrency?: number | ((queuer: AsyncQueuer<TValue>) => number)
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
   * If not provided, will use static priority values attached to tasks
   */
  getPriority?: (item: TValue) => number
  /**
   * Initial items to populate the queuer with
   */
  initialItems?: Array<TValue>
  /**
   * Initial state for the async queuer
   */
  initialState?: Partial<AsyncQueuerState<TValue>>
  /**
   * Optional key to identify this async queuer instance.
   * If provided, the async queuer will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Maximum number of items allowed in the queuer
   */
  maxSize?: number
  /**
   * Optional error handler for when a task throws.
   * If provided, the handler will be called with the error and queuer instance.
   * This can be used alongside throwOnError - the handler will be called before any error is thrown.
   */
  onError?: (error: Error, item: TValue, queuer: AsyncQueuer<TValue>) => void
  /**
   * Callback fired whenever an item expires in the queuer
   */
  onExpire?: (item: TValue, queuer: AsyncQueuer<TValue>) => void
  /**
   * Callback fired whenever an item is added or removed from the queuer
   */
  onItemsChange?: (queuer: AsyncQueuer<TValue>) => void
  /**
   * Callback fired whenever an item is rejected from being added to the queuer
   */
  onReject?: (item: TValue, queuer: AsyncQueuer<TValue>) => void
  /**
   * Optional callback to call when a task is settled
   */
  onSettled?: (item: TValue, queuer: AsyncQueuer<TValue>) => void
  /**
   * Optional callback to call when a task succeeds
   */
  onSuccess?: (result: any, item: TValue, queuer: AsyncQueuer<TValue>) => void
  /**
   * Whether the queuer should start processing tasks immediately or not.
   */
  started?: boolean
  /**
   * Whether to throw errors when they occur.
   * Defaults to true if no onError handler is provided, false if an onError handler is provided.
   * Can be explicitly set to override these defaults.
   */
  throwOnError?: boolean
  /**
   * Time in milliseconds to wait between processing items.
   * Can be a number or a function that returns a number.
   * @default 0
   */
  wait?: number | ((queuer: AsyncQueuer<TValue>) => number)
}

/**
 * Utility function for sharing common `AsyncQueuerOptions` options between different `AsyncQueuer` instances.
 */
export function asyncQueuerOptions<
  TValue = any,
  TOptions extends Partial<AsyncQueuerOptions<TValue>> = Partial<
    AsyncQueuerOptions<TValue>
  >,
>(options: TOptions): TOptions {
  return options
}

type AsyncQueuerOptionsWithOptionalCallbacks = OptionalKeys<
  Required<AsyncQueuerOptions<any>>,
  | 'initialState'
  | 'throwOnError'
  | 'onSuccess'
  | 'onSettled'
  | 'onReject'
  | 'onItemsChange'
  | 'onExpire'
  | 'onError'
  | 'key'
>

const defaultOptions: AsyncQueuerOptionsWithOptionalCallbacks = {
  addItemsTo: 'back',
  asyncRetryerOptions: {
    maxAttempts: 1,
  },
  concurrency: 1,
  expirationDuration: Infinity,
  getIsExpired: () => false,
  getItemsFrom: 'front',
  getPriority: (item: any) => item?.priority ?? 0,
  initialItems: [],
  maxSize: Infinity,
  started: true,
  wait: 0,
}

/**
 * A flexible asynchronous queue for processing tasks with configurable concurrency, priority, and expiration.
 *
 * Async vs Sync Versions:
 * The async version provides advanced features over the sync Queuer:
 * - Returns promises that can be awaited for task results
 * - Built-in retry support via AsyncRetryer integration for each queued task
 * - Abort support to cancel in-flight task executions
 * - Comprehensive error handling with onError callbacks and throwOnError control
 * - Detailed execution tracking (success/error/settle counts)
 * - Concurrent execution support (process multiple items simultaneously)
 *
 * The sync Queuer is lighter weight and simpler when you don't need async features,
 * return values, or execution control.
 *
 * What is Queuing?
 * Queuing is a technique for managing and processing items sequentially or with controlled concurrency.
 * Tasks are processed up to the configured concurrency limit. When a task completes,
 * the next pending task is processed if the concurrency limit allows.
 *
 * Key Features:
 * - Priority queue support via the getPriority option
 * - Configurable concurrency limit
 * - Callbacks for task success, error, completion, and queue state changes
 * - FIFO (First In First Out) or LIFO (Last In First Out) queue behavior
 * - Pause and resume processing
 * - Item expiration to remove stale items from the queue
 *
 * Error Handling:
 * - If an `onError` handler is provided, it will be called with the error and queuer instance
 * - If `throwOnError` is true (default when no onError handler is provided), the error will be thrown
 * - If `throwOnError` is false (default when onError handler is provided), the error will be swallowed
 * - Both onError and throwOnError can be used together; the handler will be called before any error is thrown
 * - The error state can be checked using the AsyncQueuer instance
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the async queuer
 * - Use `onSuccess` callback to react to successful task execution and implement custom logic
 * - Use `onError` callback to react to task execution errors and implement custom error handling
 * - Use `onSettled` callback to react to task execution completion (success or error) and implement custom logic
 * - Use `onItemsChange` callback to react to items being added or removed from the queue
 * - Use `onExpire` callback to react to items expiring and implement custom logic
 * - Use `onReject` callback to react to items being rejected when the queue is full
 * - The state includes error count, expiration count, rejection count, running status, and success/settle counts
 * - State can be accessed via `asyncQueuer.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `asyncQueuer.state`
 *
 * Example usage:
 * ```ts
 * const asyncQueuer = new AsyncQueuer<string>(async (item) => {
 *   // process item
 *   return item.toUpperCase();
 * }, {
 *   concurrency: 2,
 *   onSuccess: (result) => {
 *     console.log(result);
 *   }
 * });
 *
 * asyncQueuer.addItem('hello');
 * asyncQueuer.start();
 * ```
 */
export class AsyncQueuer<TValue> {
  readonly store: Store<Readonly<AsyncQueuerState<TValue>>> = new Store<
    AsyncQueuerState<TValue>
  >(getDefaultAsyncQueuerState<TValue>())
  key: string | undefined
  options: AsyncQueuerOptions<TValue>
  asyncRetryers = new Map<
    number,
    AsyncRetryer<(item: TValue) => Promise<any>>
  >()
  #timeoutIds: Set<ReturnType<typeof setTimeout>> = new Set()

  constructor(
    public fn: (item: TValue) => Promise<any>,
    initialOptions: AsyncQueuerOptions<TValue> = {},
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
      throwOnError: initialOptions.throwOnError ?? !initialOptions.onError,
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
      pacerEventClient.on('d-AsyncQueuer', (e) => {
        if (e.payload.key !== this.key) return
        this.#setState(
          e.payload.store.state as Partial<AsyncQueuerState<TValue>>,
        )
        this.setOptions(
          e.payload.options as Partial<AsyncQueuerOptions<TValue>>,
        )
      })
    }
  }

  /**
   * Updates the queuer options. New options are merged with existing options.
   */
  setOptions = (newOptions: Partial<AsyncQueuerOptions<TValue>>): void => {
    this.options = { ...this.options, ...newOptions }
  }

  #setState = (newState: Partial<AsyncQueuerState<TValue>>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }

      const { activeItems, items, isRunning } = combinedState

      const size = items.length
      const isFull = size >= (this.options.maxSize ?? Infinity)
      const isEmpty = size === 0
      const isIdle = isRunning && isEmpty && activeItems.length === 0

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
    emitChange('AsyncQueuer', this)
  }

  /**
   * Returns the current wait time (in milliseconds) between processing items.
   * If a function is provided, it is called with the queuer instance.
   */
  #getWait = (): number => {
    return parseFunctionOrValue(this.options.wait ?? 0, this)
  }

  /**
   * Returns the current concurrency limit for processing items.
   * If a function is provided, it is called with the queuer instance.
   */
  #getConcurrency = (): number => {
    return parseFunctionOrValue(this.options.concurrency ?? 1, this)
  }

  /**
   * Processes items in the queue up to the concurrency limit. Internal use only.
   */
  #tick = () => {
    if (!this.store.state.isRunning) {
      this.#setState({ pendingTick: false })
      return
    }
    this.#setState({ pendingTick: true })

    // Check for expired items
    this.#checkExpiredItems()

    // Process items concurrently up to the concurrency limit
    const activeItems = this.store.state.activeItems
    while (
      activeItems.length < this.#getConcurrency() &&
      this.store.state.items.length > 0
    ) {
      const nextItem = this.peekNextItem()
      if (!nextItem) {
        break
      }
      activeItems.push(nextItem)
      this.#setState({
        activeItems,
      })
      ;(async () => {
        await this.execute()

        const wait = this.#getWait()
        if (wait > 0) {
          const timeoutId = setTimeout(() => this.#tick(), wait)
          this.#timeoutIds.add(timeoutId)
          return
        }

        this.#tick()
      })()
    }

    this.#setState({ pendingTick: false })
  }

  /**
   * Adds an item to the queue. If the queue is full, the item is rejected and onReject is called.
   * Items can be inserted based on priority or at the front/back depending on configuration.
   *
   * @example
   * ```ts
   * queuer.addItem({ value: 'task', priority: 10 });
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
        const existingPriority =
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
      this.#tick()
    }

    return true
  }

  /**
   * Removes and returns the next item from the queue without executing the task function.
   * Use for manual queue management. Normally, use execute() to process items.
   *
   * @example
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

    // When priority function is provided or position is 'front', always get from front (highest priority)
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
   * Removes and returns the next item from the queue and executes the task function with it.
   *
   * @example
   * ```ts
   * queuer.execute();
   * // LIFO
   * queuer.execute('back');
   * ```
   */
  execute = async (position?: QueuePosition): Promise<any> => {
    const item = this.getNextItem(position)

    if (item !== undefined) {
      const currentExecuteCount = this.store.state.executeCount + 1
      this.#setState({
        executeCount: currentExecuteCount,
        isExecuting: true,
      })
      try {
        const currentAsyncRetryer = new AsyncRetryer(this.fn, {
          ...this.options.asyncRetryerOptions,
          key: `${this.key}-retryer-${currentExecuteCount}`,
        })
        this.asyncRetryers.set(currentExecuteCount, currentAsyncRetryer)
        const lastResult = await currentAsyncRetryer.execute(item) // EXECUTE!
        this.#setState({
          successCount: this.store.state.successCount + 1,
          lastResult,
        })
        this.options.onSuccess?.(lastResult, item, this)
      } catch (error) {
        this.#setState({
          errorCount: this.store.state.errorCount + 1,
        })
        this.options.onError?.(error as Error, item, this)
        if (this.options.throwOnError) {
          throw error
        }
      } finally {
        this.asyncRetryers.delete(currentExecuteCount) // dispose retryer
        this.#setState({
          activeItems: this.store.state.activeItems.filter(
            (activeItem) => activeItem !== item,
          ),
          isExecuting: false,
          settledCount: this.store.state.settledCount + 1,
        })
        this.options.onSettled?.(item, this)
      }
    }
    return item
  }

  /**
   * Processes a specified number of items to execute immediately with no wait time
   * If no numberOfItems is provided, all items will be processed
   */
  flush = async (
    numberOfItems: number = this.store.state.items.length,
    position?: QueuePosition,
  ): Promise<void> => {
    this.#clearTimeouts() // clear any pending timeouts
    await Promise.all(
      Array.from({ length: numberOfItems }, () => this.execute(position)),
    )
  }

  /**
   * Processes all items in the queue as a batch using the provided function as an argument
   * The queue is cleared after processing
   */
  flushAsBatch = async (
    batchFunction: (items: Array<TValue>) => Promise<any>,
  ): Promise<void> => {
    this.#clearTimeouts() // clear any pending timeouts
    const items = this.#getAllItems()
    await batchFunction(items)
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
   * @example
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
   * Returns a copy of all items in the queue, including active and pending items.
   */
  peekAllItems = (): Array<TValue> => {
    return [...this.peekActiveItems(), ...this.peekPendingItems()]
  }

  /**
   * Returns the items currently being processed (active tasks).
   */
  peekActiveItems = (): Array<TValue> => {
    return [...this.store.state.activeItems]
  }

  /**
   * Returns the items waiting to be processed (pending tasks).
   */
  peekPendingItems = (): Array<TValue> => {
    return [...this.store.state.items]
  }

  /**
   * Starts processing items in the queue. If already running, does nothing.
   */
  start = (): void => {
    this.#setState({ isRunning: true })
    if (!this.store.state.pendingTick && this.store.state.items.length > 0) {
      this.#tick()
    }
  }

  /**
   * Stops processing items in the queue. Does not clear the queue.
   */
  stop = (): void => {
    this.#clearTimeouts()
    this.#setState({ isRunning: false, pendingTick: false })
  }

  #clearTimeouts = (): void => {
    this.#timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
    this.#timeoutIds.clear()
  }

  /**
   * Removes all pending items from the queue.
   * Does NOT affect active tasks.
   */
  clear = (): void => {
    this.#setState({ items: [], itemTimestamps: [] })
    this.options.onItemsChange?.(this)
  }

  /**
   * Returns the AbortSignal for a specific execution.
   * If no executeCount is provided, returns the signal for the most recent execution.
   * Returns null if no execution is found or not currently executing.
   *
   * @param executeCount - Optional specific execution to get signal for
   * @example
   * ```typescript
   * const queuer = new AsyncQueuer(
   *   async (item: string) => {
   *     const signal = queuer.getAbortSignal()
   *     if (signal) {
   *       const response = await fetch(`/api/process/${item}`, { signal })
   *       return response.json()
   *     }
   *   },
   *   { concurrency: 2 }
   * )
   * ```
   */
  getAbortSignal = (executeCount?: number): AbortSignal | null => {
    const count = executeCount ?? this.store.state.executeCount
    const retryer = this.asyncRetryers.get(count)
    return retryer?.getAbortSignal() ?? null
  }

  /**
   * Aborts all ongoing executions with the internal abort controllers.
   * Does NOT clear out the items.
   */
  abort = (): void => {
    this.asyncRetryers.forEach((retryer) => retryer.abort())
    this.asyncRetryers.clear()
    this.#setState({
      isExecuting: false,
    })
  }

  /**
   * Resets the queuer state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultAsyncQueuerState<TValue>())
    this.options.onItemsChange?.(this)
    this.asyncRetryers.forEach((retryer) => retryer.reset())
  }
}

/**
 * Creates a new AsyncQueuer instance and returns a bound addItem function for adding tasks.
 * The queuer is started automatically and ready to process items.
 *
 * Async vs Sync Versions:
 * The async version provides advanced features over the sync queue function:
 * - Returns promises that can be awaited for task results
 * - Built-in retry support via AsyncRetryer integration for each queued task
 * - Abort support to cancel in-flight task executions
 * - Comprehensive error handling with onError callbacks and throwOnError control
 * - Detailed execution tracking (success/error/settle counts)
 * - Concurrent execution support (process multiple items simultaneously)
 *
 * The sync queue function is lighter weight and simpler when you don't need async features,
 * return values, or execution control.
 *
 * What is Queuing?
 * Queuing is a technique for managing and processing items sequentially or with controlled concurrency.
 * Tasks are processed up to the configured concurrency limit. When a task completes,
 * the next pending task is processed if the concurrency limit allows.
 *
 * Configuration Options:
 * - `concurrency`: Maximum number of concurrent tasks (default: 1)
 * - `wait`: Time to wait between processing items (default: 0)
 * - `maxSize`: Maximum number of items allowed in the queue (default: Infinity)
 * - `getPriority`: Function to determine item priority
 * - `addItemsTo`: Default position to add items ('back' or 'front', default: 'back')
 * - `getItemsFrom`: Default position to get items ('front' or 'back', default: 'front')
 * - `expirationDuration`: Maximum time items can stay in queue
 * - `started`: Whether to start processing immediately (default: true)
 * - `asyncRetryerOptions`: Configure retry behavior for task executions
 *
 * Error Handling:
 * - If an `onError` handler is provided, it will be called with the error and queuer instance
 * - If `throwOnError` is true (default when no onError handler is provided), the error will be thrown
 * - If `throwOnError` is false (default when onError handler is provided), the error will be swallowed
 * - Both onError and throwOnError can be used together; the handler will be called before any error is thrown
 * - The error state can be checked using the underlying AsyncQueuer instance
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the async queuer
 * - Use `onSuccess` callback to react to successful task execution and implement custom logic
 * - Use `onError` callback to react to task execution errors and implement custom error handling
 * - Use `onSettled` callback to react to task execution completion (success or error) and implement custom logic
 * - Use `onItemsChange` callback to react to items being added or removed from the queue
 * - Use `onExpire` callback to react to items expiring and implement custom logic
 * - Use `onReject` callback to react to items being rejected when the queue is full
 * - The state includes error count, expiration count, rejection count, running status, and success/settle counts
 * - State can be accessed via the underlying AsyncQueuer instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * @example
 * ```ts
 * const enqueue = asyncQueue<string>(async (item) => {
 *   return item.toUpperCase();
 * }, {
 *   concurrency: 2,
 *   wait: 100,
 *   onSuccess: (result) => console.log('Processed:', result)
 * });
 *
 * enqueue('hello');
 * ```
 */
export function asyncQueue<TValue>(
  fn: (value: TValue) => Promise<any>,
  initialOptions: AsyncQueuerOptions<TValue>,
) {
  const asyncQueuer = new AsyncQueuer<TValue>(fn, initialOptions)
  return asyncQueuer.addItem
}
