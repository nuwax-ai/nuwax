import { MutableRefObject } from 'react';
import { RefObject } from '@react-types/shared';
interface ContextValue<T> {
    ref?: MutableRefObject<T | null>;
}
export declare function useSyncRef<T>(context?: ContextValue<T> | null, ref?: RefObject<T | null>): void;
export {};
