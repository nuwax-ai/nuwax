import { Repeater } from '@repeaterjs/repeater';
/**
 * Utility for mapping an event stream.
 */
export declare const map: <T, O>(mapper: (input: T) => Promise<O> | O) => (source: AsyncIterable<T>) => Repeater<O>;
