'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.FragmentsOnCompositeTypesRule = FragmentsOnCompositeTypesRule;

var _GraphQLError = require('../../error/GraphQLError.js');

var _printer = require('../../language/printer.js');

var _definition = require('../../type/definition.js');

var _typeFromAST = require('../../utilities/typeFromAST.js');

/** @category Validation Rules */

/**
 * Fragments on composite type
 *
 * Fragments use a type condition to determine if they apply, since fragments
 * can only be spread into a composite type (object, interface, or union), the
 * type condition must also be a composite type.
 *
 * See https://spec.graphql.org/draft/#sec-Fragments-On-Composite-Types
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { FragmentsOnCompositeTypesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   fragment Bad on String { length }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [FragmentsOnCompositeTypesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   fragment Good on Query { name }
 * `);
 * const validErrors = validate(schema, validDocument, [FragmentsOnCompositeTypesRule]);
 *
 * validErrors; // => []
 * ```
 */
function FragmentsOnCompositeTypesRule(context) {
  return {
    InlineFragment(node) {
      const typeCondition = node.typeCondition;

      if (typeCondition) {
        const type = (0, _typeFromAST.typeFromAST)(
          context.getSchema(),
          typeCondition,
        );

        if (type && !(0, _definition.isCompositeType)(type)) {
          const typeStr = (0, _printer.print)(typeCondition);
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Fragment cannot condition on non composite type "${typeStr}".`,
              {
                nodes: typeCondition,
              },
            ),
          );
        }
      }
    },

    FragmentDefinition(node) {
      const type = (0, _typeFromAST.typeFromAST)(
        context.getSchema(),
        node.typeCondition,
      );

      if (type && !(0, _definition.isCompositeType)(type)) {
        const typeStr = (0, _printer.print)(node.typeCondition);
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Fragment "${node.name.value}" cannot condition on non composite type "${typeStr}".`,
            {
              nodes: node.typeCondition,
            },
          ),
        );
      }
    },
  };
}
