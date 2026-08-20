import { BaseEvent } from '@react-types/shared';
import { SyntheticEvent } from 'react';
/**
 * This function wraps a React event handler to make stopPropagation the default, and support
 * continuePropagation instead.
 */
export declare function createEventHandler<T extends SyntheticEvent>(handler?: (e: BaseEvent<T>) => void): ((e: T) => void) | undefined;
