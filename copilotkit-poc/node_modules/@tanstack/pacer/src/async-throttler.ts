import { Store } from '@tanstack/store'
import { AsyncRetryer } from './async-retryer'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { AsyncRetryerOptions } from './async-retryer'
import type { AnyAsyncFunction, OptionalKeys } from './types'

export interface AsyncThrottlerState<TFn extends AnyAsyncFunction> {
  /**
   * Number of function executions that have resulted in errors
   */
  errorCount: number
  /**
   * Whether the throttled function is currently executing asynchronously
   */
  isExecuting: boolean
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
   * The result from the most recent successful function execution
   */
  lastResult: ReturnType<TFn> | undefined
  /**
   * Number of times maybeExecute has been called (for reduction calculations)
   */
  maybeExecuteCount: number
  /**
   * Timestamp when the next execution can occur in milliseconds
   */
  nextExecutionTime: number | undefined
  /**
   * Number of function executions that have completed (either successfully or with errors)
   */
  settleCount: number
  /**
   * Current execution status - 'idle' when not active, 'pending' when waiting, 'executing' when running, 'settled' when completed
   */
  status: 'disabled' | 'idle' | 'pending' | 'executing' | 'settled'
  /**
   * Number of function executions that have completed successfully
   */
  successCount: number
}

function getDefaultAsyncThrottlerState<
  TFn extends AnyAsyncFunction,
>(): AsyncThrottlerState<TFn> {
  return {
    errorCount: 0,
    isExecuting: false,
    isPending: false,
    lastArgs: undefined,
    lastExecutionTime: 0,
    lastResult: undefined,
    maybeExecuteCount: 0,
    nextExecutionTime: undefined,
    settleCount: 0,
    status: 'idle',
    successCount: 0,
  }
}

/**
 * Options for configuring an async throttled function
 */
export interface AsyncThrottlerOptions<TFn extends AnyAsyncFunction> {
  /**
   * Options for configuring the underlying async retryer
   */
  asyncRetryerOptions?: AsyncRetryerOptions<TFn>
  /**
   * Whether the throttler is enabled. When disabled, maybeExecute will not trigger any executions.
   * Can be a boolean or a function that returns a boolean.
   * Defaults to true.
   */
  enabled?: boolean | ((throttler: AsyncThrottler<TFn>) => boolean)
  /**
   * Initial state for the async throttler
   */
  initialState?: Partial<AsyncThrottlerState<TFn>>
  /**
   * Optional key to identify this async throttler instance.
   * If provided, the async throttler will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Whether to execute the function immediately when called
   * Defaults to true
   */
  leading?: boolean
  /**
   * Optional error handler for when the throttled function throws.
   * If provided, the handler will be called with the error and throttler instance.
   * This can be used alongside throwOnError - the handler will be called before any error is thrown.
   */
  onError?: (
    error: Error,
    args: Parameters<TFn>,
    asyncThrottler: AsyncThrottler<TFn>,
  ) => void
  /**
   * Optional function to call when the throttled function is executed
   */
  onSettled?: (
    args: Parameters<TFn>,
    asyncThrottler: AsyncThrottler<TFn>,
  ) => void
  /**
   * Optional function to call when the throttled function is executed
   */
  onSuccess?: (
    result: ReturnType<TFn>,
    args: Parameters<TFn>,
    asyncThrottler: AsyncThrottler<TFn>,
  ) => void
  /**
   * Whether to throw errors when they occur.
   * Defaults to true if no onError handler is provided, false if an onError handler is provided.
   * Can be explicitly set to override these defaults.
   */
  throwOnError?: boolean
  /**
   * Whether to execute the function on the trailing edge of the wait period
   * Defaults to true
   */
  trailing?: boolean
  /**
   * Time window in milliseconds during which the function can only be executed once.
   * Can be a number or a function that returns a number.
   * Defaults to 0ms
   */
  wait: number | ((throttler: AsyncThrottler<TFn>) => number)
}

/**
 * Utility function for sharing common `AsyncThrottlerOptions` options between different `AsyncThrottler` instances.
 */
export function asyncThrottlerOptions<
  TFn extends AnyAsyncFunction = AnyAsyncFunction,
  TOptions extends Partial<AsyncThrottlerOptions<TFn>> = Partial<
    AsyncThrottlerOptions<TFn>
  >,
>(options: TOptions): TOptions {
  return options
}

type AsyncThrottlerOptionsWithOptionalCallbacks = OptionalKeys<
  AsyncThrottlerOptions<any>,
  'initialState' | 'onError' | 'onSettled' | 'onSuccess'
>

const defaultOptions: AsyncThrottlerOptionsWithOptionalCallbacks = {
  asyncRetryerOptions: {
    maxAttempts: 1,
  },
  enabled: true,
  leading: true,
  trailing: true,
  wait: 0,
}

