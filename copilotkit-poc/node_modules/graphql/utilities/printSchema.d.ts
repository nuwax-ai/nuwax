/** @category Schema Printing */
import type { GraphQLNamedType } from '../type/definition';
import type { GraphQLSchema } from '../type/schema';
/**
 * Prints the schema.
 * @param schema - GraphQL schema to use.
 * @returns The printed string representation.
 * @example
 * ```ts
 * import { buildSchema, printSchema } from 'graphql/utilities';
 *
 * const schema = buildSchema(`
 *   directive @upper on FIELD_DEFINITION
 *
 *   type Query {
 *     greeting: String @upper
 *   }
 * `);
 *
 * printSchema(schema); // => ['directive @upper on FIELD_DEFINITION', '', 'type Query {', '  greeting: String', '}'].join('\n')
 * ```
 */
export declare function printSchema(schema: GraphQLSchema): string;
/**
 * Prints the introspection schema.
 * @param schema - GraphQL schema to use.
 * @returns The printed string representation.
 * @example
 * ```ts
 * import { buildSchema, printIntrospectionSchema } from 'graphql/utilities';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * const printed = printIntrospectionSchema(schema);
 *
 * printed; // matches /type __Schema/
 * printed; // matches /enum __TypeKind/
 * printed; // does not match /type Query/
 * ```
 */
export declare function printIntrospectionSchema(schema: GraphQLSchema): string;
/**
 * Prints the type.
 * @param type - The GraphQL type to inspect.
 * @returns The printed string representation.
 * @example
 * ```ts
 * import { buildSchema, printType } from 'graphql/utilities';
 *
 * const schema = buildSchema(`
 *   type User {
 *     id: ID!
 *     name: String
 *   }
 *
 *   type Query {
 *     viewer: User
 *   }
 * `);
 *
 * printType(schema.getType('User')); // => ['type User {', '  id: ID!', '  name: String', '}'].join('\n')
 * ```
 */
export declare function printType(type: GraphQLNamedType): string;
