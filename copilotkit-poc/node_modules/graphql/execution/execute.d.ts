/** @category Execution */
import type { Maybe } from '../jsutils/Maybe';
import type { ObjMap } from '../jsutils/ObjMap';
import type { Path } from '../jsutils/Path';
import type { PromiseOrValue } from '../jsutils/PromiseOrValue';
import type { GraphQLFormattedError } from '../error/GraphQLError';
import { GraphQLError } from '../error/GraphQLError';
import type {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from '../language/ast';
import type {
  GraphQLField,
  GraphQLFieldResolver,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLTypeResolver,
} from '../type/definition';
import type { GraphQLSchema } from '../type/schema';
/**
 * Terminology
 *
 * "Definitions" are the generic name for top-level statements in the document.
 * Examples of this include:
 * 1) Operations (such as a query)
 * 2) Fragments
 *
 * "Operations" are a generic name for requests in the document.
 * Examples of this include:
 * 1) query,
 * 2) mutation
 *
 * "Selections" are the definitions that can appear legally and at
 * single level of the query. These include:
 * 1) field references e.g `a`
 * 2) fragment "spreads" e.g. `...c`
 * 3) inline fragment "spreads" e.g. `...on Type { a }`
 */
/**
 * Data that must be available at all points during query execution.
 *
 * Namely, schema of the type system that is currently executing,
 * and the fragments defined in the query document
 *
 * @internal
 */
export interface ExecutionContext {
  schema: GraphQLSchema;
  fragments: ObjMap<FragmentDefinitionNode>;
  rootValue: unknown;
  contextValue: unknown;
  operation: OperationDefinitionNode;
  variableValues: {
    [variable: string]: unknown;
  };
  fieldResolver: GraphQLFieldResolver<any, any>;
  typeResolver: GraphQLTypeResolver<any, any>;
  subscribeFieldResolver: GraphQLFieldResolver<any, any>;
  collectedErrors: CollectedErrors;
}
declare class CollectedErrors {
  private _errorPositions;
  private _errors;
  constructor();
  get errors(): ReadonlyArray<GraphQLError>;
  add(error: GraphQLError, path: Path | undefined): void;
  private _hasNulledPosition;
}
/**
 * Represents the response produced by executing a GraphQL operation.
 * @typeParam TData - Shape of the execution data payload.
 * @typeParam TExtensions - Shape of the extensions payload.
 */
export interface ExecutionResult<
  TData = ObjMap<unknown>,
  TExtensions = ObjMap<unknown>,
> {
  /** Errors raised while parsing, validating, or executing the operation. */
  errors?: ReadonlyArray<GraphQLError>;
  /** Data returned by execution, or null when execution could not produce data. */
  data?: TData | null;
  /** Extension fields to include in the formatted result. */
  extensions?: TExtensions;
}
/**
 * A JSON-serializable GraphQL execution result.
 * @typeParam TData - Shape of the formatted data payload.
 * @typeParam TExtensions - Shape of the formatted extensions payload.
 */
export interface FormattedExecutionResult<
  TData = ObjMap<unknown>,
  TExtensions = ObjMap<unknown>,
> {
  /** Errors raised while parsing, validating, or executing the operation. */
  errors?: ReadonlyArray<GraphQLFormattedError>;
  /** Data returned by execution, or null when execution could not produce data. */
  data?: TData | null;
  /** Extension fields to include in the formatted result. */
  extensions?: TExtensions;
}
/** Arguments accepted by execute and executeSync. */
export interface ExecutionArgs {
  /** The schema used for validation or execution. */
  schema: GraphQLSchema;
  /** The parsed GraphQL document to execute. */
  document: DocumentNode;
  /** Initial root value passed to the operation. */
  rootValue?: unknown;
  /** Application context value passed to every resolver. */
  contextValue?: unknown;
  /** Runtime variable values keyed by variable name. */
  variableValues?: Maybe<{
    readonly [variable: string]: unknown;
  }>;
  /** Name of the operation to execute when the document contains multiple operations. */
  operationName?: Maybe<string>;
  /** Resolver used when a field does not define its own resolver. */
  fieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  /** Resolver used when an abstract type does not define its own resolver. */
  typeResolver?: Maybe<GraphQLTypeResolver<any, any>>;
  /** Resolver used for the root subscription field. */
  subscribeFieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  /** Additional execution options. */
  options?: {
    /** Set the maximum number of errors allowed for coercing (defaults to 50). */
    maxCoercionErrors?: number;
  };
}
/**
 * Implements the "Executing requests" section of the GraphQL specification.
 *
 * Returns either a synchronous ExecutionResult (if all encountered resolvers
 * are synchronous), or a Promise of an ExecutionResult that will eventually be
 * resolved and never rejected.
 *
 * If the arguments to this function do not result in a legal execution context,
 * a GraphQLError will be thrown immediately explaining the invalid input.
 *
 * Field errors are collected into the response instead of rejecting the
 * returned promise. Only the field that produced the error and its descendants
 * are omitted; sibling fields continue to execute. Errors from fields of
 * non-null type may propagate to the nearest nullable parent, which can be the
 * entire response data.
 * @param args - The arguments used to perform the operation.
 * @returns A completed execution result, or a promise resolving to one when execution is asynchronous.
 * @example
 * ```ts
 * // Execute an asynchronous operation with variables.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { execute } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting(name: String!): String
 *   }
 * `);
 *
 * const result = await execute({
 *   schema,
 *   document: parse('query ($name: String!) { greeting(name: $name) }'),
 *   rootValue: {
 *     greeting: ({ name }) => `Hello, ${name}!`,
 *   },
 *   variableValues: { name: 'Ada' },
 * });
 *
 * result; // => { data: { greeting: 'Hello, Ada!' } }
 * ```
 * @example
 * ```ts
 * // This variant supplies context plus custom field and type resolvers.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { execute } from 'graphql/execution';
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
 * const result = await execute({
 *   schema,
 *   document: parse('query Viewer { viewer { __typename name } }'),
 *   rootValue: { viewer: { kind: 'user', name: 'Ada' } },
 *   contextValue: { locale: 'en' },
 *   operationName: 'Viewer',
 *   fieldResolver: (source, _args, contextValue, info) => {
 *     contextValue.locale; // => 'en'
 *     return source[info.fieldName];
 *   },
 *   typeResolver: (value) => {
 *     return value.kind === 'user' ? 'User' : undefined;
 *   },
 * });
 *
 * result; // => { data: { viewer: { __typename: 'User', name: 'Ada' } } }
 * ```
 * @example
 * ```ts
 * // This variant shows how resolver errors become field errors in the result.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { execute } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     broken: String
 *   }
 * `);
 * const document = parse('{ broken }');
 *
 * const result = await execute({
 *   schema,
 *   document,
 *   rootValue: {
 *     broken: () => {
 *       throw new Error('Resolver failed.');
 *     },
 *   },
 * });
 *
 * result.data.broken; // => null
 * result.errors[0].message; // => 'Resolver failed.'
 * ```
 * @example
 * ```ts
 * // This variant limits how many variable coercion errors are reported.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { execute } from 'graphql/execution';
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
 *
 * const result = await execute({
 *   schema,
 *   document,
 *   variableValues: {
 *     first: { stars: 'bad' },
 *     second: { stars: 'also bad' },
 *   },
 *   options: { maxCoercionErrors: 1 },
 * });
 *
 * result.errors.length; // => 2
 * result.errors[1].message; // matches /error limit reached/
 * ```
 */
export declare function execute(
  args: ExecutionArgs,
): PromiseOrValue<ExecutionResult>;
/**
 * Also implements the "Executing requests" section of the GraphQL specification.
 * However, it guarantees to complete synchronously (or throw an error) assuming
 * that all field resolvers are also synchronous.
 * @param args - The arguments used to perform the operation.
 * @returns Completed execution output for a synchronous operation.
 * @example
 * ```ts
 * // Execute an operation synchronously when all resolvers are synchronous.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { executeSync } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 * const document = parse('{ greeting }');
 *
 * const result = executeSync({
 *   schema,
 *   document,
 *   rootValue: {
 *     greeting: 'Hello',
 *   },
 * });
 *
 * result; // => { data: { greeting: 'Hello' } }
 * ```
 * @example
 * ```ts
 * // This variant shows executeSync throwing when a resolver returns a promise.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { executeSync } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * executeSync({
 *   schema,
 *   document: parse('{ greeting }'),
 *   rootValue: {
 *     greeting: async () => 'Hello',
 *   },
 * }); // throws an error
 * ```
 */
export declare function executeSync(args: ExecutionArgs): ExecutionResult;
/**
 * Essential assertions before executing to provide developer feedback for
 * improper use of the GraphQL library. This deprecated internal helper will be
 * removed in v17; call `assertValidSchema()` and rely on TypeScript checks
 * instead.
 *
 * @deprecated will be removed in v17 in favor of assertValidSchema() and TS checks
 * @internal
 */
export declare function assertValidExecutionArguments(
  schema: GraphQLSchema,
  document: DocumentNode,
  rawVariableValues: Maybe<{
    readonly [variable: string]: unknown;
  }>,
): void;
/**
 * Constructs a ExecutionContext object from the arguments passed to
 * execute, which we will pass throughout the other execution methods.
 *
 * Throws a GraphQLError if a valid execution context cannot be created.
 *
 * @internal
 */
export declare function buildExecutionContext(
  args: ExecutionArgs,
): ReadonlyArray<GraphQLError> | ExecutionContext;
/** @internal */
export declare function buildResolveInfo(
  exeContext: ExecutionContext,
  fieldDef: GraphQLField<unknown, unknown>,
  fieldNodes: ReadonlyArray<FieldNode>,
  parentType: GraphQLObjectType,
  path: Path,
): GraphQLResolveInfo;
/**
 * If a resolveType function is not given, then a default resolve behavior is
 * used which attempts two strategies:
 *
 * First, See if the provided value has a `__typename` field defined, if so, use
 * that value as name of the resolved type.
 *
 * Otherwise, test each possible type for the abstract type by calling
 * isTypeOf for the object being coerced, returning the first type that matches.
 */
export declare const defaultTypeResolver: GraphQLTypeResolver<unknown, unknown>;
/**
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function while passing along args and context value.
 */
export declare const defaultFieldResolver: GraphQLFieldResolver<
  unknown,
  unknown
>;
/**
 * This method looks up the field on the given type definition.
 * It has special casing for the three introspection fields,
 * __schema, __type and __typename. __typename is special because
 * it can always be queried as a field, even in situations where no
 * other fields are allowed, like on a Union. __schema and __type
 * could get automatically added to the query type, but that would
 * require mutating type definitions, which would cause issues.
 *
 * @internal
 */
export declare function getFieldDef(
  schema: GraphQLSchema,
  parentType: GraphQLObjectType,
  fieldNode: FieldNode,
): Maybe<GraphQLField<unknown, unknown>>;
export {};
