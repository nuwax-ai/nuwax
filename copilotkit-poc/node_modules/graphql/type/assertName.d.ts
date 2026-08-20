/** @category Names */
/**
 * Upholds the spec rules about naming.
 * @param name - The GraphQL name to validate.
 * @returns The validated GraphQL name.
 * @example
 * ```ts
 * import { assertName } from 'graphql/type';
 *
 * assertName('User'); // => 'User'
 * assertName('123User'); // throws an error
 * ```
 */
export declare function assertName(name: string): string;
/**
 * Upholds the spec rules about naming enum values.
 * @param name - The GraphQL name to validate.
 * @returns The validated GraphQL name.
 * @example
 * ```ts
 * import { assertEnumValueName } from 'graphql/type';
 *
 * assertEnumValueName('ACTIVE'); // => 'ACTIVE'
 * assertEnumValueName('true'); // throws an error
 * ```
 */
export declare function assertEnumValueName(name: string): string;
