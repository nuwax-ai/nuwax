/** @category Validation */
import { GraphQLError } from '../error/GraphQLError';
/**
 * Upholds the spec rules about naming. This deprecated helper is retained for
 * backwards compatibility; call `assertName` instead because assertValidName
 * will be removed in v17.
 * @param name - The GraphQL name to validate.
 * @returns The validated GraphQL name.
 * @example
 * ```ts
 * import { assertValidName } from 'graphql/utilities';
 *
 * assertValidName('User'); // => 'User'
 * assertValidName('__typename'); // throws an error
 * ```
 * @deprecated Please use `assertName` instead. Will be removed in v17
 */
export declare function assertValidName(name: string): string;
/**
 * Returns an Error if a name is invalid. This deprecated helper is retained for
 * backwards compatibility; call `assertName` and catch the thrown GraphQLError
 * instead because isValidNameError will be removed in v17.
 * @param name - The GraphQL name to validate.
 * @returns A GraphQLError if the name is invalid; otherwise undefined.
 * @example
 * ```ts
 * import { isValidNameError } from 'graphql/utilities';
 *
 * isValidNameError('User'); // => undefined
 *
 * const error = isValidNameError('__typename');
 * error.message; // => 'Name "__typename" must not begin with "__", which is reserved by GraphQL introspection.'
 * ```
 * @deprecated Please use `assertName` instead. Will be removed in v17
 */
export declare function isValidNameError(
  name: string,
): GraphQLError | undefined;
