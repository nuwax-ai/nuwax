import { Store } from '@tanstack/store'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { AnyFunction } from './types'

export interface RateLimiterState {
  /**
   * Number of function executions that have been completed
   */
  executionCount: number
  /**
   * Array of timestamps when executions occurred for rate limiting calculations
   */
  executionTimes: Array<number>
  /**
   * Whether the rate limiter has exceeded the limit
   */
  isExceeded: boolean
  /**
   * Number of times maybeExecute has been called (for reduction calculations)
   */
  maybeExecuteCount: number
  /**
   * Number of function executions that have been rejected due to rate limiting
   */
  rejectionCount: number
  /**
   * Current execution status - 'disabled' when not active, 'executing' when executing, 'idle' when not executing, 'exceeded' when rate limit is exceeded
   */
  status: 'disabled' | 'exceeded' | 'idle'
}

function getDefaultRateLimiterState(): RateLimiterState {
  return {
    executionCount: 0,
    executionTimes: [],
    isExceeded: false,
    rejectionCount: 0,
    status: 'idle',
    maybeExecuteCount: 0,
  }
}

/**
 * Options for configuring a rate-limited function
 */
export interface RateLimiterOptions<TFn extends AnyFunction> {
  /**
   * Whether the rate limiter is enabled. When disabled, maybeExecute will not trigger any executions.
   * Defaults to true.
   */
  enabled?: boolean | ((rateLimiter: RateLimiter<TFn>) => boolean)
  /**
   * Initial state for the rate limiter
   */
  initialState?: Partial<RateLimiterState>
  /**
   * Optional key to identify this rate limiter instance.
   * If provided, the rate limiter will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Maximum number of executions allowed within the time window.
   * Can be a number or a callback function that receives the rate limiter instance and returns a number.
   */
  limit: number | ((rateLimiter: RateLimiter<TFn>) => number)
  /**
   * Callback function that is called after the function is executed
   */
  onExecute?: (args: Parameters<TFn>, rateLimiter: RateLimiter<TFn>) => void
  /**
   * Optional callback function that is called when an execution is rejected due to rate limiting
   */
  onReject?: (rateLimiter: RateLimiter<TFn>) => void
  /**
   * Time window in milliseconds within which the limit applies.
   * Can be a number or a callback function that receives the rate limiter instance and returns a number.
   */
  window: number | ((rateLimiter: RateLimiter<TFn>) => number)
  /**
   * Type of window to use for rate limiting
   * - 'fixed': Uses a fixed window that resets after the window period
   * - 'sliding': Uses a sliding window that allows executions as old ones expire
   * Defaults to 'fixed'
   */
  windowType?: 'fixed' | 'sliding'
}

/**
 * Utility function for sharing common `RateLimiterOptions` options between different `RateLimiter` instances.
 */
export function rateLimiterOptions<
  TFn extends AnyFunction = AnyFunction,
  TOptions extends Partial<RateLimiterOptions<TFn>> = Partial<
    RateLimiterOptions<TFn>
  >,
>(options: TOptions): TOptions {
  return options
}

const defaultOptions: Omit<
  Required<RateLimiterOptions<any>>,
  'initialState' | 'onExecute' | 'onReject' | 'key'
> = {
  enabled: true,
  limit: 1,
  window: 0,
  windowType: 'fixed',
}

/**
 * A class that creates a rate-limited function.
 *
 * Rate limiting is a simple approach that allows a function to execute up to a limit within a time window,
 * then blocks all subsequent calls until the window passes. This can lead to "bursty" behavior where
 * all executions happen immediately, followed by a complete block.
 * This synchronous version is lighter weight and often all you need - upgrade to AsyncRateLimiter when you need promises, retry support, abort capabilities, or advanced error handling.
 *
 * The rate limiter supports two types of windows:
 * - 'fixed': A strict window that resets after the window period. All executions within the window count
 *   towards the limit, and the window resets completely after the period.
 * - 'sliding': A rolling window that allows executions as old ones expire. This provides a more
 *   consistent rate of execution over time.
 *
 * For smoother execution patterns, consider using:
 * - Throttling: Ensures consistent spacing between executions (e.g. max once per 200ms)
 * - Debouncing: Waits for a pause in calls before executing (e.g. after 500ms of no calls)
 *
 * Rate limiting is best used for hard API limits or resource constraints. For UI updates or
 * smoothing out frequent events, throttling or debouncing usually provide better user experience.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the rate limiter
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - Use `onReject` callback to react to executions being rejected when rate limit is exceeded
 * - The state includes execution count, execution times, and rejection count
 * - State can be accessed via `rateLimiter.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `rateLimiter.state`
 *
 * @example
 * ```ts
 * const rateLimiter = new RateLimiter(
 *   (id: string) => api.getData(id),
 *   {
 *     limit: 5,
 *     window: 1000,
 *     windowType: 'sliding',
 *   }
 * );
 *
 * // Will execute immediately until limit reached, then block
 * rateLimiter.maybeExecute('123');
 * ```
 */
