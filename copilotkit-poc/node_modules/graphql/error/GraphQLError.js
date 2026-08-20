'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.GraphQLError = void 0;
exports.formatError = formatError;
exports.printError = printError;

var _isObjectLike = require('../jsutils/isObjectLike.js');

var _location = require('../language/location.js');

var _printLocation = require('../language/printLocation.js');

/** @category Errors */
function toNormalizedOptions(args) {
  const firstArg = args[0];

  if (firstArg == null || 'kind' in firstArg || 'length' in firstArg) {
    return {
      nodes: firstArg,
      source: args[1],
      positions: args[2],
      path: args[3],
      originalError: args[4],
      extensions: args[5],
    };
  }

  return firstArg;
}
/**
 * A GraphQLError describes an Error found during the parse, validate, or
 * execute phases of performing a GraphQL operation. In addition to a message
 * and stack trace, it also includes information about the locations in a
 * GraphQL document and/or execution result that correspond to the Error.
 */

class GraphQLError extends Error {
  /**
   * An array of `{ line, column }` locations within the source GraphQL document
   * which correspond to this error.
   *
   * Errors during validation often contain multiple locations, for example to
   * point out two things with the same name. Errors during execution include a
   * single location, the field which produced the error.
   *
   * Enumerable, and appears in the result of JSON.stringify().
   */

  /**
   * An array describing the JSON-path into the execution response which
   * corresponds to this error. Only included for errors during execution.
   *
   * Enumerable, and appears in the result of JSON.stringify().
   */

  /** An array of GraphQL AST Nodes corresponding to this error. */

  /**
   * The source GraphQL document for the first location of this error.
   *
   * Note that if this Error represents more than one node, the source may not
   * represent nodes after the first node.
   */

  /**
   * An array of character offsets within the source GraphQL document
   * which correspond to this error.
   */

  /** Original error that caused this GraphQLError, if one exists. */

  /** Extension fields to add to the formatted error. */

  /**
   * Creates a GraphQLError instance.
   * @param message - Human-readable error message.
   * @param options - Error metadata such as source locations, response path, original error, and extensions.
   * This positional-arguments constructor overload is deprecated. Use the
   * `GraphQLError(message, options)` overload instead.
   * @example
   * ```ts
   * // Create an error from AST nodes and response metadata.
   * import { parse } from 'graphql/language';
   * import { GraphQLError } from 'graphql/error';
   *
   * const document = parse('{ greeting }');
   * const fieldNode = document.definitions[0].selectionSet.selections[0];
   * const error = new GraphQLError('Cannot query this field.', {
   *   nodes: fieldNode,
   *   path: ['greeting'],
   *   extensions: { code: 'FORBIDDEN' },
   * });
   *
   * error.message; // => 'Cannot query this field.'
   * error.locations; // => [{ line: 1, column: 3 }]
   * error.path; // => ['greeting']
   * error.extensions; // => { code: 'FORBIDDEN' }
   * ```
   * @example
   * ```ts
   * // This variant derives locations from source positions and preserves the original error.
   * import { Source } from 'graphql/language';
   * import { GraphQLError } from 'graphql/error';
   *
   * const source = new Source('{ greeting }');
   * const originalError = new Error('Database unavailable.');
   * const error = new GraphQLError('Resolver failed.', {
   *   source,
   *   positions: [2],
   *   path: ['greeting'],
   *   originalError,
   * });
   *
   * error.locations; // => [{ line: 1, column: 3 }]
   * error.path; // => ['greeting']
   * error.originalError; // => originalError
   * ```
   */

