'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.NoUnusedFragmentsRule = NoUnusedFragmentsRule;

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * No unused fragments
 *
 * A GraphQL document is only valid if all fragment definitions are spread
 * within operations, or spread within other fragments spread within operations.
 *
 * See https://spec.graphql.org/draft/#sec-Fragments-Must-Be-Used
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { NoUnusedFragmentsRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   fragment Unused on Query { name } query { name }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [NoUnusedFragmentsRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   fragment Used on Query { name } query { ...Used }
 * `);
 * const validErrors = validate(schema, validDocument, [NoUnusedFragmentsRule]);
 *
 * validErrors; // => []
 * ```
 */
function NoUnusedFragmentsRule(context) {
  const operationDefs = [];
  const fragmentDefs = [];
  return {
    OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },

    FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },

    Document: {
      leave() {
        const fragmentNameUsed = Object.create(null);

        for (const operation of operationDefs) {
          for (const fragment of context.getRecursivelyReferencedFragments(
            operation,
          )) {
            fragmentNameUsed[fragment.name.value] = true;
          }
        }

        for (const fragmentDef of fragmentDefs) {
          const fragName = fragmentDef.name.value;

          if (fragmentNameUsed[fragName] !== true) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Fragment "${fragName}" is never used.`,
                {
                  nodes: fragmentDef,
                },
              ),
            );
          }
        }
      },
    },
  };
}
