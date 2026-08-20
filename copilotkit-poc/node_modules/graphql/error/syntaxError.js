'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.syntaxError = syntaxError;

var _GraphQLError = require('./GraphQLError.js');

/** @category Errors */

/**
 * Produces a GraphQLError representing a syntax error, containing useful
 * descriptive information about the syntax error's position in the source.
 * @param source - The GraphQL source containing the syntax error.
 * @param position - Character offset where the syntax error was encountered.
 * @param description - Human-readable description of the syntax error.
 * @returns A GraphQLError located at the syntax error position.
 * @example
 * ```ts
 * import { Source } from 'graphql/language';
 * import { syntaxError } from 'graphql/error';
 *
 * const error = syntaxError(new Source('query {'), 7, 'Expected Name');
 *
 * error.message; // => 'Syntax Error: Expected Name'
 * error.locations; // => [{ line: 1, column: 8 }]
 * ```
 */
function syntaxError(source, position, description) {
  return new _GraphQLError.GraphQLError(`Syntax Error: ${description}`, {
    source,
    positions: [position],
  });
}
