'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueArgumentNamesRule = UniqueArgumentNamesRule;

var _groupBy = require('../../jsutils/groupBy.js');

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Unique argument names
 *
 * A GraphQL field or directive is only valid if all supplied arguments are
 * uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Argument-Names
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { UniqueArgumentNamesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     field(arg: String): String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   { field(arg: "1", arg: "2") }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [UniqueArgumentNamesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   { field(arg: "1") }
 * `);
 * const validErrors = validate(schema, validDocument, [UniqueArgumentNamesRule]);
 *
 * validErrors; // => []
 * ```
 */
function UniqueArgumentNamesRule(context) {
  return {
    Field: checkArgUniqueness,
    Directive: checkArgUniqueness,
  };

  function checkArgUniqueness(parentNode) {
    var _parentNode$arguments;

    // FIXME: https://github.com/graphql/graphql-js/issues/2203

    /* c8 ignore next */
    const argumentNodes =
      (_parentNode$arguments = parentNode.arguments) !== null &&
      _parentNode$arguments !== void 0
        ? _parentNode$arguments
        : [];
    const seenArgs = (0, _groupBy.groupBy)(
      argumentNodes,
      (arg) => arg.name.value,
    );

    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `There can be only one argument named "${argName}".`,
            {
              nodes: argNodes.map((node) => node.name),
            },
          ),
        );
      }
    }
  }
}
