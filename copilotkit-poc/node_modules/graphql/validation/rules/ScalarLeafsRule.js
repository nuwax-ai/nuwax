'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.ScalarLeafsRule = ScalarLeafsRule;

var _inspect = require('../../jsutils/inspect.js');

var _GraphQLError = require('../../error/GraphQLError.js');

var _definition = require('../../type/definition.js');

/** @category Validation Rules */

/**
 * Scalar leafs
 *
 * A GraphQL document is valid only if all leaf fields (fields without
 * sub selections) are of scalar or enum types.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { ScalarLeafsRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   { name { length } }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [ScalarLeafsRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   { name }
 * `);
 * const validErrors = validate(schema, validDocument, [ScalarLeafsRule]);
 *
 * validErrors; // => []
 * ```
 */
function ScalarLeafsRule(context) {
  return {
    Field(node) {
      const type = context.getType();
      const selectionSet = node.selectionSet;

      if (type) {
        if ((0, _definition.isLeafType)((0, _definition.getNamedType)(type))) {
          if (selectionSet) {
            const fieldName = node.name.value;
            const typeStr = (0, _inspect.inspect)(type);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Field "${fieldName}" must not have a selection since type "${typeStr}" has no subfields.`,
                {
                  nodes: selectionSet,
                },
              ),
            );
          }
        } else if (!selectionSet) {
          const fieldName = node.name.value;
          const typeStr = (0, _inspect.inspect)(type);
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Field "${fieldName}" of type "${typeStr}" must have a selection of subfields. Did you mean "${fieldName} { ... }"?`,
              {
                nodes: node,
              },
            ),
          );
        } else if (selectionSet.selections.length === 0) {
          const fieldName = node.name.value;
          const typeStr = (0, _inspect.inspect)(type);
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Field "${fieldName}" of type "${typeStr}" must have at least one field selected.`,
              {
                nodes: node,
              },
            ),
          );
        }
      }
    },
  };
}
