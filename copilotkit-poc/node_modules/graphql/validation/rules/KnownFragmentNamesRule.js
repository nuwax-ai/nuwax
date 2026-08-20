'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.KnownFragmentNamesRule = KnownFragmentNamesRule;

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Known fragment names
 *
 * A GraphQL document is only valid if all `...Fragment` fragment spreads refer
 * to fragments defined in the same document.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-spread-target-defined
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { KnownFragmentNamesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   { ...Missing }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [KnownFragmentNamesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   fragment NameFields on Query { name } query { ...NameFields }
 * `);
 * const validErrors = validate(schema, validDocument, [KnownFragmentNamesRule]);
 *
 * validErrors; // => []
 * ```
 */
function KnownFragmentNamesRule(context) {
  return {
    FragmentSpread(node) {
      const fragmentName = node.name.value;
      const fragment = context.getFragment(fragmentName);

      if (!fragment) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Unknown fragment "${fragmentName}".`,
            {
              nodes: node.name,
            },
          ),
        );
      }
    },
  };
}
