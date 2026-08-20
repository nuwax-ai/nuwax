import type { Maybe } from './jsutils/Maybe';
import type { Source } from './language/source';
import type {
  GraphQLFieldResolver,
  GraphQLTypeResolver,
} from './type/definition';
import type { GraphQLSchema } from './type/schema';
import type { ExecutionResult } from './execution/execute';
/**
 * Describes the input object accepted by `graphql` and `graphqlSync`.
 *
 * These arguments describe the full parse, validate, and execute lifecycle for
 * a GraphQL request.
 * @category Request Pipeline
 */
export interface GraphQLArgs {
  /** The GraphQL type system to use when validating and executing a query. */
  schema: GraphQLSchema;
  /**
   * A GraphQL language-formatted string or source object representing the
   * requested operation.
   */
  source: string | Source;
  /**
   * The value provided as the first argument to resolver functions on the top
   * level type, such as the query object type.
   */
  rootValue?: unknown;
  /**
   * Application context value passed to every resolver.
   *
   * Use this for shared request data such as the currently logged in user and
   * connections to databases or other services.
   */
  contextValue?: unknown;
  /** A mapping of variable name to runtime value for variables defined by the operation. */
  variableValues?: Maybe<{
    readonly [variable: string]: unknown;
  }>;
  /**
   * The operation to execute when the source contains multiple possible
   * operations. This can be omitted when the source contains only one operation.
   */
  operationName?: Maybe<string>;
  /**
   * A resolver function to use when one is not provided by the schema.
   *
   * If not provided, the default field resolver is used, which looks for a value
   * or method on the source value with the field's name.
   */
  fieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  /**
   * A type resolver function to use when none is provided by the schema.
   *
   * If not provided, the default type resolver is used, which looks for a
   * `__typename` field or alternatively calls the `isTypeOf` method.
   */
  typeResolver?: Maybe<GraphQLTypeResolver<any, any>>;
}
/**
 * Parses, validates, and executes a GraphQL document against a schema.
 *
 * This is the primary entry point for fulfilling GraphQL operations. Use this
 * when you want a single-call request lifecycle that returns a promise in all
 * cases.
 *
 * More sophisticated GraphQL servers, such as those which persist queries, may
 * wish to separate the validation and execution phases to a static-time tooling
 * step and a server runtime step.
 * @param args - Request execution arguments, including schema and source.
 * @returns A promise that resolves to an execution result or validation errors.
 * @example
 * ```ts
 * // Execute a complete asynchronous request with variables.
 * import { graphql, buildSchema } from 'graphql';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting(name: String!): String
 *   }
 * `);
 *
 * const result = await graphql({
 *   schema,
 *   source: 'query SayHello($name: String!) { greeting(name: $name) }',
 *   rootValue: {
 *     greeting: ({ name }) => `Hello, ${name}!`,
 *   },
 *   variableValues: { name: 'Ada' },
 *   operationName: 'SayHello',
 * });
 *
 * result; // => { data: { greeting: 'Hello, Ada!' } }
 * ```
 * @example
 * ```ts
 * // This variant supplies context plus custom field and type resolvers.
 * import { graphql, buildSchema } from 'graphql';
 *
 * const schema = buildSchema(`
 *   interface Named {
 *     name: String!
 *   }
 *
 *   type User implements Named {
 *     name: String!
 *   }
 *
 *   type Query {
 *     viewer: Named
 *   }
 * `);
 *
 * const result = await graphql({
 *   schema,
 *   source: '{ viewer { __typename name } }',
 *   rootValue: { viewer: { kind: 'user', name: 'Ada' } },
 *   contextValue: { locale: 'en' },
 *   fieldResolver: (source, _args, context, info) => {
 *     context.locale; // => 'en'
 *     return source[info.fieldName];
 *   },
 *   typeResolver: (value) => {
 *     return value.kind === 'user' ? 'User' : undefined;
 *   },
 * });
 *
 * result; // => { data: { viewer: { __typename: 'User', name: 'Ada' } } }
 * ```
 * @category Request Pipeline
 */
export declare function graphql(args: GraphQLArgs): Promise<ExecutionResult>;
/**
 * Parses, validates, and executes a GraphQL document synchronously.
 *
 * This function guarantees that execution completes synchronously, or throws an
 * error, assuming that all field resolvers are also synchronous. It throws when
 * any resolver returns a promise.
 * @param args - Request execution arguments, including schema and source.
 * @returns Completed execution output, or request errors if parsing or
 * validation fails.
 * @example
 * ```ts
 * // Execute a complete synchronous request with variables.
 * import { graphqlSync, buildSchema } from 'graphql';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting(name: String!): String
 *   }
 * `);
 *
 * const result = graphqlSync({
 *   schema,
 *   source: 'query SayHello($name: String!) { greeting(name: $name) }',
 *   rootValue: {
 *     greeting: ({ name }) => `Hello, ${name}!`,
 *   },
 *   variableValues: { name: 'Ada' },
 *   operationName: 'SayHello',
 * });
 *
 * result; // => { data: { greeting: 'Hello, Ada!' } }
 * ```
 * @example
 * ```ts
 * // This variant uses a synchronous custom field resolver and context.
 * import { graphqlSync, buildSchema } from 'graphql';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * const result = graphqlSync({
 *   schema,
 *   source: '{ greeting }',
 *   fieldResolver: (_source, _args, contextValue) => {
 *     return contextValue.defaultGreeting;
 *   },
 *   contextValue: { defaultGreeting: 'Hello' },
 * });
 *
 * result; // => { data: { greeting: 'Hello' } }
 * ```
 * @category Request Pipeline
 */
export declare function graphqlSync(args: GraphQLArgs): ExecutionResult;
