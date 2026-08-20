import { Signal } from '@preact/signals-core';
import { DataModel, DataSubscription } from '../state/data-model.js';
import type { DynamicValue, Action } from '../schema/common-types.js';
import { FunctionInvoker } from '../catalog/function_invoker.js';
import { SurfaceModel } from '../state/surface-model.js';
/**
 * A contextual view of the main DataModel, serving as the unified interface for resolving
 * DynamicValues (literals, data paths, function calls) within a specific scope.
 *
 * Components use `DataContext` instead of interacting with the `DataModel` directly.
 * It automatically handles resolving relative paths against the component's current scope
 * and provides tools for evaluating complex, reactive expressions.
 */
export declare class DataContext {
    readonly surface: SurfaceModel<any>;
    readonly path: string;
    /** The shared, global DataModel instance for the entire UI surface. */
    readonly dataModel: DataModel;
    /** A callback for executing function calls defined in the A2UI component tree. */
    readonly functionInvoker: FunctionInvoker;
    /**
     * Initializes a new DataContext.
     *
     * @param surface The surface model this context belongs to.
     * @param path The absolute path in the DataModel that this context is scoped to (its "current working directory").
     */
    constructor(surface: SurfaceModel<any>, path: string);
    /**
     * Mutates the underlying DataModel at the specified path.
     *
     * This is the primary method for components to push state changes (e.g. user input)
     * back up to the global model.
     *
     * @param path A JSON pointer path. If relative, it is resolved against this context's `path`.
     * @param value The new value to store in the DataModel.
     */
    set(path: string, value: any): void;
    /**
     * Synchronously evaluates a `DynamicValue` (a literal, a path binding, or a function call)
     * into its concrete runtime value.
     *
     * **Note:** This method evaluates the value *once* at the current moment in time.
     * It does not create any reactive subscriptions. If the underlying data changes later,
     * this result will not automatically update. Use `subscribeDynamicValue` for reactive updates.
     *
     * @param value The DynamicValue object from the A2UI JSON payload.
     * @returns The synchronously resolved value.
     */
    resolveDynamicValue<V>(value: DynamicValue): V;
    /**
     * Reactively listens to changes in a `DynamicValue`.
     *
     * This is the core reactive binding mechanism. Whenever the underlying data changes
     * (or if a function call's dependencies change), the `onChange` callback will be fired
     * with the freshly evaluated result.
     *
     * @template V The expected type of the resolved value.
     * @param value The DynamicValue to evaluate and observe.
     * @param onChange A callback fired whenever the evaluated result changes.
     * @returns A `DataSubscription` containing the initial synchronously-resolved value, along with an `unsubscribe` method to clean up the listener.
     */
    subscribeDynamicValue<V>(value: DynamicValue, onChange: (value: V | undefined) => void): DataSubscription<V>;
    /**
     * Returns a Preact Signal representing the reactive dynamic value.
     *
     * This method recursively resolves any nested path bindings or function calls into a
     * single, reactive `Signal`. Any changes to the underlying data or function dependencies
     * will cause this signal's value to update.
     *
     * @param value The DynamicValue to evaluate and observe.
     * @returns A Preact Signal containing the reactive result of the evaluation.
     */
    resolveSignal<V>(value: DynamicValue): Signal<V>;
    /**
     * Resolves an action by evaluating its top-level dynamic values.
     *
     * For event actions, it resolves each value in the context map.
     * For function call actions, it evaluates the call.
     *
     * This is non-recursive: it only resolves one level deep for the context record,
     * in accordance with the schema specification that requires values to be single
     * DynamicValue types and prevents arbitrary nesting.
     */
    resolveAction(action: Action): any;
    private evaluateFunctionReactive;
    private dispatchExpressionError;
    /**
     * Creates a new, child `DataContext` scoped to a deeper path.
     *
     * This is used when a component (like a List or a Card) wants to provide a targeted
     * data scope for its children, so children can use relative paths like `./title`.
     *
     * @param relativePath The path relative to the *current* context's path.
     * @returns A new `DataContext` instance pointing to the resolved absolute path.
     */
    nested(relativePath: string): DataContext;
    private resolvePath;
}
//# sourceMappingURL=data-context.d.ts.map