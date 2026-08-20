export declare let idsUpdaterMap: Map<string, {
    current: string | null;
}[]>;
/**
 * If a default is not provided, generate an id.
 *
 * @param defaultId - Default component id.
 */
export declare function useId(defaultId?: string): string;
/**
 * Merges two ids.
 * Different ids will trigger a side-effect and re-render components hooked up with `useId`.
 */
export declare function mergeIds(idA: string, idB: string): string;
/**
 * Used to generate an id, and after render, check if that id is rendered so we know
 * if we can use it in places such as labelledby.
 *
 * @param depArray - When to recalculate if the id is in the DOM.
 */
export declare function useSlotId(depArray?: ReadonlyArray<any>): string;
