import { Store } from '@tanstack/store'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { AnyFunction } from './types'

export interface ThrottlerState<TFn extends AnyFunction> {
  /**
   * Number of function executions that have been completed
   */
  executionCount: number
  /**
   * Whether the throttler is waiting for the timeout to trigger execution
   */
  isPending: boolean
  /**
   * The arguments from the most recent call to maybeExecute
   */
  lastArgs: Parameters<TFn> | undefined
  /**
   * Timestamp of the last function execution in milliseconds
   */
  lastExecutionTime: number
  /**
   * Number of times maybeExecute has been called (for reduction calculations)
   */
  maybeExecuteCount: number
  /**
   * Timestamp when the next execution can occur in milliseconds
   */
  nextExecutionTime: number | undefined
  /**
   * Current execution status - 'idle' when not active, 'pending' when waiting for timeout
   */
  status: 'disabled' | 'idle' | 'pending'
}

function getDefaultThrottlerState<
  TFn extends AnyFunction,
>(): ThrottlerState<TFn> {
  return {
    executionCount: 0,
    isPending: false,
    lastArgs: undefined,
    lastExecutionTime: 0,
    nextExecutionTime: 0,
    status: 'idle',
    maybeExecuteCount: 0,
  }
}

/**
 * Options for configuring a throttled function
 */
export interface ThrottlerOptions<TFn extends AnyFunction> {
  /**
   * Whether the throttler is enabled. When disabled, maybeExecute will not trigger any executions.
   * Can be a boolean or a function that returns a boolean.
   * Defaults to true.
   */
  enabled?: boolean | ((throttler: Throttler<TFn>) => boolean)
  /**
   * Initial state for the throttler
   */
  initialState?: Partial<ThrottlerState<TFn>>
  /**
   * A key to identify the throttler.
   * If provided, the throttler will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Whether to execute on the leading edge of the timeout.
   * Defaults to true.
   */
  leading?: boolean
  /**
   * Callback function that is called after the function is executed
   */
  onExecute?: (args: Parameters<TFn>, throttler: Throttler<TFn>) => void
  /**
   * Whether to execute on the trailing edge of the timeout.
   * Defaults to true.
   */
  trailing?: boolean
  /**
   * Time window in milliseconds during which the function can only be executed once.
   * Can be a number or a function that returns a number.
   * Defaults to 0ms
   */
  wait: number | ((throttler: Throttler<TFn>) => number)
}

/**
 * Utility function for sharing common `ThrottlerOptions` options between different `Throttler` instances.
 */
export function throttlerOptions<
  TFn extends AnyFunction = AnyFunction,
  TOptions extends Partial<ThrottlerOptions<TFn>> = Partial<
    ThrottlerOptions<TFn>
  >,
>(options: TOptions): TOptions {
  return options
}

const defaultOptions: Omit<
  Required<ThrottlerOptions<any>>,
  'initialState' | 'onExecute' | 'key'
> = {
  enabled: true,
  leading: true,
  trailing: true,
  wait: 0,
}

/**
 * A class that creates a throttled function.
 *
 * Throttling ensures a function is called at most once within a specified time window.
 * Unlike debouncing which waits for a pause in calls, throttling guarantees consistent
 * execution timing regardless of call frequency.
 * This synchronous version is lighter weight and often all you need - upgrade to AsyncThrottler when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * Supports both leading and trailing edge execution:
 * - Leading: Execute immediately on first call (default: true)
 * - Trailing: Execute after wait period if called during throttle (default: true)
 *
 * For collapsing rapid-fire events where you only care about the last call, consider using Debouncer.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the throttler
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - The state includes execution count, last execution time, pending status, and more
 * - State can be accessed via `throttler.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `throttler.state`
 *
 * @example
 * ```ts
 * const throttler = new Throttler(
 *   (id: string) => api.getData(id),
 *   { wait: 1000 } // Execute at most once per second
 * );
 *
 * // First call executes immediately
 * throttler.maybeExecute('123');
 *
 * // Subsequent calls within 1000ms are throttled
 * throttler.maybeExecute('123'); // Throttled
 * ```
 */
export class Throttler<TFn extends AnyFunction> {
  readonly store: Store<Readonly<ThrottlerState<TFn>>> = new Store(
    getDefaultThrottlerState<TFn>(),
  )
  key: string | undefined
  options: ThrottlerOptions<TFn>
  #timeoutId: ReturnType<typeof setTimeout> | undefined

  constructor(
    public fn: TFn,
    initialOptions: ThrottlerOptions<TFn>,
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
    }
    this.#setState(this.options.initialState ?? {})

