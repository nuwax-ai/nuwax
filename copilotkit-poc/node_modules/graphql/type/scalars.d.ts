/** @category Scalars */
import type { GraphQLNamedType } from './definition';
import { GraphQLScalarType } from './definition';
/**
 * Maximum possible Int value as per GraphQL Spec (32-bit signed integer).
 * n.b. This differs from JavaScript's numbers that are IEEE 754 doubles safe up-to 2^53 - 1
 */
export declare const GRAPHQL_MAX_INT = 2147483647;
/**
 * Minimum possible Int value as per GraphQL Spec (32-bit signed integer).
 * n.b. This differs from JavaScript's numbers that are IEEE 754 doubles safe starting at -(2^53 - 1)
 */
export declare const GRAPHQL_MIN_INT = -2147483648;
/** The built-in `Int` scalar type. */
export declare const GraphQLInt: GraphQLScalarType<number, number>;
/** The built-in `Float` scalar type. */
export declare const GraphQLFloat: GraphQLScalarType<number, number>;
/** The built-in `String` scalar type. */
export declare const GraphQLString: GraphQLScalarType<string, string>;
/** The built-in `Boolean` scalar type. */
export declare const GraphQLBoolean: GraphQLScalarType<boolean, boolean>;
/** The built-in `ID` scalar type. */
export declare const GraphQLID: GraphQLScalarType<string, string>;
/** All built-in scalar types defined by the GraphQL specification. */
export declare const specifiedScalarTypes: ReadonlyArray<GraphQLScalarType>;
/**
 * Returns true when the scalar type is one of the scalars specified by GraphQL.
 * @param type - The GraphQL type to inspect.
 * @returns True when the scalar type is one of the scalars specified by GraphQL.
 * @example
 * ```ts
 * import {
 *   GraphQLScalarType,
 *   GraphQLString,
 *   isSpecifiedScalarType,
 * } from 'graphql/type';
 *
 * const DateTime = new GraphQLScalarType({
 *   name: 'DateTime',
 * });
 *
 * isSpecifiedScalarType(GraphQLString); // => true
 * isSpecifiedScalarType(DateTime); // => false
 * ```
 */
export declare function isSpecifiedScalarType(type: GraphQLNamedType): boolean;
