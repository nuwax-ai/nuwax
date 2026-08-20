import { z } from 'zod';
import { DataContext } from '../rendering/data-context.js';
import { Signal } from '@preact/signals-core';
/**
 * Robust check for a Preact Signal that works across package boundaries.
 */
export declare function isSignal(val: any): val is Signal<any>;
export type A2uiReturnType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
export type InferA2uiReturnType<T extends A2uiReturnType> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : T extends 'array' ? any[] : T extends 'object' ? Record<string, any> : T extends 'void' ? void : any;
/**
 * A definition of a UI function's API.
 */
export interface FunctionApi {
    readonly name: string;
    readonly returnType: A2uiReturnType;
    readonly schema: z.ZodTypeAny;
}
/**
 * A function implementation that can be registered with the evaluator or basic catalog.
 */
export interface FunctionImplementation extends FunctionApi {
    execute(args: Record<string, any>, context: DataContext, abortSignal?: AbortSignal): unknown | Signal<unknown>;
}
export declare function createFunctionImplementation<Schema extends z.ZodTypeAny, TReturn extends A2uiReturnType>(api: {
    name: string;
    returnType: TReturn;
    schema: Schema;
}, execute: (args: z.infer<Schema>, context: DataContext, abortSignal?: AbortSignal) => InferA2uiReturnType<TReturn> | Signal<InferA2uiReturnType<TReturn>>): FunctionImplementation;
import { FunctionInvoker } from './function_invoker.js';
/**
 * A definition of a UI component's API.
 * This interface defines the contract for a component's capabilities and properties,
 * independent of any specific rendering implementation.
 *
 * @template Schema the Zod schema type for the component's properties.
 */
export interface ComponentApi<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
    /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
    name: string;
    /**
     * The Zod schema describing the **properties** of this component.
     *
     * - MUST include catalog-specific common properties (e.g. 'weight', 'accessibility').
     * - MUST NOT include 'component' or 'id' as those are handled by the framework/envelope.
     */
    readonly schema: Schema;
}
/**
 * Infers the schema type from a ComponentApi.
 *
 * This type uses `z.infer` on the `schema` property of a `ComponentApi` object.
 * It is used to access the schema props of a component with type safety.
 */
export type InferredComponentApiSchemaType<Api extends ComponentApi> = z.infer<Api['schema']>;
/**
 * A collection of available components and functions.
 */
export declare class Catalog<T extends ComponentApi> {
    readonly id: string;
    /**
     * A map of available components.
     * This is readonly to encourage immutable extension patterns.
     */
    readonly components: ReadonlyMap<string, T>;
    /**
     * Map of functions provided by this catalog.
     */
    readonly functions: ReadonlyMap<string, FunctionImplementation>;
    /**
     * The schema for theme parameters used by this catalog.
     */
    readonly themeSchema?: z.ZodObject<any>;
    /**
     * A ready-to-use FunctionInvoker callback that delegates to this catalog's functions.
     * Can be passed directly to a DataContext.
     */
    readonly invoker: FunctionInvoker;
    constructor(id: string, components: T[], functions?: FunctionImplementation[], themeSchema?: z.ZodObject<any>);
}
//# sourceMappingURL=types.d.ts.map