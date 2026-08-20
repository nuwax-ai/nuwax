/**
 * Calls all functions in the order they were chained with the same arguments.
 */
export declare function chain(...callbacks: any[]): (...args: any[]) => void;
