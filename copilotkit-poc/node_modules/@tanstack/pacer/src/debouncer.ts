import { Store } from '@tanstack/store'
import { parseFunctionOrValue } from './utils'
import { emitChange, pacerEventClient } from './event-client'
import type { AnyFunction } from './types'

export interface DebouncerState<TFn extends AnyFunction> {
  /**
   * Whether the debouncer can execute on the leading edge of the timeout
   */
  canLeadingExecute: boolean
  /**
   * Number of function executions that have been completed
   */
  executionCount: number
  /**
   * Whether the debouncer is waiting for the timeout to trigger execution
   */
  isPending: boolean
  /**
   * The arguments from the most recent call to maybeExecute
   */
  lastArgs: Parameters<TFn> | undefined
  /**
   * Number of times maybeExecute has been called (for reduction calculations)
   */
  maybeExecuteCount: number
  /**
   * Current execution status - 'idle' when not active, 'pending' when waiting for timeout
   */
  status: 'disabled' | 'idle' | 'pending'
}

function getDefaultDebouncerState<
  TFn extends AnyFunction,
>(): DebouncerState<TFn> {
  return {
    canLeadingExecute: true,
    executionCount: 0,
    isPending: false,
    lastArgs: undefined,
    status: 'idle',
    maybeExecuteCount: 0,
  }
}

/**
 * Options for configuring a debounced function
 */
export interface DebouncerOptions<TFn extends AnyFunction> {
  /**
   * Whether the debouncer is enabled. When disabled, maybeExecute will not trigger any executions.
   * Can be a boolean or a function that returns a boolean.
   * Defaults to true.
   */
  enabled?: boolean | ((debouncer: Debouncer<TFn>) => boolean)
  /**
   * Initial state for the debouncer
   */
  initialState?: Partial<DebouncerState<TFn>>
  /**
   * A key to identify the debouncer.
   * If provided, the debouncer will be identified by this key in the devtools and PacerProvider if applicable.
   */
  key?: string
  /**
   * Whether to execute on the leading edge of the timeout.
   * The first call will execute immediately and the rest will wait the delay.
   * Defaults to false.
   */
  leading?: boolean
  /**
   * Callback function that is called after the function is executed
   */
  onExecute?: (args: Parameters<TFn>, debouncer: Debouncer<TFn>) => void
  /**
   * Whether to execute on the trailing edge of the timeout.
   * Defaults to true.
   */
  trailing?: boolean
  /**
   * Delay in milliseconds before executing the function.
   * Can be a number or a function that returns a number.
   * Defaults to 0ms
   */
  wait: number | ((debouncer: Debouncer<TFn>) => number)
}

/**
 * Utility function for sharing common `DebouncerOptions` options between different `Debouncer` instances.
 */
export function debouncerOptions<
  TFn extends AnyFunction = AnyFunction,
  TOptions extends Partial<DebouncerOptions<TFn>> = Partial<
    DebouncerOptions<TFn>
  >,
>(options: TOptions): TOptions {
  return options
}

const defaultOptions: Omit<
  Required<DebouncerOptions<any>>,
  'initialState' | 'onExecute' | 'key'
> = {
  enabled: true,
  leading: false,
  trailing: true,
  wait: 0,
}

/**
 * A class that creates a debounced function.
 *
 * Debouncing ensures that a function is only executed after a certain amount of time has passed
 * since its last invocation. This is useful for handling frequent events like window resizing,
 * scroll events, or input changes where you want to limit the rate of execution.
 * This synchronous version is lighter weight and often all you need - upgrade to AsyncDebouncer when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * The debounced function can be configured to execute either at the start of the delay period
 * (leading edge) or at the end (trailing edge, default). Each new call during the wait period
 * will reset the timer.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the debouncer
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - The state includes canLeadingExecute, execution count, and isPending status
 * - State can be accessed via `debouncer.store.state` when using the class directly
 * - When using framework adapters (React/Solid), state is accessed from `debouncer.state`
 *
 * @example
 * ```ts
 * const debouncer = new Debouncer((value: string) => {
 *   saveToDatabase(value);
 * }, { wait: 500 });
 *
 * // Will only save after 500ms of no new input
 * inputElement.addEventListener('input', () => {
 *   debouncer.maybeExecute(inputElement.value);
 * });
 * ```
 */
export class Debouncer<TFn extends AnyFunction> {
  readonly store: Store<Readonly<DebouncerState<TFn>>> = new Store(
    getDefaultDebouncerState<TFn>(),
  )
  key: string | undefined
  options: DebouncerOptions<TFn>
  #timeoutId: ReturnType<typeof setTimeout> | undefined

