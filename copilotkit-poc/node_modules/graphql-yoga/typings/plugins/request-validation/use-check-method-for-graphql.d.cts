import type { Plugin } from '../types.cjs';
export declare function isValidMethodForGraphQL(method: string): method is 'GET' | 'POST';
export declare function useCheckMethodForGraphQL(): Plugin;
