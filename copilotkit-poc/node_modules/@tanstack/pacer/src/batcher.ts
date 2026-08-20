import { Store } from '@tanstack/store'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { OptionalKeys } from './types'

export interface BatcherState<TValue> {
  /**
   * Number of batch executions that have been completed
   */
  executionCount: number
  /**
   * Whether the batcher has no items to process (items array is empty)
   */
  isEmpty: boolean
  /**
   * Whether the batcher is waiting for the timeout to trigger batch processing
   */
  isPending: boolean
  /**
   * Array of items currently queued for batch processing
   */
  items: Array<TValue>
  /**
   * Number of items currently in the batch queue
   */
  size: number
  /**
   * Current processing status - 'idle' when not processing, 'pending' when waiting for timeout
   */
  status: 'idle' | 'pending'
  /**
   * Total number of items that have been processed across all batches
   */
  totalItemsProcessed: number
}

function getDefaultBatcherState<TValue>(): BatcherState<TValue> {
  return {
    executionCount: 0,
    isEmpty: true,
    isPending: false,
    totalItemsProcessed: 0,
    items: [],
    size: 0,
    status: 'idle',
  }
}

/**
 * Options for configuring a Batcher instance
 */
export interface BatcherOptions<TValue> {
  /**
   * Custom function to determine if a batch should be processed
   * Return true to process the batch immediately
   */
  getShouldExecute?: (items: Array<TValue>, batcher: Batcher<TValue>) => boolean
  /**
   * Initial state for the batcher
   */
  initialState?: Partial<BatcherState<TValue>>
  /**
   * Optional key to identify this batcher instance.
   * If provided, the batcher will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Maximum number of items in a batch
   * @default Infinity
   */
  maxSize?: number
  /**
   * Callback fired after a batch is processed
   */
  onExecute?: (batch: Array<TValue>, batcher: Batcher<TValue>) => void
  /**
   * Callback fired after items are added to the batcher
   */
  onItemsChange?: (batcher: Batcher<TValue>) => void
  /**
   * Whether the batcher should start processing immediately
   * @default true
   */
  started?: boolean
  /**
   * Maximum time in milliseconds to wait before processing a batch.
   * If the wait duration has elapsed, the batch will be processed.
   * If not provided, the batch will not be triggered by a timeout.
   * @default Infinity
   */
  wait?: number | ((batcher: Batcher<TValue>) => number)
}

type BatcherOptionsWithOptionalCallbacks<TValue> = OptionalKeys<
  Required<BatcherOptions<TValue>>,
  'initialState' | 'onExecute' | 'onItemsChange' | 'key'
>

const defaultOptions: BatcherOptionsWithOptionalCallbacks<any> = {
  getShouldExecute: () => false,
  maxSize: Infinity,
  started: true,
  wait: Infinity,
}

/**
 * A class that collects items and processes them in batches.
 *
 * Batching is a technique for grouping multiple operations together to be processed as a single unit.
 * This synchronous version is lighter weight and often all you need - upgrade to AsyncBatcher when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * The Batcher provides a flexible way to implement batching with configurable:
 * - Maximum batch size (number of items per batch)
 * - Time-based batching (process after X milliseconds)
 * - Custom batch processing logic via getShouldExecute
 * - Event callbacks for monitoring batch operations
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the batcher
 * - Use `onExecute` callback to react to batch execution and implement custom logic
 * - Use `onItemsChange` callback to react to items being added or removed from the batcher
 * - The state includes batch execution count, total items processed, items, and running status
 * - State can be accessed via `batcher.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `batcher.state`
 *
 * @example
 * ```ts
 * const batcher = new Batcher<number>(
 *   (items) => console.log('Processing batch:', items),
 *   {
 *     maxSize: 5,
 *     wait: 2000,
 *     onExecute: (batch, batcher) => console.log('Batch executed:', batch)
 *   }
 * );
 *
 * batcher.addItem(1);
 * batcher.addItem(2);
 * // After 2 seconds or when 5 items are added, whichever comes first,
 * // the batch will be processed
 * // batcher.flush() // manually trigger a batch
 * ```
 */