export class RateLimiter<TFn extends AnyFunction> {
  readonly store: Store<Readonly<RateLimiterState>> =
    new Store<RateLimiterState>(getDefaultRateLimiterState())
  key: string | undefined
  options: RateLimiterOptions<TFn>
  #timeoutIds: Set<ReturnType<typeof setTimeout>> = new Set()

  constructor(
    public fn: TFn,
    initialOptions: RateLimiterOptions<TFn>,
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
    }
    this.#setState(this.options.initialState ?? {})
    for (const executionTime of this.#getExecutionTimesInWindow()) {
      this.#setCleanupTimeout(executionTime)
    }

    if (this.key) {
      pacerEventClient.on('d-RateLimiter', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(event.payload.store.state as Partial<RateLimiterState>)
        this.setOptions(
          event.payload.options as Partial<RateLimiterOptions<TFn>>,
        )
      })
    }
  }

  /**
   * Updates the rate limiter options
   */
  setOptions = (newOptions: Partial<RateLimiterOptions<TFn>>): void => {
    this.options = { ...this.options, ...newOptions }
  }

  #setState = (newState: Partial<RateLimiterState>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }
      const isExceeded = combinedState.executionTimes.length >= this.#getLimit()
      const status = !this.#getEnabled()
        ? 'disabled'
        : isExceeded
          ? 'exceeded'
          : 'idle'
      return {
        ...combinedState,
        isExceeded,
        status,
      }
    })
    emitChange('RateLimiter', this)
  }

  /**
   * Returns the current enabled state of the rate limiter
   */
  #getEnabled = (): boolean => {
    return !!parseFunctionOrValue(this.options.enabled, this)
  }

  /**
   * Returns the current limit of executions allowed within the time window
   */
  #getLimit = (): number => {
    return parseFunctionOrValue(this.options.limit, this)
  }

  /**
   * Returns the current time window in milliseconds
   */
  #getWindow = (): number => {
    return parseFunctionOrValue(this.options.window, this)
  }

  /**
   * Attempts to execute the rate-limited function if within the configured limits.
   * Will reject execution if the number of calls in the current window exceeds the limit.
   *
   * @example
   * ```ts
   * const rateLimiter = new RateLimiter(fn, { limit: 5, window: 1000 });
   *
   * // First 5 calls will return true
   * rateLimiter.maybeExecute('arg1', 'arg2'); // true
   *
   * // Additional calls within the window will return false
   * rateLimiter.maybeExecute('arg1', 'arg2'); // false
   * ```
   */
  maybeExecute = (...args: Parameters<TFn>): boolean => {
    this.#setState({
      maybeExecuteCount: this.store.state.maybeExecuteCount + 1,
    })

    this.#cleanupOldExecutions()

    const relevantExecutionTimes = this.#getExecutionTimesInWindow()

    if (relevantExecutionTimes.length < this.#getLimit()) {
      this.#execute(...args)
      return true
    }

    this.#setState({
      rejectionCount: this.store.state.rejectionCount + 1,
    })
    this.options.onReject?.(this)
    return false
  }

  #execute = (...args: Parameters<TFn>): void => {
    if (!this.#getEnabled()) return
    const now = Date.now()
    this.fn(...args) // EXECUTE!
    this.store.state.executionTimes.push(now) // mutate state directly for performance

    this.#setCleanupTimeout(now)

    this.#setState({
      executionCount: this.store.state.executionCount + 1,
    })
    this.options.onExecute?.(args, this)
  }

  #getExecutionTimesInWindow = (): Array<number> => {
    if (this.options.windowType === 'sliding') {
      // For sliding window, return all executions within the current window
      return this.store.state.executionTimes.filter(
        (time) => time > Date.now() - this.#getWindow(),
      )
    } else {
      // For fixed window, return all executions in the current window
      // The window starts from the oldest execution time
      if (this.store.state.executionTimes.length === 0) {
        return []
      }
      const oldestExecution = Math.min(...this.store.state.executionTimes)
      const windowStart = oldestExecution
      const windowEnd = windowStart + this.#getWindow()
      const now = Date.now()

      // If the window has expired, return empty array
      if (now > windowEnd) {
        return []
      }

      // Otherwise, return all executions in the current window
      return this.store.state.executionTimes.filter(
        (time) => time >= windowStart && time <= windowEnd,
      )
    }
  }

  #setCleanupTimeout = (executionTime: number): void => {
    if (
      this.options.windowType === 'sliding' ||
      this.#timeoutIds.size === 0 // new fixed window
    ) {
      const now = Date.now()
      const timeUntilExpiration = executionTime - now + this.#getWindow() + 1
      const timeoutId = setTimeout(() => {
        this.#cleanupOldExecutions()
        this.#clearTimeout(timeoutId)
      }, timeUntilExpiration)
      this.#timeoutIds.add(timeoutId)
    }
  }

  #clearTimeout = (timeoutId: ReturnType<typeof setTimeout>): void => {
    clearTimeout(timeoutId)
    this.#timeoutIds.delete(timeoutId)
  }

  #clearTimeouts = (): void => {
    this.#timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
    this.#timeoutIds.clear()
  }

  #cleanupOldExecutions = (): void => {
    this.#setState({
      executionTimes: this.#getExecutionTimesInWindow(),
    })
  }

  /**
   * Returns the number of remaining executions allowed in the current window
   */
  getRemainingInWindow = (): number => {
    const relevantExecutionTimes = this.#getExecutionTimesInWindow()
    return Math.max(0, this.#getLimit() - relevantExecutionTimes.length)
  }

  /**
   * Returns the number of milliseconds until the next execution will be possible
   */
  getMsUntilNextWindow = (): number => {
    if (this.getRemainingInWindow() > 0) {
      return 0
    }
    const oldestExecution = this.store.state.executionTimes[0] ?? Infinity
    return oldestExecution + this.#getWindow() - Date.now()
  }

  /**
   * Resets the rate limiter state
   */
  reset = (): void => {
    this.#setState(getDefaultRateLimiterState())
    this.#clearTimeouts()
  }
}

