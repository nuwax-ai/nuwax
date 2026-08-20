/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { z } from 'zod';
import { ComponentContext } from './component-context.js';
import { Action, ChildList, DataBinding, FunctionCall } from '../schema/common-types.js';
/**
 * Represents the intended runtime behavior of a property parsed from its Zod schema.
 *
 * - `DYNAMIC`: The property can be bound to the `DataModel` (e.g. `DynamicString`).
 *    The Binder will automatically subscribe to data changes and emit primitive values.
 * - `ACTION`: The property represents a user interaction (e.g. `Action`).
 *    The Binder will resolve deep payload bindings and output a ready-to-call `() => void` closure.
 * - `STRUCTURAL`: The property dictates the rendering of child components (e.g. `ChildList`).
 *    The Binder outputs lists of objects containing `{ id, basePath }` for structural layout.
 * - `CHECKABLE`: Special property for handling validation arrays (e.g. `checks`).
 *    The Binder will reactively evaluate the rules and inject `isValid` and `validationErrors` booleans into the parent object.
 * - `STATIC`: A primitive value that requires no reactive subscription or resolution.
 * - `OBJECT` / `ARRAY`: Recursive traversal nodes for complex nested schemas.
 */
export type BehaviorNode = {
    type: 'DYNAMIC';
} | {
    type: 'ACTION';
} | {
    type: 'STRUCTURAL';
} | {
    type: 'CHECKABLE';
} | {
    type: 'STATIC';
} | {
    type: 'OBJECT';
    shape: Record<string, BehaviorNode>;
} | {
    type: 'ARRAY';
    element: BehaviorNode;
};
/**
 * Traverses a Zod schema tree to build a `BehaviorNode` map.
 *
 * This allows the Generic Binder to know *how* to handle a piece of raw JSON
 * data without needing hardcoded logic for every specific component type.
 * It identifies core A2UI primitives (Dynamic values, Actions, ChildLists) by
 * inspecting the shape of ZodUnion objects defined in `common-types.ts`.
 */
export declare function scrapeSchemaBehavior(schema: z.ZodTypeAny): BehaviorNode;
type DynamicTypes = DataBinding | FunctionCall;
type IsDynamic<T> = DataBinding extends NonNullable<T> ? true : false;
/**
 * Maps raw Zod inferred types to their resolved runtime equivalents.
 * For example, an `Action` object becomes a callable `() => void` function.
 */
export type ResolveA2uiProp<T> = [NonNullable<T>] extends [Action] ? (() => void) | Extract<T, undefined> : [NonNullable<T>] extends [ChildList] ? any | Extract<T, undefined> : Exclude<T, DynamicTypes> extends never ? any : Exclude<T, DynamicTypes>;
/**
 * Automatically generates two-way binding setters for dynamic properties.
 * If a schema has a `value: DynamicString`, this type generates a `setValue(val: string)` method.
 */
export type GenerateSetters<T> = {
    [K in keyof T as IsDynamic<T[K]> extends true ? `set${Capitalize<string & K>}` : never]-?: (value: Exclude<NonNullable<T[K]>, DynamicTypes>) => void;
};
/**
 * The final output type of the Generic Binder, providing fully resolved, ready-to-use props.
 * This is what framework-specific adapters (like `createReactComponent`) pass to the developer's view logic.
 */
export type ResolveA2uiProps<T> = (T extends object ? {
    [K in keyof T]: ResolveA2uiProp<T[K]>;
} : T) & GenerateSetters<T> & {
    isValid?: boolean;
    validationErrors?: string[];
};
/**
 * The Generic Binder is a framework-agnostic engine that transforms raw A2UI JSON payload
 * configurations into a single, cohesive reactive stream of strongly-typed `ResolvedProps`.
 *
 * It solves the problem of manual state management: developers do not need to write
 * boilerplate code to subscribe to data paths, evaluate logic expressions, or tear down
 * listeners when components unmount.
 *
 * Usage Flow:
 * 1. Takes a `ComponentContext` (the raw JSON config) and a `Zod Schema` (the API definition).
 * 2. Uses `scrapeSchemaBehavior` to analyze the schema.
 * 3. Deeply iterates over the raw JSON properties, applying rules based on the scraped behavior.
 * 4. Subscribes to the `DataContext` for all `DYNAMIC` and `CHECKABLE` paths.
 * 5. Bundles the final resolved primitives, structural arrays, and executable Actions into `currentProps`.
 * 6. Exposes a `subscribe()` interface for framework-specific adapters (React, Angular) to listen to state changes.
 */
export declare class GenericBinder<T> {
    private dataListeners;
    private propsListeners;
    currentProps: Partial<T>;
    private compUnsub?;
    private isConnected;
    private context;
    private behaviorTree;
    constructor(context: ComponentContext, schema: z.ZodTypeAny);
    private resolveInitialProps;
    private connect;
    private rebuildAllBindings;
    private resolveAndBind;
    private updateDeepValue;
    private cloneAndUpdate;
    dispose(): void;
    private notify;
    subscribe(listener: (props: T) => void): {
        unsubscribe: () => void;
    };
    get snapshot(): T;
}
export {};
//# sourceMappingURL=generic-binder.d.ts.map