export class Batcher<TValue> {
  readonly store: Store<Readonly<BatcherState<TValue>>> = new Store(
    getDefaultBatcherState<TValue>(),
  )
  key: string | undefined
  options: BatcherOptionsWithOptionalCallbacks<TValue>
  #timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(
    public fn: (items: Array<TValue>) => void,
    initialOptions: BatcherOptions<TValue>,
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
    }
    this.#setState(this.options.initialState ?? {})

    if (this.key) {
      pacerEventClient.on('d-Batcher', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(
          event.payload.store.state as Partial<BatcherState<TValue>>,
        )
        this.setOptions(
          event.payload.options as Partial<BatcherOptions<TValue>>,
        )
      })
    }
  }

  /**
   * Updates the batcher options
   */
  setOptions = (newOptions: Partial<BatcherOptions<TValue>>): void => {
    this.options = { ...this.options, ...newOptions }
  }

  #setState = (newState: Partial<BatcherState<TValue>>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }
      const { isPending, items } = combinedState
      const size = items.length
      const isEmpty = size === 0
      return {
        ...combinedState,
        isEmpty,
        size,
        status: isPending ? 'pending' : 'idle',
      }
    })
    emitChange('Batcher', this)
  }

  #getWait = (): number => {
    return parseFunctionOrValue(this.options.wait, this)
  }

  /**
   * Adds an item to the batcher
   * If the batch size is reached, timeout occurs, or shouldProcess returns true, the batch will be processed
   */
  addItem = (item: TValue): void => {
    this.#setState({
      items: [...this.store.state.items, item],
      isPending: this.options.wait !== Infinity,
    })
    this.options.onItemsChange?.(this)

    const shouldProcess =
      this.store.state.items.length >= this.options.maxSize ||
      this.options.getShouldExecute(this.store.state.items, this)

    if (shouldProcess) {
      this.#execute()
    } else if (this.options.wait !== Infinity) {
      this.#clearTimeout() // clear any pending timeout to replace it with a new one
      this.#timeoutId = setTimeout(() => this.#execute(), this.#getWait())
    }
  }

  /**
   * Processes the current batch of items.
   * This method will automatically be triggered if the batcher is running and any of these conditions are met:
   * - The number of items reaches batchSize
   * - The wait duration has elapsed
   * - The getShouldExecute function returns true upon adding an item
   *
   * You can also call this method manually to process the current batch at any time.
   */
  #execute = (): void => {
    if (this.store.state.items.length === 0) {
      return
    }

    const batch = this.peekAllItems() // copy of the items to be processed (to prevent race conditions)
    this.clear() // Clear items before processing to prevent race conditions
    this.options.onItemsChange?.(this) // Call onItemsChange to notify listeners that the items have changed

    this.fn(batch) // EXECUTE
    this.#setState({
      executionCount: this.store.state.executionCount + 1,
      totalItemsProcessed: this.store.state.totalItemsProcessed + batch.length,
    })
    this.options.onExecute?.(batch, this)
  }

  /**
   * Processes the current batch of items immediately
   */
  flush = (): void => {
    this.#clearTimeout() // clear any pending timeout
    this.#execute() // execute immediately
  }

  /**
   * Returns a copy of all items in the batcher
   */
  peekAllItems = (): Array<TValue> => {
    return [...this.store.state.items]
  }

  #clearTimeout = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = null
    }
  }

  /**
   * Removes all items from the batcher
   */
  clear = (): void => {
    this.#setState({ items: [], isPending: false })
  }

  /**
   * Cancels any pending execution that was scheduled.
   * Does NOT clear out the items.
   */
  cancel = (): void => {
    this.#clearTimeout()
    this.#setState({ isPending: false })
  }

  /**
   * Resets the batcher state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultBatcherState<TValue>())
    this.options.onItemsChange?.(this)
  }
}

/**
 * Creates a batcher that processes items in batches.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to asyncBatch when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * @example
 * ```ts
 * const batchItems = batch<number>(
 *   (items) => console.log('Processing:', items),
 *   {
 *     maxSize: 3,
 *     onExecute: (batch, batcher) => console.log('Batch executed:', batch)
 *   }
 * );
 *
 * batchItems(1);
 * batchItems(2);
 * batchItems(3); // Triggers batch processing
 * ```
 */
export function batch<TValue>(
  fn: (items: Array<TValue>) => void,
  options: BatcherOptions<TValue>,
) {
  const batcher = new Batcher<TValue>(fn, options)
  return batcher.addItem
}
