/** @category Subscriptions */
import type { Maybe } from '../jsutils/Maybe';
import type { DocumentNode } from '../language/ast';
import type { GraphQLFieldResolver } from '../type/definition';
import type { GraphQLSchema } from '../type/schema';
import type { ExecutionArgs, ExecutionResult } from './execute';
/**
 * Implements the "Subscribe" algorithm described in the GraphQL specification.
 *
 * Returns a Promise that resolves to either an AsyncIterator (if successful)
 * or an ExecutionResult (error). The promise will be rejected if the schema or
 * other arguments to this function are invalid, or if the resolved event stream
 * is not an async iterable.
 *
 * If the client-provided arguments to this function do not result in a
 * compliant subscription, a GraphQL Response (ExecutionResult) with
 * descriptive errors and no data will be returned.
 *
 * If the source stream could not be created due to faulty subscription
 * resolver logic or underlying systems, the promise will resolve to a single
 * ExecutionResult containing `errors` and no `data`.
 *
 * If the operation succeeded, the promise resolves to an AsyncIterator, which
 * yields a stream of ExecutionResults representing the response stream.
 *
 * Each payload yielded by the source event stream is executed with the payload
 * as the root value. This maps the subscription source stream into the response
 * stream described by the GraphQL specification.
 *
 * Accepts an object with named arguments.
 * @param args - The arguments used to perform the operation.
 * @returns A source stream mapped to execution results, or an execution result
 * containing subscription errors.
 * @example
 * ```ts
 * // Use a same-named rootValue function to provide the source event stream.
 * import assert from 'node:assert';
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { subscribe } from 'graphql/execution';
 *
 * async function* greetings() {
 *   yield { greeting: 'Hello' };
 *   yield { greeting: 'Bonjour' };
 * }
 *
 * const schema = buildSchema(`
 *   type Query {
 *     noop: String
 *   }
 *
 *   type Subscription {
 *     greeting: String
 *   }
 * `);
 *
 * const result = await subscribe({
 *   schema,
 *   document: parse('subscription { greeting }'),
 *   rootValue: { greeting: () => greetings() },
 * });
 *
 * assert('next' in result);
 *
 * const firstPayload = await result.next();
 * firstPayload.value; // => { data: { greeting: 'Hello' } }
 * ```
 * @example
 * ```ts
 * // This variant supplies events through a custom subscribeFieldResolver.
 * import assert from 'node:assert';
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { subscribe } from 'graphql/execution';
 *
 * async function* defaultGreetings() {
 *   yield { greeting: 'Hello' };
 * }
 *
 * async function* frenchGreetings() {
 *   yield { greeting: 'Bonjour' };
 * }
 *
 * const schema = buildSchema(`
 *   type Query {
 *     noop: String
 *   }
 *
 *   type Subscription {
 *     greeting(locale: String): String
 *   }
 * `);
 *
 * const result = await subscribe({
 *   schema,
 *   document: parse(
 *     'subscription Greeting($locale: String) { greeting(locale: $locale) }',
 *   ),
 *   rootValue: {
 *     greeting: (args, contextValue) => {
 *       const locale = args.locale ?? contextValue.defaultLocale;
 *       return locale === 'fr' ? frenchGreetings() : defaultGreetings();
 *     },
 *   },
 *   contextValue: { defaultLocale: 'fr' },
 *   variableValues: { locale: 'fr' },
 *   operationName: 'Greeting',
 *   subscribeFieldResolver: (rootValue, args, contextValue, info) => {
 *     args.locale; // => 'fr'
 *     return rootValue[info.fieldName](args, contextValue);
 *   },
 * });
 *
 * assert('next' in result);
 *
 * const firstPayload = await result.next();
 * firstPayload.value; // => { data: { greeting: 'Bonjour' } }
 * ```
 * @example
 * ```ts
 * // This variant shows the error result when the schema has no subscription root.
 * import assert from 'node:assert';
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { subscribe } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     noop: String
 *   }
 * `);
 *
 * const result = await subscribe({
 *   schema,
 *   document: parse('subscription { greeting }'),
 * });
 *
 * assert('errors' in result);
 *
 * result.errors[0].message; // => 'Schema is not configured to execute subscription operation.'
 * ```
 */
