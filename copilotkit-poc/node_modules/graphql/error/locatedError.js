'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.locatedError = locatedError;

var _toError = require('../jsutils/toError.js');

var _GraphQLError = require('./GraphQLError.js');

/** @category Errors */

/**
 * Given an arbitrary value, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 * @param rawOriginalError - The original error value to wrap.
 * @param nodes - The AST nodes associated with the error.
 * @param path - The response path associated with the error.
 * @returns The GraphQL error.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { locatedError } from 'graphql/error';
 *
 * const document = parse('{ viewer { name } }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 * const error = locatedError(new Error('Resolver failed'), fieldNode, [
 *   'viewer',
 * ]);
 *
 * error.message; // => 'Resolver failed'
 * error.locations; // => [{ line: 1, column: 3 }]
 * error.path; // => ['viewer']
 * ```
 */
function locatedError(rawOriginalError, nodes, path) {
  var _nodes;

  const originalError = (0, _toError.toError)(rawOriginalError); // Note: this uses a brand-check to support GraphQL errors originating from other contexts.

  if (isLocatedGraphQLError(originalError)) {
    return originalError;
  }

  return new _GraphQLError.GraphQLError(originalError.message, {
    nodes:
      (_nodes = originalError.nodes) !== null && _nodes !== void 0
        ? _nodes
        : nodes,
    source: originalError.source,
    positions: originalError.positions,
    path,
    originalError,
  });
}

function isLocatedGraphQLError(error) {
  return Array.isArray(error.path);
}
