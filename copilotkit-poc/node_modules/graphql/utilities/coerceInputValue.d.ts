/** @category Values */
import { GraphQLError } from '../error/GraphQLError';
import type { GraphQLInputType } from '../type/definition';
declare type OnErrorCB = (
  path: ReadonlyArray<string | number>,
  invalidValue: unknown,
  error: GraphQLError,
) => void;
/**
 * Coerces a JavaScript value given a GraphQL Input Type.
 * @param inputValue - JavaScript value to coerce.
 * @param type - GraphQL input type to coerce the value against.
 * @param onError - Callback invoked for each coercion error.
 * @returns Coerced value, or undefined if coercion failed and errors were reported.
 * @example
 * ```ts
 * // Coerce runtime input values and throw on invalid input by default.
 * import {
 *   GraphQLInputObjectType,
 *   GraphQLInt,
 *   GraphQLList,
 *   GraphQLNonNull,
 *   GraphQLString,
 * } from 'graphql/type';
 * import { coerceInputValue } from 'graphql/utilities';
 *
 * const ReviewInput = new GraphQLInputObjectType({
 *   name: 'ReviewInput',
 *   fields: {
 *     stars: { type: new GraphQLNonNull(GraphQLInt) },
 *     tags: { type: new GraphQLList(GraphQLString) },
 *   },
 * });
 *
 * coerceInputValue({ stars: '5', tags: ['featured'] }, ReviewInput); // => { stars: 5, tags: ['featured'] }
 * coerceInputValue({ stars: 'bad' }, ReviewInput); // throws an error
 * ```
 * @example
 * ```ts
 * // This variant collects coercion errors with a custom onError callback.
 * import { GraphQLInt, GraphQLNonNull } from 'graphql/type';
 * import { coerceInputValue } from 'graphql/utilities';
 *
 * const errors = [];
 * const value = coerceInputValue(
 *   null,
 *   new GraphQLNonNull(GraphQLInt),
 *   (path, invalidValue, error) => {
 *     errors.push({ path, invalidValue, message: error.message });
 *   },
 * );
 *
 * value; // => undefined
 * errors; // => [ { path: [], invalidValue: null, message: 'Expected non-nullable type "Int!" not to be null.' } ]
 * ```
 */
export declare function coerceInputValue(
  inputValue: unknown,
  type: GraphQLInputType,
  onError?: OnErrorCB,
): unknown;
export {};