  constructor(
    public fn: TFn,
    initialOptions: DebouncerOptions<TFn>,
  ) {
    this.key = initialOptions.key
    this.options = {
      ...defaultOptions,
      ...initialOptions,
    }
    this.#setState(this.options.initialState ?? {})

    if (this.key) {
      pacerEventClient.on('d-Debouncer', (event) => {
        if (event.payload.key !== this.key) return
        this.#setState(
          event.payload.store.state as Partial<DebouncerState<TFn>>,
        )
        this.setOptions(event.payload.options as Partial<DebouncerOptions<TFn>>)
      })
    }
  }

  /**
   * Updates the debouncer options
   */
  setOptions = (newOptions: Partial<DebouncerOptions<TFn>>): void => {
    this.options = { ...this.options, ...newOptions }

    // Cancel pending execution if the debouncer is disabled
    if (!this.#getEnabled()) {
      this.cancel()
    }
  }

  #setState = (newState: Partial<DebouncerState<TFn>>): void => {
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
    emitChange('Debouncer', this)
  }

  /**
   * Returns the current enabled state of the debouncer
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
   * Attempts to execute the debounced function
   * If a call is already in progress, it will be queued
   */
  maybeExecute = (...args: Parameters<TFn>): void => {
    if (!this.#getEnabled()) return undefined

    this.#setState({
      maybeExecuteCount: this.store.state.maybeExecuteCount + 1,
    })

    let _didLeadingExecute = false

    // Handle leading execution
    if (this.options.leading && this.store.state.canLeadingExecute) {
      this.#setState({ canLeadingExecute: false })
      _didLeadingExecute = true
      this.#execute(...args)
    }

    // Start pending state to indicate that the debouncer is waiting for the trailing edge
    if (this.options.trailing) {
      this.#setState({ isPending: true, lastArgs: args })
    }

    // Clear any existing timeout
    if (this.#timeoutId) clearTimeout(this.#timeoutId)

    // Set new timeout that will reset canLeadingExecute and execute trailing only if enabled and did not execute leading
    this.#timeoutId = setTimeout(() => {
      this.#setState({ canLeadingExecute: true })
      if (this.options.trailing && !_didLeadingExecute) {
        this.#execute(...args)
      }
    }, this.#getWait())
  }

  #execute = (...args: Parameters<TFn>): void => {
    if (!this.#getEnabled()) return undefined
    this.fn(...args) // EXECUTE!
    this.#setState({
      executionCount: this.store.state.executionCount + 1,
      isPending: false,
      lastArgs: undefined,
    })
    this.options.onExecute?.(args, this)
  }

  /**
   * Processes the current pending execution immediately
   */
  flush = (): void => {
    if (this.store.state.isPending && this.store.state.lastArgs) {
      this.#clearTimeout() // clear any pending timeout
      this.#execute(...this.store.state.lastArgs) // execute immediately
    }
  }

  #clearTimeout = (): void => {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = undefined
    }
  }

  /**
   * Cancels any pending execution
   */
  cancel = (): void => {
    this.#clearTimeout()
    this.#setState({
      canLeadingExecute: true,
      isPending: false,
    })
  }

  /**
   * Resets the debouncer state to its default values
   */
  reset = (): void => {
    this.#setState(getDefaultDebouncerState<TFn>())
  }
}

/**
 * Creates a debounced function that delays invoking the provided function until after a specified wait time.
 * Multiple calls during the wait period will cancel previous pending invocations and reset the timer.
 *
 * This synchronous version is lighter weight and often all you need - upgrade to asyncDebounce when you need promises, retry support, abort/cancel capabilities, or advanced error handling.
 *
 * If leading option is true, the function will execute immediately on the first call, then wait the delay
 * before allowing another execution.
 *
 * State Management:
 * - Uses TanStack Store for reactive state management
 * - Use `initialState` to provide initial state values when creating the debouncer
 * - Use `onExecute` callback to react to function execution and implement custom logic
 * - The state includes canLeadingExecute, execution count, and isPending status
 * - State can be accessed via the underlying Debouncer instance's `store.state` property
 * - When using framework adapters (React/Solid), state is accessed from the hook's state property
 *
 * @example
 * ```ts
 * const debounced = debounce(() => {
 *   saveChanges();
 * }, { wait: 1000 });
 *
 * // Called repeatedly but executes at most once per second
 * inputElement.addEventListener('input', debounced);
 * ```
 */
export function debounce<TFn extends AnyFunction>(
  fn: TFn,
  initialOptions: DebouncerOptions<TFn>,
): (...args: Parameters<TFn>) => void {
  const debouncer = new Debouncer(fn, initialOptions)
  return debouncer.maybeExecute
}
