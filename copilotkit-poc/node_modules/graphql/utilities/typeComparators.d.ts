/** @category Type Comparisons */
import type { GraphQLCompositeType, GraphQLType } from '../type/definition';
import type { GraphQLSchema } from '../type/schema';
/**
 * Provided two types, return true if the types are equal (invariant).
 * @param typeA - The first GraphQL type to compare.
 * @param typeB - The second GraphQL type to compare.
 * @returns True when both types are equal.
 * @example
 * ```ts
 * import {
 *   GraphQLList,
 *   GraphQLNonNull,
 *   GraphQLString,
 * } from 'graphql/type';
 * import { isEqualType } from 'graphql/utilities';
 *
 * isEqualType(GraphQLString, GraphQLString); // => true
 * isEqualType(new GraphQLList(GraphQLString), new GraphQLList(GraphQLString)); // => true
 * isEqualType(new GraphQLNonNull(GraphQLString), GraphQLString); // => false
 * ```
 */
export declare function isEqualType(
  typeA: GraphQLType,
  typeB: GraphQLType,
): boolean;
/**
 * Provided a type and a super type, return true if the first type is either
 * equal or a subset of the second super type (covariant).
 * @param schema - GraphQL schema to use.
 * @param maybeSubType - The possible subtype to compare.
 * @param superType - The possible supertype to compare.
 * @returns True when `maybeSubType` is equal to or a subtype of `superType`.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql/utilities';
 * import {
 *   GraphQLNonNull,
 *   assertInterfaceType,
 *   assertObjectType,
 * } from 'graphql/type';
 * import { isTypeSubTypeOf } from 'graphql/utilities';
 *
 * const schema = buildSchema(`
 *   interface Node {
 *     id: ID!
 *   }
 *
 *   type User implements Node {
 *     id: ID!
 *   }
 *
 *   type Query {
 *     node: Node
 *   }
 * `);
 * const Node = assertInterfaceType(schema.getType('Node'));
 * const User = assertObjectType(schema.getType('User'));
 *
 * isTypeSubTypeOf(schema, User, Node); // => true
 * isTypeSubTypeOf(schema, new GraphQLNonNull(User), Node); // => true
 * isTypeSubTypeOf(schema, Node, User); // => false
 * ```
 */
export declare function isTypeSubTypeOf(
  schema: GraphQLSchema,
  maybeSubType: GraphQLType,
  superType: GraphQLType,
): boolean;
/**
 * Provided two composite types, determine if they "overlap". Two composite
 * types overlap when the Sets of possible concrete types for each intersect.
 *
 * This is often used to determine if a fragment of a given type could possibly
 * be visited in a context of another type.
 *
 * This function is commutative.
 * @param schema - GraphQL schema to use.
 * @param typeA - The first GraphQL type to compare.
 * @param typeB - The second GraphQL type to compare.
 * @returns True when the two composite types can apply to at least one common object type.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql/utilities';
 * import { assertObjectType, assertUnionType } from 'graphql/type';
 * import { doTypesOverlap } from 'graphql/utilities';
 *
 * const schema = buildSchema(`
 *   type Photo {
 *     url: String!
 *   }
 *
 *   type Video {
 *     url: String!
 *   }
 *
 *   union Media = Photo | Video
 *   union StillImage = Photo
 *
 *   type Query {
 *     media: [Media]
 *   }
 * `);
 * const Media = assertUnionType(schema.getType('Media'));
 * const StillImage = assertUnionType(schema.getType('StillImage'));
 * const Video = assertObjectType(schema.getType('Video'));
 *
 * doTypesOverlap(schema, Media, StillImage); // => true
 * doTypesOverlap(schema, StillImage, Video); // => false
 * ```
 */
export declare function doTypesOverlap(
  schema: GraphQLSchema,
  typeA: GraphQLCompositeType,
  typeB: GraphQLCompositeType,
): boolean;