export declare function subscribe(
  args: ExecutionArgs,
): Promise<AsyncGenerator<ExecutionResult, void, void> | ExecutionResult>;
/**
 * Implements the "CreateSourceEventStream" algorithm described in the
 * GraphQL specification, resolving the subscription source event stream.
 *
 * Returns a Promise that resolves to either an AsyncIterable (if successful)
 * or an ExecutionResult (error). The promise will be rejected if the schema or
 * other arguments to this function are invalid, or if the resolved event stream
 * is not an async iterable.
 *
 * If the client-provided arguments to this function do not result in a
 * compliant subscription, a GraphQL Response (ExecutionResult) with
 * descriptive errors and no data will be returned.
 *
 * If the source stream could not be created due to faulty subscription
 * resolver logic or underlying systems, the promise will resolve to a single
 * ExecutionResult containing `errors` and no `data`.
 *
 * If the operation succeeded, the promise resolves to the AsyncIterable for the
 * event stream returned by the resolver.
 *
 * A Source Event Stream represents a sequence of events, each of which triggers
 * a GraphQL execution for that event.
 *
 * This may be useful when hosting the stateful subscription service in a
 * different process or machine than the stateless GraphQL execution engine,
 * or otherwise separating these two steps. For more on this, see the
 * "Supporting Subscriptions at Scale" information in the GraphQL specification.
 * @param args - The arguments used to perform the operation.
 * @returns The source event stream, or an execution result containing subscription errors.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { createSourceEventStream } from 'graphql/execution';
 *
 * async function* greetings() {
 *   yield { greeting: 'Hello' };
 * }
 *
 * const schema = buildSchema(`
 *   type Query {
 *     noop: String
 *   }
 *
 *   type Subscription {
 *     greeting: String
 *   }
 * `);
 *
 * const stream = await createSourceEventStream({
 *   schema,
 *   document: parse('subscription { greeting }'),
 *   rootValue: { greeting: () => greetings() },
 * });
 *
 * Symbol.asyncIterator in stream; // => true
 * ```
 */
export declare function createSourceEventStream(
  args: ExecutionArgs,
): Promise<AsyncIterable<unknown> | ExecutionResult>;
/**
 * Creates the source event stream for a subscription operation using the legacy
 * positional argument overload. This deprecated overload will be removed in the
 * next major version; use the args object overload instead.
 * @param schema - GraphQL schema to use.
 * @param document - The parsed GraphQL document containing the subscription
 * operation.
 * @param rootValue - Initial root value passed to the subscription resolver.
 * @param contextValue - Application context value passed to resolvers.
 * @param variableValues - Runtime variable values keyed by variable name.
 * @param operationName - Name of the subscription operation to execute when
 * the document contains multiple operations.
 * @param subscribeFieldResolver - Resolver used for the root subscription
 * field.
 * @returns The source event stream, or an execution result containing
 * subscription errors.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { createSourceEventStream } from 'graphql/execution';
 *
 * async function* greetings() {
 *   yield { greeting: 'Hello' };
 * }
 *
 * const schema = buildSchema(`
 *   type Query {
 *     noop: String
 *   }
 *
 *   type Subscription {
 *     greeting: String
 *   }
 * `);
 * const document = parse('subscription { greeting }');
 *
 * const stream = await createSourceEventStream(schema, document, {
 *   greeting: () => greetings(),
 * });
 *
 * Symbol.asyncIterator in stream; // => true
 * ```
 * @deprecated Will be removed in next major version in favor of named arguments.
 */
export declare function createSourceEventStream(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: unknown,
  contextValue?: unknown,
  variableValues?: Maybe<{
    readonly [variable: string]: unknown;
  }>,
  operationName?: Maybe<string>,
  subscribeFieldResolver?: Maybe<GraphQLFieldResolver<any, any>>,
): Promise<AsyncIterable<unknown> | ExecutionResult>;