  /**
   * Creates a GraphQLError instance using the legacy positional constructor.
   * This deprecated overload will be removed in v17. Prefer the
   * `GraphQLErrorOptions` object overload, which keeps optional error metadata
   * in a single options bag.
   * @param message - Human-readable error message.
   * @param nodes - AST node or nodes associated with this error.
   * @param source - Source document used to derive error locations.
   * @param positions - Character offsets in the source document associated with
   * this error.
   * @param path - Response path where this error occurred during execution.
   * @param originalError - Original error that caused this GraphQLError, if one
   * exists.
   * @param extensions - Extension fields to include in the formatted error.
   * @example
   * ```ts
   * import { Source } from 'graphql/language';
   * import { GraphQLError } from 'graphql/error';
   *
   * const source = new Source('{ greeting }');
   * const originalError = new Error('Database unavailable.');
   * const error = new GraphQLError(
   *   'Resolver failed.',
   *   undefined,
   *   source,
   *   [2],
   *   ['greeting'],
   *   originalError,
   *   { code: 'INTERNAL' },
   * );
   *
   * error.locations; // => [{ line: 1, column: 3 }]
   * error.path; // => ['greeting']
   * error.originalError; // => originalError
   * error.extensions; // => { code: 'INTERNAL' }
   * ```
   * @deprecated Please use the `GraphQLErrorOptions` constructor overload instead.
   */
  constructor(message, ...rawArgs) {
    var _this$nodes, _nodeLocations$, _ref;

    const { nodes, source, positions, path, originalError, extensions } =
      toNormalizedOptions(rawArgs);
    super(message);
    this.name = 'GraphQLError';
    this.path = path !== null && path !== void 0 ? path : undefined;
    this.originalError =
      originalError !== null && originalError !== void 0
        ? originalError
        : undefined; // Compute list of blame nodes.

    this.nodes = undefinedIfEmpty(
      Array.isArray(nodes) ? nodes : nodes ? [nodes] : undefined,
    );
    const nodeLocations = undefinedIfEmpty(
      (_this$nodes = this.nodes) === null || _this$nodes === void 0
        ? void 0
        : _this$nodes.map((node) => node.loc).filter((loc) => loc != null),
    ); // Compute locations in the source for the given nodes/positions.

    this.source =
      source !== null && source !== void 0
        ? source
        : nodeLocations === null || nodeLocations === void 0
        ? void 0
        : (_nodeLocations$ = nodeLocations[0]) === null ||
          _nodeLocations$ === void 0
        ? void 0
        : _nodeLocations$.source;
    this.positions =
      positions !== null && positions !== void 0
        ? positions
        : nodeLocations === null || nodeLocations === void 0
        ? void 0
        : nodeLocations.map((loc) => loc.start);
    this.locations =
      positions && source
        ? positions.map((pos) => (0, _location.getLocation)(source, pos))
        : nodeLocations === null || nodeLocations === void 0
        ? void 0
        : nodeLocations.map((loc) =>
            (0, _location.getLocation)(loc.source, loc.start),
          );
    const originalExtensions = (0, _isObjectLike.isObjectLike)(
      originalError === null || originalError === void 0
        ? void 0
        : originalError.extensions,
    )
      ? originalError === null || originalError === void 0
        ? void 0
        : originalError.extensions
      : undefined;
    this.extensions =
      (_ref =
        extensions !== null && extensions !== void 0
          ? extensions
          : originalExtensions) !== null && _ref !== void 0
        ? _ref
        : Object.create(null); // Only properties prescribed by the spec should be enumerable.
    // Keep the rest as non-enumerable.

    Object.defineProperties(this, {
      message: {
        writable: true,
        enumerable: true,
      },
      name: {
        enumerable: false,
      },
      nodes: {
        enumerable: false,
      },
      source: {
        enumerable: false,
      },
      positions: {
        enumerable: false,
      },
      originalError: {
        enumerable: false,
      },
    }); // Include (non-enumerable) stack trace.

    /* c8 ignore start */
    // FIXME: https://github.com/graphql/graphql-js/issues/2317

    if (
      originalError !== null &&
      originalError !== void 0 &&
      originalError.stack
    ) {
      Object.defineProperty(this, 'stack', {
        value: originalError.stack,
        writable: true,
        configurable: true,
      });
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    } else {
      Object.defineProperty(this, 'stack', {
        value: Error().stack,
        writable: true,
        configurable: true,
      });
    }
    /* c8 ignore stop */
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'GraphQLError';
  }
  /**
   * Returns this error as a human-readable message with source locations.
   * @returns The formatted error string.
   * @example
   * ```ts
   * import { Source } from 'graphql/language';
   * import { GraphQLError } from 'graphql/error';
   *
   * const error = new GraphQLError('Cannot query field "name".', {
   *   source: new Source('{ name }'),
   *   positions: [2],
   * });
   *
   * error.toString(); // => 'Cannot query field "name".\n\nGraphQL request:1:3\n1 | { name }\n  |   ^'
   * ```
   */

  toString() {
    let output = this.message;

    if (this.nodes) {
      for (const node of this.nodes) {
        if (node.loc) {
          output += '\n\n' + (0, _printLocation.printLocation)(node.loc);
        }
      }
    } else if (this.source && this.locations) {
      for (const location of this.locations) {
        output +=
          '\n\n' +
          (0, _printLocation.printSourceLocation)(this.source, location);
      }
    }

    return output;
  }
  /**
   * Returns the JSON representation used when this object is serialized.
   * @returns The JSON-serializable representation.
   * @example
   * ```ts
   * import { GraphQLError } from 'graphql/error';
   *
   * const error = new GraphQLError('Resolver failed.', {
   *   path: ['viewer', 'name'],
   *   extensions: { code: 'INTERNAL' },
   * });
   *
   * error.toJSON(); // => { message: 'Resolver failed.', path: ['viewer', 'name'], extensions: { code: 'INTERNAL' } }
   * ```
   */

  toJSON() {
    const formattedError = {
      message: this.message,
    };

    if (this.locations != null) {
      formattedError.locations = this.locations;
    }

    if (this.path != null) {
      formattedError.path = this.path;
    }

    if (this.extensions != null && Object.keys(this.extensions).length > 0) {
      formattedError.extensions = this.extensions;
    }

    return formattedError;
  }
}

exports.GraphQLError = GraphQLError;

function undefinedIfEmpty(array) {
  return array === undefined || array.length === 0 ? undefined : array;
}
/** See: https://spec.graphql.org/draft/#sec-Errors */

/**
 * Prints a GraphQLError to a string, representing useful location information
 * about the error's position in the source. This deprecated helper is retained
 * for backwards compatibility; call `error.toString()` instead because
 * printError will be removed in v17.
 * @param error - The error to format.
 * @returns The printed string representation.
 * @example
 * ```ts
 * import { GraphQLError, printError } from 'graphql/error';
 *
 * const message = printError(new GraphQLError('Example error'));
 *
 * message; // => 'Example error'
 * ```
 * @deprecated Please use `error.toString` instead. Will be removed in v17
 */
function printError(error) {
  return error.toString();
}
/**
 * Given a GraphQLError, format it according to the rules described by the
 * Response Format, Errors section of the GraphQL Specification. This deprecated
 * helper is retained for backwards compatibility; call `error.toJSON()`
 * instead because formatError will be removed in v17.
 * @param error - The error to format.
 * @returns The JSON-serializable formatted error.
 * @example
 * ```ts
 * import { GraphQLError, formatError } from 'graphql/error';
 *
 * const formatted = formatError(new GraphQLError('Example error'));
 *
 * formatted; // => { message: 'Example error' }
 * ```
 * @deprecated Please use `error.toJSON` instead. Will be removed in v17
 */

function formatError(error) {
  return error.toJSON();
}
