'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.ExecutableDefinitionsRule = ExecutableDefinitionsRule;

var _GraphQLError = require('../../error/GraphQLError.js');

var _kinds = require('../../language/kinds.js');

var _predicates = require('../../language/predicates.js');

/** @category Validation Rules */

/**
 * Executable definitions
 *
 * A GraphQL document is only valid for execution if all definitions are either
 * operation or fragment definitions.
 *
 * See https://spec.graphql.org/draft/#sec-Executable-Definitions
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema, parse, validate } from 'graphql';
 * import { ExecutableDefinitionsRule } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     name: String
 *   }
 * `);
 *
 * const invalidDocument = parse(`
 *   type Extra { field: String }
 * `);
 * const invalidErrors = validate(schema, invalidDocument, [ExecutableDefinitionsRule]);
 *
 * invalidErrors.length; // => 1
 *
 * const validDocument = parse(`
 *   { name }
 * `);
 * const validErrors = validate(schema, validDocument, [ExecutableDefinitionsRule]);
 *
 * validErrors; // => []
 * ```
 */
function ExecutableDefinitionsRule(context) {
  return {
    Document(node) {
      for (const definition of node.definitions) {
        if (!(0, _predicates.isExecutableDefinitionNode)(definition)) {
          const defName =
            definition.kind === _kinds.Kind.SCHEMA_DEFINITION ||
            definition.kind === _kinds.Kind.SCHEMA_EXTENSION
              ? 'schema'
              : '"' + definition.name.value + '"';
          context.reportError(
            new _GraphQLError.GraphQLError(
              `The ${defName} definition is not executable.`,
              {
                nodes: definition,
              },
            ),
          );
        }
      }

      return false;
    },
  };
}
