/** @category Operations */
import type {
  OperationDefinitionNode,
  OperationTypeDefinitionNode,
} from '../language/ast';
import type { GraphQLObjectType } from '../type/definition';
import type { GraphQLSchema } from '../type/schema';
/**
 * Extracts the root type of the operation from the schema. This deprecated
 * helper is retained for backwards compatibility; call
 * `GraphQLSchema.getRootType` instead because getOperationRootType will be
 * removed in v17.
 * @param schema - GraphQL schema to use.
 * @param operation - The operation definition to inspect.
 * @returns The resolved operation root type.
 * @example
 * ```ts
 * import { buildSchema, getOperationRootType } from 'graphql/utilities';
 * import { parse } from 'graphql/language';
 *
 * const schema = buildSchema('type Query { name: String }');
 * const operation = parse('{ name }').definitions[0];
 * const rootType = getOperationRootType(schema, operation);
 *
 * rootType.name; // => 'Query'
 * ```
 * @deprecated Please use `GraphQLSchema.getRootType` instead. Will be removed in v17
 */
export declare function getOperationRootType(
  schema: GraphQLSchema,
  operation: OperationDefinitionNode | OperationTypeDefinitionNode,
): GraphQLObjectType;
