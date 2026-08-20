'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.LoneAnonymousOperationRule = LoneAnonymousOperationRule;

var _GraphQLError = require('../../error/GraphQLError.js');

var _kinds = require('../../language/kinds.js');

/** @category Validation Rules */

/**
 * Lone anonymous operation
 *
 * A GraphQL document is only valid if when it contains an anonymous operation
 * (the query short-hand) that it contains only that one operation definition.
 *
 * See https://spec.graphql.org/draft/#sec-Lone-Anonymous-Operation
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { LoneAnonymousOperationRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   query { name } query Other { name }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [LoneAnonymousOperationRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   { name }
 * `);
 * const validErrors = validate(schema, validDocument, [LoneAnonymousOperationRule]);
 *
 * validErrors; // => []
 * ```
 */
function LoneAnonymousOperationRule(context) {
  let operationCount = 0;
  return {
    Document(node) {
      operationCount = node.definitions.filter(
        (definition) => definition.kind === _kinds.Kind.OPERATION_DEFINITION,
      ).length;
    },

    OperationDefinition(node) {
      if (!node.name && operationCount > 1) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            'This anonymous operation must be the only defined operation.',
            {
              nodes: node,
            },
          ),
        );
      }
    },
  };
}