/**
 * Creates a rate-limited function that will execute the provided function up to a maximum number of times within a time window.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to asyncRateLimit when you need promises, retry support, abort capabilities, or advanced error handling.
 *
 * Note that rate limiting is a simpler form of execution control compared to throttling or debouncing:
 * - A rate limiter will allow all executions until the limit is reached, then block all subsequent calls until the window resets
 * - A throttler ensures even spacing between executions, which can be better for consistent performance
 * - A debouncer collapses multiple calls into one, which is better for handling bursts of events
 *
 * The rate limiter supports two types of windows:
 * - 'fixed': A strict window that resets after the window period. All executions within the window count
 *   towards the limit, and the window resets completely after the period.
 * - 'sliding': A rolling window that allows executions as old ones expire. This provides a more
 *   consistent rate of execution over time.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the rate limiter
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - Use `onReject` callback to react to executions being rejected when rate limit is exceeded
 * - The state includes execution count, execution times, and rejection count
 * - State can be accessed via the underlying RateLimiter instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * Consider using throttle() or debounce() if you need more intelligent execution control. Use rate limiting when you specifically
 * need to enforce a hard limit on the number of executions within a time period.
 *
 * @example
 * ```ts
 * // Rate limit to 5 calls per minute with a sliding window
 * const rateLimited = rateLimit(makeApiCall, {
 *   limit: 5,
 *   window: 60000,
 *   windowType: 'sliding',
 *   onReject: (rateLimiter) => {
 *     console.log(`Rate limit exceeded. Try again in ${rateLimiter.getMsUntilNextWindow()}ms`);
 *   }
 * });
 *
 * // First 5 calls will execute immediately
 * // Additional calls will be rejected until the minute window resets
 * rateLimited();
 *
 * // For more even execution, consider using throttle instead:
 * const throttled = throttle(makeApiCall, { wait: 12000 }); // One call every 12 seconds
 * ```
 */
export function rateLimit<TFn extends AnyFunction>(
  fn: TFn,
  initialOptions: RateLimiterOptions<TFn>,
) {
  const rateLimiter = new RateLimiter(fn, initialOptions)
  return rateLimiter.maybeExecute
}
