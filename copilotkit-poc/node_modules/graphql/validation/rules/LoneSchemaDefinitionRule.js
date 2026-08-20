'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.LoneSchemaDefinitionRule = LoneSchemaDefinitionRule;

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Lone Schema definition
 *
 * A GraphQL document is only valid if it contains only one schema definition.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { LoneSchemaDefinitionRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   schema { query: Query } schema { query: Query } type Query { name: String }
 * `;
 *
 * LoneSchemaDefinitionRule.name; // => 'LoneSchemaDefinitionRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   schema { query: Query } type Query { name: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
function LoneSchemaDefinitionRule(context) {
  var _ref, _ref2, _oldSchema$astNode;

  const oldSchema = context.getSchema();
  const alreadyDefined =
    (_ref =
      (_ref2 =
        (_oldSchema$astNode =
          oldSchema === null || oldSchema === void 0
            ? void 0
            : oldSchema.astNode) !== null && _oldSchema$astNode !== void 0
          ? _oldSchema$astNode
          : oldSchema === null || oldSchema === void 0
          ? void 0
          : oldSchema.getQueryType()) !== null && _ref2 !== void 0
        ? _ref2
        : oldSchema === null || oldSchema === void 0
        ? void 0
        : oldSchema.getMutationType()) !== null && _ref !== void 0
      ? _ref
      : oldSchema === null || oldSchema === void 0
      ? void 0
      : oldSchema.getSubscriptionType();
  let schemaDefinitionsCount = 0;
  return {
    SchemaDefinition(node) {
      if (alreadyDefined) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            'Cannot define a new schema within a schema extension.',
            {
              nodes: node,
            },
          ),
        );
        return;
      }

      if (schemaDefinitionsCount > 0) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            'Must provide only one schema definition.',
            {
              nodes: node,
            },
          ),
        );
      }

      ++schemaDefinitionsCount;
    },
  };
}