/**
 * A class that creates an async throttled function.
 *
 * Async vs Sync Versions:
 * The async version provides advanced features over the sync Throttler:
 * - Returns promises that can be awaited for throttled function results
 * - Built-in retry support via AsyncRetryer integration
 * - Abort support to cancel in-flight executions
 * - Cancel support to prevent pending executions from starting
 * - Comprehensive error handling with onError callbacks and throwOnError control
 * - Detailed execution tracking (success/error/settle counts)
 * - Waits for ongoing executions to complete before scheduling the next one
 *
 * The sync Throttler is lighter weight and simpler when you don't need async features,
 * return values, or execution control.
 *
 * What is Throttling?
 * Throttling limits how often a function can be executed, allowing only one execution within a specified time window.
 * Unlike debouncing which resets the delay timer on each call, throttling ensures the function executes at a
 * regular interval regardless of how often it's called.
 *
 * This is useful for rate-limiting API calls, handling scroll/resize events, or any scenario where you want to
 * ensure a maximum execution frequency.
 *
 * Error Handling:
 * - If an `onError` handler is provided, it will be called with the error and throttler instance
 * - If `throwOnError` is true (default when no onError handler is provided), the error will be thrown
 * - If `throwOnError` is false (default when onError handler is provided), the error will be swallowed
 * - Both onError and throwOnError can be used together - the handler will be called before any error is thrown
 * - The error state can be checked using the underlying AsyncThrottler instance
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the async throttler
 * - Use `onSuccess` callback to react to successful function execution and implement custom logic
 * - Use `onError` callback to react to function execution errors and implement custom error handling
 * - Use `onSettled` callback to react to function execution completion (success or error) and implement custom logic
 * - The state includes error count, execution status, last execution time, and success/settle counts
 * - State can be accessed via `asyncThrottler.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `asyncThrottler.state`
 *
 * @example
 * ```ts
 * const throttler = new AsyncThrottler(async (value: string) => {
 *   const result = await saveToAPI(value);
 *   return result; // Return value is preserved
 * }, {
 *   wait: 1000,
 *   onError: (error) => {
 *     console.error('API call failed:', error);
 *   }
 * });
 *
 * // Will only execute once per second no matter how often called
 * // Returns the API response directly
 * const result = await throttler.maybeExecute(inputElement.value);
 * ```
 */
export class AsyncThrottler<TFn extends AnyAsyncFunction> {
  readonly store: Store<Readonly<AsyncThrottlerState<TFn>>> = new Store<
    AsyncThrottlerState<TFn>
  >(getDefaultAsyncThrottlerState<TFn>())
  key: string | undefined
  options: AsyncThrottlerOptions<TFn>
  asyncRetryers = new Map<number, AsyncRetryer<TFn>>()
  #timeoutId: ReturnType<typeof setTimeout> | null = null
  #resolvePreviousPromise:
    | ((value?: ReturnType<TFn> | undefined) => void)
    | null = null

  constructor(
    public fn: TFn,
    initialOptions: AsyncThrottlerOptions<TFn>,
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
      throwOnError: initialOptions.throwOnError ?? !initialOptions.onError,
    }
    this.#setState(this.options.initialState ?? {})

