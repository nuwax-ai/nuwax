'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueInputFieldNamesRule = UniqueInputFieldNamesRule;

var _invariant = require('../../jsutils/invariant.js');

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Unique input field names
 *
 * A GraphQL input object value is only valid if all supplied fields are
 * uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Input-Object-Field-Uniqueness
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { UniqueInputFieldNamesRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   input Filter {
 *     name: String
 *   }
 *
 *   type Query {
 *     search(filter: Filter): String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   { search(filter: { name: "a", name: "b" }) }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [UniqueInputFieldNamesRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   { search(filter: { name: "a" }) }
 * `);
 * const validErrors = validate(schema, validDocument, [UniqueInputFieldNamesRule]);
 *
 * validErrors; // => []
 * ```
 */
function UniqueInputFieldNamesRule(context) {
  const knownNameStack = [];
  let knownNames = Object.create(null);
  return {
    ObjectValue: {
      enter() {
        knownNameStack.push(knownNames);
        knownNames = Object.create(null);
      },

      leave() {
        const prevKnownNames = knownNameStack.pop();
        prevKnownNames || (0, _invariant.invariant)(false);
        knownNames = prevKnownNames;
      },
    },

    ObjectField(node) {
      const fieldName = node.name.value;

      if (knownNames[fieldName]) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `There can be only one input field named "${fieldName}".`,
            {
              nodes: [knownNames[fieldName], node.name],
            },
          ),
        );
      } else {
        knownNames[fieldName] = node.name;
      }
    },
  };
}
