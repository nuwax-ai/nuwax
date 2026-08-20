/** @category Values */
import type { Maybe } from '../jsutils/Maybe';
import type { ObjMap } from '../jsutils/ObjMap';
import { GraphQLError } from '../error/GraphQLError';
import type {
  DirectiveNode,
  FieldNode,
  VariableDefinitionNode,
} from '../language/ast';
import type { GraphQLField } from '../type/definition';
import type { GraphQLDirective } from '../type/directives';
import type { GraphQLSchema } from '../type/schema';
declare type CoercedVariableValues =
  | {
      errors: ReadonlyArray<GraphQLError>;
      coerced?: never;
    }
  | {
      coerced: {
        [variable: string]: unknown;
      };
      errors?: never;
    };
/**
 * Options used when coercing variable values before execution.
 * @internal
 */
export interface GetVariableValuesOptions {
  /**
   * Maximum number of variable coercion errors before coercion stops.
   * @internal
   */
  maxErrors?: number;
}
/**
 * Prepares an object map of variableValues of the correct type based on the
 * provided variable definitions and arbitrary input. If the input cannot be
 * parsed to match the variable definitions, GraphQLError values are returned.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param schema - GraphQL schema to use.
 * @param varDefNodes - The variable definition AST nodes to coerce.
 * @param inputs - The runtime variable values keyed by variable name.
 * @param options - Optional variable coercion options, including error limits.
 * @returns Coerced variable values, or request errors.
 * @example
 * ```ts
 * // Coerce provided variables and apply operation defaults.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getVariableValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!, limit: Int = 10): [String]
 *   }
 * `);
 * const document = parse(`
 *   query ($stars: Int!, $limit: Int = 10) {
 *     reviews(stars: $stars, limit: $limit)
 *   }
 * `);
 * const operation = document.definitions[0];
 *
 * const result = getVariableValues(
 *   schema,
 *   operation.variableDefinitions,
 *   { stars: '5' },
 * );
 *
 * result; // => { coerced: { stars: 5, limit: 10 } }
 * ```
 * @example
 * ```ts
 * // This variant uses maxErrors to cap reported coercion errors.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getVariableValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   input ReviewInput {
 *     stars: Int!
 *   }
 *
 *   type Query {
 *     review(input: ReviewInput!): String
 *   }
 * `);
 * const document = parse(`
 *   query ($first: ReviewInput!, $second: ReviewInput!) {
 *     first: review(input: $first)
 *     second: review(input: $second)
 *   }
 * `);
 * const operation = document.definitions[0];
 *
 * const result = getVariableValues(
 *   schema,
 *   operation.variableDefinitions,
 *   { first: { stars: 'bad' }, second: { stars: 'also bad' } },
 *   { maxErrors: 1 },
 * );
 *
 * result.errors.length; // => 2
 * result.errors[1].message; // matches /error limit reached/
 * ```
 */
export declare function getVariableValues(
  schema: GraphQLSchema,
  varDefNodes: ReadonlyArray<VariableDefinitionNode>,
  inputs: {
    readonly [variable: string]: unknown;
  },
  options?: GetVariableValuesOptions,
): CoercedVariableValues;
/**
 * Prepares an object map of argument values given a list of argument
 * definitions and list of argument AST nodes.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param def - The field or directive definition whose arguments should be coerced.
 * @param node - The AST node to inspect.
 * @param variableValues - The runtime variable values keyed by variable name.
 * @returns Coerced argument values keyed by argument name.
 * @example
 * ```ts
 * // Read literal argument values and defaults.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getArgumentValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!, limit: Int = 10): [String]
 *   }
 * `);
 * const fieldDef = schema.getQueryType().getFields().reviews;
 * const document = parse('{ reviews(stars: 5) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getArgumentValues(fieldDef, fieldNode); // => { stars: 5, limit: 10 }
 * ```
 * @example
 * ```ts
 * // This variant resolves argument values from operation variables.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getArgumentValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!): [String]
 *   }
 * `);
 * const fieldDef = schema.getQueryType().getFields().reviews;
 * const document = parse('query ($stars: Int!) { reviews(stars: $stars) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getArgumentValues(fieldDef, fieldNode, { stars: 5 }); // => { stars: 5 }
 * getArgumentValues(fieldDef, fieldNode, {}); // throws an error
 * ```
 */
export declare function getArgumentValues(
  def: GraphQLField<unknown, unknown> | GraphQLDirective,
  node: FieldNode | DirectiveNode,
  variableValues?: Maybe<ObjMap<unknown>>,
): {
  [argument: string]: unknown;
};
/**
 * AST node shape accepted by getDirectiveValues.
 * @internal
 */
export interface DirectiveValuesNode {
  /**
   * Directives attached to the AST node.
   * @internal
   */
  readonly directives?: ReadonlyArray<DirectiveNode>;
}
/**
 * Prepares an object map of argument values given a directive definition
 * and a AST node which may contain directives. Optionally also accepts a map
 * of variable values.
 *
 * If the directive does not exist on the node, returns undefined.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param directiveDef - The directive definition whose arguments should be coerced.
 * @param node - The AST node to inspect.
 * @param variableValues - The runtime variable values keyed by variable name.
 * @returns Coerced directive argument values keyed by argument name.
 * @example
 * ```ts
 * // Read literal directive arguments from a node.
 * import { parse } from 'graphql/language';
 * import { GraphQLSkipDirective } from 'graphql/type';
 * import { getDirectiveValues } from 'graphql/execution';
 *
 * const document = parse('{ name @skip(if: true) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getDirectiveValues(GraphQLSkipDirective, fieldNode); // => { if: true }
 * ```
 * @example
 * ```ts
 * // This variant resolves directive arguments from variables and handles absent directives.
 * import { parse } from 'graphql/language';
 * import { GraphQLIncludeDirective } from 'graphql/type';
 * import { getDirectiveValues } from 'graphql/execution';
 *
 * const document = parse('query ($includeName: Boolean!) { name @include(if: $includeName) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getDirectiveValues(GraphQLIncludeDirective, fieldNode, {
 *   includeName: false,
 * }); // => { if: false }
 * getDirectiveValues(GraphQLIncludeDirective, { directives: [] }); // => undefined
 * ```
 */
export declare function getDirectiveValues(
  directiveDef: GraphQLDirective,
  node: DirectiveValuesNode,
  variableValues?: Maybe<ObjMap<unknown>>,
):
  | undefined
  | {
      [argument: string]: unknown;
    };
export {};
