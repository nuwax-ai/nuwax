'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueFragmentNamesRule = UniqueFragmentNamesRule;

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Unique fragment names
 *
 * A GraphQL document is only valid if all defined fragments have unique names.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-Name-Uniqueness
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { UniqueFragmentNamesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   fragment A on Query { name } fragment A on Query { name } query { ...A }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [UniqueFragmentNamesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   fragment A on Query { name } query { ...A }
 * `);
 * const validErrors = validate(schema, validDocument, [UniqueFragmentNamesRule]);
 *
 * validErrors; // => []
 * ```
 */
function UniqueFragmentNamesRule(context) {
  const knownFragmentNames = Object.create(null);
  return {
    OperationDefinition: () => false,

    FragmentDefinition(node) {
      const fragmentName = node.name.value;

      if (knownFragmentNames[fragmentName]) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `There can be only one fragment named "${fragmentName}".`,
            {
              nodes: [knownFragmentNames[fragmentName], node.name],
            },
          ),
        );
      } else {
        knownFragmentNames[fragmentName] = node.name;
      }

      return false;
    },
  };
}
