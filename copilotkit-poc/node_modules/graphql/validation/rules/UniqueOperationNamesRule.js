'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueOperationNamesRule = UniqueOperationNamesRule;

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Unique operation names
 *
 * A GraphQL document is only valid if all defined operations have unique names.
 *
 * See https://spec.graphql.org/draft/#sec-Operation-Name-Uniqueness
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { UniqueOperationNamesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   query Same { name } query Same { name }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [UniqueOperationNamesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   query One { name } query Two { name }
 * `);
 * const validErrors = validate(schema, validDocument, [UniqueOperationNamesRule]);
 *
 * validErrors; // => []
 * ```
 */
function UniqueOperationNamesRule(context) {
  const knownOperationNames = Object.create(null);
  return {
    OperationDefinition(node) {
      const operationName = node.name;

      if (operationName) {
        if (knownOperationNames[operationName.value]) {
          context.reportError(
            new _GraphQLError.GraphQLError(
              `There can be only one operation named "${operationName.value}".`,
              {
                nodes: [
                  knownOperationNames[operationName.value],
                  operationName,
                ],
              },
            ),
          );
        } else {
          knownOperationNames[operationName.value] = operationName;
        }
      }

      return false;
    },

    FragmentDefinition: () => false,
  };
}
