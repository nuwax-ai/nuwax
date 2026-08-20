/** Standard cleanup interface returned by all subscriptions. */
export interface Subscription {
    /** Unsubscribes from the event source. */
    unsubscribe(): void;
}
/** A function that handles emitted events. */
export type EventListener<T> = (data: T) => void | Promise<void>;
/**
 * Public interface exposed by models.
 * Allows ONLY subscribing to events.
 */
export interface EventSource<T> {
    /**
     * Subscribes to the event.
     *
     * @param listener The listener function to call when the event is emitted.
     * @returns A subscription object that can be used to unsubscribe.
     */
    subscribe(listener: EventListener<T>): Subscription;
}
/**
 * Internal implementation used by the model.
 * Implements EventSource but also provides the 'emit' method.
 */
export declare class EventEmitter<T> implements EventSource<T> {
    private listeners;
    /**
     * Subscribes to the event.
     *
     * @param listener The listener function to call when the event is emitted.
     * @returns A subscription object that can be used to unsubscribe.
     */
    subscribe(listener: EventListener<T>): Subscription;
    /**
     * Emits an event to all subscribers.
     *
     * @param data The data to pass to subscribers.
     */
    emit(data: T): Promise<void>;
    /**
     * Removes all listeners.
     */
    dispose(): void;
}
//# sourceMappingURL=events.d.ts.map