import { devAssert } from './jsutils/devAssert.mjs';
import { isPromise } from './jsutils/isPromise.mjs';
import { parse } from './language/parser.mjs';
import { validateSchema } from './type/validate.mjs';
import { validate } from './validation/validate.mjs';
import { execute } from './execution/execute.mjs';
/**
 * Describes the input object accepted by `graphql` and `graphqlSync`.
 *
 * These arguments describe the full parse, validate, and execute lifecycle for
 * a GraphQL request.
 * @category Request Pipeline
 */

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
export function graphql(args) {
  // Always return a Promise for a consistent API.
  return new Promise((resolve) => resolve(graphqlImpl(args)));
}
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

export function graphqlSync(args) {
  const result = graphqlImpl(args); // Assert that the execution was synchronous.

  if (isPromise(result)) {
    throw new Error('GraphQL execution failed to complete synchronously.');
  }

  return result;
}

function graphqlImpl(args) {
  // Temporary for v15 to v16 migration. Remove in v17
  arguments.length < 2 ||
    devAssert(
      false,
      'graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead.',
    );
  const {
    schema,
    source,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  } = args; // Validate Schema

  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length > 0) {
    return {
      errors: schemaValidationErrors,
    };
  } // Parse

  let document;

  try {
    document = parse(source);
  } catch (syntaxError) {
    return {
      errors: [syntaxError],
    };
  } // Validate

  const validationErrors = validate(schema, document);

  if (validationErrors.length > 0) {
    return {
      errors: validationErrors,
    };
  } // Execute

  return execute({
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  });
}