    if (this.key) {
      pacerEventClient.on('d-AsyncThrottler', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(
          event.payload.store.state as Partial<AsyncThrottlerState<TFn>>,
        )
        this.setOptions(
          event.payload.options as Partial<AsyncThrottlerOptions<TFn>>,
        )
      })
    }
  }

  /**
   * Updates the async throttler options
   */
  setOptions = (newOptions: Partial<AsyncThrottlerOptions<TFn>>): void => {
    this.options = { ...this.options, ...newOptions }

    // End the pending state if the throttler is disabled
    if (!this.#getEnabled()) {
      this.cancel()
    }
  }

  #setState = (newState: Partial<AsyncThrottlerState<TFn>>): void => {
    this.store.setState((state) => {
      const combinedState = {
        ...state,
        ...newState,
      }
      const { isPending, isExecuting, settleCount } = combinedState
      return {
        ...combinedState,
        status: !this.#getEnabled()
          ? 'disabled'
          : isPending
            ? 'pending'
            : isExecuting
              ? 'executing'
              : settleCount > 0
                ? 'settled'
                : 'idle',
      }
    })
    emitChange('AsyncThrottler', this)
  }

  /**
   * Returns the current enabled state of the async throttler
   */
  #getEnabled = (): boolean => {
    return !!parseFunctionOrValue(this.options.enabled, this)
  }

  /**
   * Returns the current wait time in milliseconds
   */
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
   * const throttled = new AsyncThrottler(fn, { wait: 1000 });
   *
   * // First call executes immediately
   * await throttled.maybeExecute('a', 'b');
   *
   * // Call during wait period - gets throttled
   * await throttled.maybeExecute('c', 'd');
   * ```
   */
  maybeExecute = async (
    ...args: Parameters<TFn>
  ): Promise<ReturnType<TFn> | undefined> => {
    if (!this.#getEnabled()) return undefined

    this.#resolvePreviousPromiseInternal()

    this.#setState({
      maybeExecuteCount: this.store.state.maybeExecuteCount + 1,
      lastArgs: args, // store the arguments for potential trailing execution
    })

    const wait = this.#getWait()
    const thisMaybeExecuteNumber = this.store.state.maybeExecuteCount

    // Wait for the wait period for the previous execution to complete if it's still running
    for (
      let maxNumIterations = wait / 10;
      this.store.state.isExecuting && maxNumIterations > 0;
      maxNumIterations--
    ) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      if (this.store.state.maybeExecuteCount !== thisMaybeExecuteNumber) {
        // cancel the current maybeExecute loop because a new maybeExecute call was made
        return this.store.state.lastResult
      }
    }

    const now = Date.now()
    const timeSinceLastExecution = now - this.store.state.lastExecutionTime

    if (
      this.options.leading &&
      !this.store.state.isPending &&
      timeSinceLastExecution >= wait
    ) {
      await this.#execute(...args) // Leading EXECUTE!
    } else if (this.options.trailing) {
      // replace old pending execution with a new one
      this.cancel()
      this.#setState({
        isPending: true,
      })

      // Set up new trailing execution
      return new Promise((resolve, reject) => {
        this.#resolvePreviousPromise = resolve

        const newTimeSinceLastExecution = this.store.state.lastExecutionTime
          ? now - this.store.state.lastExecutionTime
          : 0
        const timeoutDuration = Math.max(0, wait - newTimeSinceLastExecution)

        this.#timeoutId = setTimeout(async () => {
          this.#clearTimeout()
          if (this.store.state.lastArgs !== undefined) {
            try {
              await this.#execute(...this.store.state.lastArgs) // Trailing EXECUTE!
            } catch (error) {
              reject(error)
            }
          }
          this.#resolvePreviousPromise = null
          resolve(this.store.state.lastResult)
        }, timeoutDuration)
      })
    }
    return this.store.state.lastResult
  }

  #execute = async (
    ...args: Parameters<TFn>
  ): Promise<ReturnType<TFn> | undefined> => {
    if (!this.#getEnabled()) return undefined

    const currentMaybeExecute = this.store.state.maybeExecuteCount

    try {
      this.#setState({ isExecuting: true })
      const currentAsyncRetryer = new AsyncRetryer(this.fn, {
        ...this.options.asyncRetryerOptions,
        key: `${this.key}-retryer-${currentMaybeExecute}`,
      })
      this.asyncRetryers.set(currentMaybeExecute, currentAsyncRetryer)
      const result = await currentAsyncRetryer.execute(...args) // EXECUTE!
      this.#setState({
        lastResult: result,
        successCount: this.store.state.successCount + 1,
      })
      this.options.onSuccess?.(result as ReturnType<TFn>, args, this)
    } catch (error) {
      this.#setState({
        errorCount: this.store.state.errorCount + 1,
      })
      this.options.onError?.(error as Error, args, this)
      if (this.options.throwOnError) {
        throw error
      }
    } finally {
      this.asyncRetryers.delete(currentMaybeExecute) // dispose retryer
      const lastExecutionTime = Date.now()
      const wait = this.#getWait()
      const nextExecutionTime = lastExecutionTime + wait
      this.#setState({
        isExecuting: false,
        isPending: !!this.#timeoutId,
        settleCount: this.store.state.settleCount + 1,
        lastExecutionTime,
        nextExecutionTime,
      })
      this.options.onSettled?.(args, this)
      setTimeout(() => {
        if (!this.store.state.isPending) {
          // clear nextExecutionTime if there is no pending execution
          this.#setState({ nextExecutionTime: undefined })
        }
      }, wait)
    }
    return this.store.state.lastResult
  }

  /**
   * Processes the current pending execution immediately
   */
  flush = async (): Promise<ReturnType<TFn> | undefined> => {
    if (this.store.state.isPending && this.store.state.lastArgs) {
      // Store the pending promise resolver before clearing timeout
      const resolvePromise = this.#resolvePreviousPromise

      // Clear timeout and state without resolving the promise
      this.#clearTimeout()
      this.#setState({
        isPending: false,
      })

      const result = await this.#execute(...this.store.state.lastArgs)

      // Resolve the pending promise with the result
      if (resolvePromise) {
        resolvePromise(result)
      }

      return result
    }
    return undefined
  }

  #resolvePreviousPromiseInternal = (): void => {
    if (this.#resolvePreviousPromise) {
      this.#resolvePreviousPromise(this.store.state.lastResult)
      this.#resolvePreviousPromise = null
    }
  }

  #clearTimeout = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = null
    }
  }

  /**
   * Returns the AbortSignal for a specific execution.
   * If no maybeExecuteCount is provided, returns the signal for the most recent execution.
   * Returns null if no execution is found or not currently executing.
   *
   * @param maybeExecuteCount - Optional specific execution to get signal for
   * @example
   * ```typescript
   * const throttler = new AsyncThrottler(
   *   async (data: string) => {
   *     const signal = throttler.getAbortSignal()
   *     if (signal) {
   *       const response = await fetch('/api/save', {
   *         method: 'POST',
   *         body: data,
   *         signal
   *       })
   *       return response.json()
   *     }
   *   },
   *   { wait: 1000 }
   * )
   * ```
   */
  getAbortSignal = (maybeExecuteCount?: number): AbortSignal | null => {
    const count = maybeExecuteCount ?? this.store.state.maybeExecuteCount
    const retryer = this.asyncRetryers.get(count)
    return retryer?.getAbortSignal() ?? null
  }

  /**
   * Aborts all ongoing executions with the internal abort controllers.
   * Does NOT cancel any pending execution that have not started yet.
   */
  abort = (): void => {
    this.asyncRetryers.forEach((retryer) => retryer.abort())
    this.asyncRetryers.clear()
    this.#setState({ isExecuting: false })
  }

  /**
   * Cancels any pending execution that have not started yet.
   * Does NOT abort any execution already in progress.
   */
  cancel = (): void => {
    this.#clearTimeout()
    if (this.#resolvePreviousPromise) {
      this.#resolvePreviousPromiseInternal()
      this.#resolvePreviousPromise = null
    }
    this.#setState({
      isPending: false,
    })
  }

  /**
   * Resets the debouncer state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultAsyncThrottlerState<TFn>())
    this.asyncRetryers.forEach((retryer) => retryer.reset())
  }
}

/**
 * Creates an async throttled function that limits how often the function can execute.
 * The throttled function will execute at most once per wait period, even if called multiple times.
 * If called while executing, it will wait until execution completes before scheduling the next call.
 *
 * Async vs Sync Versions:
 * The async version provides advanced features over the sync throttle function:
 * - Returns promises that can be awaited for throttled function results
 * - Built-in retry support via AsyncRetryer integration
 * - Abort support to cancel in-flight executions
 * - Cancel support to prevent pending executions from starting
 * - Comprehensive error handling with onError callbacks and throwOnError control
 * - Detailed execution tracking (success/error/settle counts)
 * - Waits for ongoing executions to complete before scheduling the next one
 *
 * The sync throttle function is lighter weight and simpler when you don't need async features,
 * return values, or execution control.
 *
 * What is Throttling?
 * Throttling limits how often a function can be executed, allowing only one execution within a specified time window.
 * Unlike debouncing which resets the delay timer on each call, throttling ensures the function executes at a
 * regular interval regardless of how often it's called.
 *
 * Configuration Options:
 * - `wait`: Time window in milliseconds during which the function can only execute once (required)
 * - `leading`: Execute immediately when called (default: true)
 * - `trailing`: Execute on the trailing edge of the wait period (default: true)
 * - `enabled`: Whether the throttler is enabled (default: true)
 * - `asyncRetryerOptions`: Configure retry behavior for executions
 *
 * Error Handling:
 * - If an `onError` handler is provided, it will be called with the error and throttler instance
 * - If `throwOnError` is true (default when no onError handler is provided), the error will be thrown
 * - If `throwOnError` is false (default when onError handler is provided), the error will be swallowed
 * - Both onError and throwOnError can be used together - the handler will be called before any error is thrown
 * - The error state can be checked using the underlying AsyncThrottler instance
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the async throttler
 * - Use `onSuccess` callback to react to successful function execution and implement custom logic
 * - Use `onError` callback to react to function execution errors and implement custom error handling
 * - Use `onSettled` callback to react to function execution completion (success or error) and implement custom logic
 * - The state includes error count, execution status, last execution time, and success/settle counts
 * - State can be accessed via the underlying AsyncThrottler instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * @example
 * ```ts
 * const throttled = asyncThrottle(async (value: string) => {
 *   const result = await saveToAPI(value);
 *   return result; // Return value is preserved
 * }, {
 *   wait: 1000,
 *   onError: (error) => {
 *     console.error('API call failed:', error);
 *   }
 * });
 *
 * // This will execute at most once per second
 * // Returns the API response directly
 * const result = await throttled(inputElement.value);
 * ```
 */
export function asyncThrottle<TFn extends AnyAsyncFunction>(
  fn: TFn,
  initialOptions: AsyncThrottlerOptions<TFn>,
) {
  const asyncThrottler = new AsyncThrottler(fn, initialOptions)
  return asyncThrottler.maybeExecute
}
