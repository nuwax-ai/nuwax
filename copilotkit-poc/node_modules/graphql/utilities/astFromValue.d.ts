/** @category Values */
import type { Maybe } from '../jsutils/Maybe';
import type { ValueNode } from '../language/ast';
import type { GraphQLInputType } from '../type/definition';
/**
 * Produces a GraphQL Value AST given a JavaScript object.
 * Function will match JavaScript/JSON values to GraphQL AST schema format
 * by using suggested GraphQLInputType.
 *
 * A GraphQL type must be provided, which will be used to interpret different
 * JavaScript values.
 *
 * | JSON Value    | GraphQL Value        |
 * | ------------- | -------------------- |
 * | Object        | Input Object         |
 * | Array         | List                 |
 * | Boolean       | Boolean              |
 * | String        | String / Enum Value  |
 * | Number        | Int / Float          |
 * | Unknown       | Enum Value           |
 * | null          | NullValue            |
 * @param value - Runtime value to convert.
 * @param type - The GraphQL type to inspect.
 * @returns A GraphQL value AST for the provided JavaScript value, or null when no literal can represent it.
 * @example
 * ```ts
 * import { print } from 'graphql/language';
 * import {
 *   GraphQLInputObjectType,
 *   GraphQLInt,
 *   GraphQLList,
 *   GraphQLNonNull,
 *   GraphQLString,
 * } from 'graphql/type';
 * import { astFromValue } from 'graphql/utilities';
 *
 * const ReviewInput = new GraphQLInputObjectType({
 *   name: 'ReviewInput',
 *   fields: {
 *     stars: { type: new GraphQLNonNull(GraphQLInt) },
 *     tags: { type: new GraphQLList(GraphQLString) },
 *   },
 * });
 *
 * const valueNode = astFromValue(
 *   { stars: 5, tags: ['featured', 'verified'] },
 *   ReviewInput,
 * );
 *
 * print(valueNode); // => '{ stars: 5, tags: ["featured", "verified"] }'
 * astFromValue(undefined, GraphQLString); // => null
 * astFromValue(null, new GraphQLNonNull(GraphQLString)); // => null
 * ```
 */
export declare function astFromValue(
  value: unknown,
  type: GraphQLInputType,
): Maybe<ValueNode>;
