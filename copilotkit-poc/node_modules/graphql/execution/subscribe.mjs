/** @category Subscriptions */
import { devAssert } from '../jsutils/devAssert.mjs';
import { inspect } from '../jsutils/inspect.mjs';
import { isAsyncIterable } from '../jsutils/isAsyncIterable.mjs';
import { addPath, pathToArray } from '../jsutils/Path.mjs';
import { GraphQLError } from '../error/GraphQLError.mjs';
import { locatedError } from '../error/locatedError.mjs';
import { collectFields } from './collectFields.mjs';
import {
  // eslint-disable-next-line import/no-deprecated
  assertValidExecutionArguments,
  buildExecutionContext,
  buildResolveInfo,
  execute,
  getFieldDef,
} from './execute.mjs';
import { mapAsyncIterator } from './mapAsyncIterator.mjs';
import { getArgumentValues } from './values.mjs';
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

export async function subscribe(args) {
  // Temporary for v15 to v16 migration. Remove in v17
  arguments.length < 2 ||
    devAssert(
      false,
      'graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead.',
    );
  const resultOrStream = await createSourceEventStream(args);

  if (!isAsyncIterable(resultOrStream)) {
    return resultOrStream;
  }

  const mapSourceToResponse = (payload) =>
    execute({ ...args, rootValue: payload });

  return mapAsyncIterator(resultOrStream, mapSourceToResponse);
}

function toNormalizedArgs(args) {
  const firstArg = args[0];

  if (firstArg && 'document' in firstArg) {
    return firstArg;
  }

  return {
    schema: firstArg,
    // FIXME: when underlying TS bug fixed, see https://github.com/microsoft/TypeScript/issues/31613
    document: args[1],
    rootValue: args[2],
    contextValue: args[3],
    variableValues: args[4],
    operationName: args[5],
    subscribeFieldResolver: args[6],
  };
}
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

/** @internal */
export async function createSourceEventStream(...rawArgs) {
  const args = toNormalizedArgs(rawArgs);
  const { schema, document, variableValues } = args; // If arguments are missing or incorrectly typed, this is an internal
  // developer mistake which should throw an early error.
  // eslint-disable-next-line import/no-deprecated

  assertValidExecutionArguments(schema, document, variableValues); // If a valid execution context cannot be created due to incorrect arguments,
  // a "Response" with only errors is returned.

  const exeContext = buildExecutionContext(args); // Return early errors if execution context failed.

  if (!('schema' in exeContext)) {
    return {
      errors: exeContext,
    };
  }

  try {
    const eventStream = await executeSubscription(exeContext); // Assert field returned an event stream, otherwise yield an error.

    if (!isAsyncIterable(eventStream)) {
      throw new Error(
        'Subscription field must return Async Iterable. ' +
          `Received: ${inspect(eventStream)}.`,
      );
    }

    return eventStream;
  } catch (error) {
    // If it GraphQLError, report it as an ExecutionResult, containing only errors and no data.
    // Otherwise treat the error as a system-class error and re-throw it.
    if (error instanceof GraphQLError) {
      return {
        errors: [error],
      };
    }

    throw error;
  }
}

async function executeSubscription(exeContext) {
  const { schema, fragments, operation, variableValues, rootValue } =
    exeContext;
  const rootType = schema.getSubscriptionType();

  if (rootType == null) {
    throw new GraphQLError(
      'Schema is not configured to execute subscription operation.',
      {
        nodes: operation,
      },
    );
  }

  const rootFields = collectFields(
    schema,
    fragments,
    variableValues,
    rootType,
    operation.selectionSet,
  );
  const [responseName, fieldNodes] = [...rootFields.entries()][0];
  const fieldDef = getFieldDef(schema, rootType, fieldNodes[0]);

  if (!fieldDef) {
    const fieldName = fieldNodes[0].name.value;
    throw new GraphQLError(
      `The subscription field "${fieldName}" is not defined.`,
      {
        nodes: fieldNodes,
      },
    );
  }

  const path = addPath(undefined, responseName, rootType.name);
  const info = buildResolveInfo(
    exeContext,
    fieldDef,
    fieldNodes,
    rootType,
    path,
  );

  try {
    var _fieldDef$subscribe;

    // Implements the "ResolveFieldEventStream" algorithm from GraphQL specification.
    // It differs from "ResolveFieldValue" due to providing a different `resolveFn`.
    // Build a JS object of arguments from the field.arguments AST, using the
    // variables scope to fulfill any variable references.
    const args = getArgumentValues(fieldDef, fieldNodes[0], variableValues); // The resolve function's optional third argument is a context value that
    // is provided to every resolve function within an execution. It is commonly
    // used to represent an authenticated user, or request-specific caches.

    const contextValue = exeContext.contextValue; // Call the `subscribe()` resolver or the default resolver to produce an
    // AsyncIterable yielding raw payloads.

    const resolveFn =
      (_fieldDef$subscribe = fieldDef.subscribe) !== null &&
      _fieldDef$subscribe !== void 0
        ? _fieldDef$subscribe
        : exeContext.subscribeFieldResolver;
    const eventStream = await resolveFn(rootValue, args, contextValue, info);

    if (eventStream instanceof Error) {
      throw eventStream;
    }

    return eventStream;
  } catch (error) {
    throw locatedError(error, fieldNodes, pathToArray(path));
  }
}
