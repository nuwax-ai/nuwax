type ToastAction = 'add' | 'remove' | 'clear';
export interface ToastStateProps {
    /** The maximum number of toasts to display at a time. */
    maxVisibleToasts?: number;
    /** Function to wrap updates in (i.e. document.startViewTransition()). */
    wrapUpdate?: (fn: () => void, action: ToastAction) => void;
}
export interface ToastOptions {
    /** Handler that is called when the toast is closed, either by the user or after a timeout. */
    onClose?: () => void;
    /** A timeout to automatically close the toast after, in milliseconds. */
    timeout?: number;
}
export interface QueuedToast<T> extends ToastOptions {
    /** The content of the toast. */
    content: T;
    /** A unique key for the toast. */
    key: string;
    /** A timer for the toast, if a timeout was set. */
    timer?: Timer;
}
export interface ToastState<T> {
    /** Adds a new toast to the queue. */
    add(content: T, options?: ToastOptions): string;
    /**
     * Closes a toast.
     */
    close(key: string): void;
    /** Pauses the timers for all visible toasts. */
    pauseAll(): void;
    /** Resumes the timers for all visible toasts. */
    resumeAll(): void;
    /** The visible toasts. */
    visibleToasts: QueuedToast<T>[];
}
/**
 * Provides state management for a toast queue. Toasts display brief, temporary notifications
 * of actions, errors, or other events in an application.
 */
export declare function useToastState<T>(props?: ToastStateProps): ToastState<T>;
/**
 * Subscribes to a provided toast queue and provides methods to update it.
 */
export declare function useToastQueue<T>(queue: ToastQueue<T>): ToastState<T>;
/**
 * A ToastQueue manages the order of toasts.
 */
export declare class ToastQueue<T> {
    private queue;
    private subscriptions;
    private maxVisibleToasts;
    private wrapUpdate?;
    /** The currently visible toasts. */
    visibleToasts: QueuedToast<T>[];
    constructor(options?: ToastStateProps);
    private runWithWrapUpdate;
    /** Subscribes to updates to the visible toasts. */
    subscribe(fn: () => void): () => void;
    /** Adds a new toast to the queue. */
    add(content: T, options?: ToastOptions): string;
    /**
     * Closes a toast.
     */
    close(key: string): void;
    private updateVisibleToasts;
    /** Pauses the timers for all visible toasts. */
    pauseAll(): void;
    /** Resumes the timers for all visible toasts. */
    resumeAll(): void;
    clear(): void;
}
declare class Timer {
    private timerId;
    private startTime;
    private remaining;
    private callback;
    constructor(callback: () => void, delay: number);
    reset(delay: number): void;
    pause(): void;
    resume(): void;
}
export {};
