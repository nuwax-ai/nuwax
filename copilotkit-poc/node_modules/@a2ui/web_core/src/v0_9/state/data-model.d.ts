import { Subscription as BaseSubscription } from '../common/events.js';
import { Signal } from '@preact/signals-core';
/**
 * Represents a reactive connection to a specific path in the data model.
 */
export interface DataSubscription<T> extends BaseSubscription {
    /**
     * The current value at the subscribed path.
     */
    readonly value: T | undefined;
}
/**
 * A standalone, observable data store representing the client-side state.
 * It handles JSON Pointer path resolution and subscription management.
 */
export declare class DataModel {
    private data;
    private readonly signals;
    private readonly subscriptions;
    /**
     * Creates a new data model.
     *
     * @param initialData The initial data for the model. Defaults to an empty object.
     */
    constructor(initialData?: Record<string, unknown>);
    /**
     * Retrieves a Preact Signal for a specific data path.
     *
     * This provides a reactive way to access a value. If the value at the path changes via `set()`,
     * the signal will automatically be updated.
     *
     * @param path The JSON pointer path to create or retrieve a signal for.
     * @returns A Preact Signal representing the value at the specified path.
     */
    getSignal<T>(path: string): Signal<T | undefined>;
    /**
     * Updates the model at the specific path and notifies all relevant signals.
     * If path is '/' or empty, replaces the entire root.
     *
     * Note on `undefined` values:
     * - For objects: Setting a property to `undefined` removes the key from the object.
     * - For arrays: Setting an index to `undefined` sets that index to `undefined` but preserves the array length (sparse array).
     */
    set(path: string, value: any): this;
    /**
     * Retrieves data at a specific JSON pointer path.
     *
     * @param path The JSON pointer path to read from.
     * @returns The value at the specified path, or undefined if not found.
     */
    get(path: string): any;
    /**
     * Subscribes to changes at the specified data path.
     *
     * This is a backwards-compatible layer using Preact Signals internally. It allows
     * listeners to be notified whenever the value at the specified path (or any of its
     * ancestors/descendants) changes.
     *
     * @param path The JSON pointer path to observe.
     * @param onChange A callback fired whenever the value changes.
     * @returns A `DataSubscription` containing the initial value and an `unsubscribe` method.
     */
    subscribe<T>(path: string, onChange: (value: T | undefined) => void): DataSubscription<T>;
    /**
     * Clears all internal subscriptions.
     */
    dispose(): void;
    private normalizePath;
    private parsePath;
    private notifySignals;
    private updateSignal;
    private notifyAllSignals;
    private isDescendant;
}
//# sourceMappingURL=data-model.d.ts.map