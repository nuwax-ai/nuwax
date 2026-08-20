import { MutableRefObject } from 'react';
/**
 * Offers an object ref for a given callback ref or an object ref. Especially
 * helfpul when passing forwarded refs (created using `React.forwardRef`) to
 * React Aria hooks.
 *
 * @param ref The original ref intended to be used.
 * @returns An object ref that updates the given ref.
 * @see https://react.dev/reference/react/forwardRef
 */
export declare function useObjectRef<T>(ref?: ((instance: T | null) => (() => void) | void) | MutableRefObject<T | null> | null): MutableRefObject<T | null>;