    if (this.key) {
      pacerEventClient.on('d-Throttler', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(
          event.payload.store.state as Partial<ThrottlerState<TFn>>,
        )
        this.setOptions(event.payload.options as Partial<ThrottlerOptions<TFn>>)
      })
    }
  }

  /**
   * Updates the throttler options
   */
  setOptions = (newOptions: Partial<ThrottlerOptions<TFn>>): void => {
    this.options = { ...this.options, ...newOptions }

    // Cancel pending execution if the throttler is disabled
    if (!this.#getEnabled()) {
      this.cancel()
    }
  }

  #setState = (newState: Partial<ThrottlerState<TFn>>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }
      const { isPending } = combinedState
      return {
        ...combinedState,
        status: !this.#getEnabled()
          ? 'disabled'
          : isPending
            ? 'pending'
            : 'idle',
      }
    })
    emitChange('Throttler', this)
  }

  #getEnabled = (): boolean => {
    return !!parseFunctionOrValue(this.options.enabled, this)
  }

  #getWait = (): number => {
    return parseFunctionOrValue(this.options.wait, this)
  }

  /**
   * Attempts to execute the throttled function. The execution behavior depends on the throttler options:
   *
   * - If enough time has passed since the last execution (>= wait period):
   *   - With leading=true: Executes immediately
   *   - With leading=false: Waits for the next trailing execution
   *
   * - If within the wait period:
   *   - With trailing=true: Schedules execution for end of wait period
   *   - With trailing=false: Drops the execution
   *
   * @example
   * ```ts
   * const throttled = new Throttler(fn, { wait: 1000 });
   *
   * // First call executes immediately
   * throttled.maybeExecute('a', 'b');
   *
   * // Call during wait period - gets throttled
   * throttled.maybeExecute('c', 'd');
   * ```
   */
  maybeExecute = (...args: Parameters<TFn>): void => {
    this.#setState({
      maybeExecuteCount: this.store.state.maybeExecuteCount + 1,
    })

    const now = Date.now()
    const timeSinceLastExecution = now - this.store.state.lastExecutionTime
    const wait = this.#getWait()

    // Handle leading execution
    if (this.options.leading && timeSinceLastExecution >= wait) {
      this.#execute(...args)
    } else {
      // Store the most recent arguments for potential trailing execution
      this.#setState({
        lastArgs: args,
      })
      // Set up trailing execution if not already scheduled
      if (!this.#timeoutId && this.options.trailing) {
        // prevent large number if lastExecutionTime is undefined
        const _timeSinceLastExecution = this.store.state.lastExecutionTime
          ? now - this.store.state.lastExecutionTime
          : 0
        const timeoutDuration = wait - _timeSinceLastExecution
        this.#setState({ isPending: true })
        this.#timeoutId = setTimeout(() => {
          const { lastArgs } = this.store.state
          if (lastArgs !== undefined) {
            this.#execute(...lastArgs)
          }
        }, timeoutDuration)
      }
    }
  }

  #execute = (...args: Parameters<TFn>): void => {
    if (!this.#getEnabled()) return
    this.fn(...args) // EXECUTE!
    const lastExecutionTime = Date.now()
    const nextExecutionTime = lastExecutionTime + this.#getWait()
    this.#clearTimeout()
    this.#setState({
      executionCount: this.store.state.executionCount + 1,
      lastExecutionTime,
      nextExecutionTime,
      isPending: false,
      lastArgs: undefined,
    })
    this.options.onExecute?.(args, this)
    setTimeout(() => {
      if (!this.store.state.isPending) {
        this.#setState({ nextExecutionTime: undefined })
      }
    }, this.#getWait())
  }

  /**
   * Processes the current pending execution immediately
   */
  flush = (): void => {
    if (this.store.state.isPending && this.store.state.lastArgs) {
      this.#execute(...this.store.state.lastArgs)
    }
  }

  #clearTimeout = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = undefined
    }
  }

  /**
   * Cancels any pending trailing execution and clears internal state.
   *
   * If a trailing execution is scheduled (due to throttling with trailing=true),
   * this will prevent that execution from occurring. The internal timeout and
   * stored arguments will be cleared.
   *
   * Has no effect if there is no pending execution.
   */
  cancel = (): void => {
    this.#clearTimeout()
    this.#setState({
      lastArgs: undefined,
      isPending: false,
    })
  }

  /**
   * Resets the throttler state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultThrottlerState<TFn>())
  }
}

/**
 * Creates a throttled function that limits how often the provided function can execute.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to asyncThrottle when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * Throttling ensures a function executes at most once within a specified time window,
 * regardless of how many times it is called. This is useful for rate-limiting
 * expensive operations or UI updates.
 *
 * The throttled function can be configured to execute on the leading and/or trailing
 * edge of the throttle window via options.
 *
 * For handling bursts of events, consider using debounce() instead. For hard execution
 * limits, consider using rateLimit().
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the throttler
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - The state includes execution count, last execution time, pending status, and more
 * - State can be accessed via the underlying Throttler instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * @example
 * ```ts
 * // Basic throttling - max once per second
 * const throttled = throttle(updateUI, { wait: 1000 });
 *
 * // Configure leading/trailing execution
 * const throttled = throttle(saveData, {
 *   wait: 2000,
 *   leading: true,  // Execute immediately on first call
 *   trailing: true  // Execute again after delay if called during wait
 * });
 * ```
 */
export function throttle<TFn extends AnyFunction>(
  fn: TFn,
  initialOptions: ThrottlerOptions<TFn>,
) {
  const throttler = new Throttler(fn, initialOptions)
  return throttler.maybeExecute
}
