'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueArgumentDefinitionNamesRule = UniqueArgumentDefinitionNamesRule;

var _groupBy = require('../../jsutils/groupBy.js');

var _GraphQLError = require('../../error/GraphQLError.js');

/** @category Validation Rules */

/**
 * Unique argument definition names
 *
 * A GraphQL Object or Interface type is only valid if all its fields have uniquely named arguments.
 * A GraphQL Directive is only valid if all its arguments are uniquely named.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueArgumentDefinitionNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { field(arg: String, arg: Int): String }
 * `;
 *
 * UniqueArgumentDefinitionNamesRule.name; // => 'UniqueArgumentDefinitionNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { field(arg: String): String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
function UniqueArgumentDefinitionNamesRule(context) {
  return {
    DirectiveDefinition(directiveNode) {
      var _directiveNode$argume;

      // FIXME: https://github.com/graphql/graphql-js/issues/2203

      /* c8 ignore next */
      const argumentNodes =
        (_directiveNode$argume = directiveNode.arguments) !== null &&
        _directiveNode$argume !== void 0
          ? _directiveNode$argume
          : [];
      return checkArgUniqueness(`@${directiveNode.name.value}`, argumentNodes);
    },

    InterfaceTypeDefinition: checkArgUniquenessPerField,
    InterfaceTypeExtension: checkArgUniquenessPerField,
    ObjectTypeDefinition: checkArgUniquenessPerField,
    ObjectTypeExtension: checkArgUniquenessPerField,
  };

  function checkArgUniquenessPerField(typeNode) {
    var _typeNode$fields;

    const typeName = typeNode.name.value; // FIXME: https://github.com/graphql/graphql-js/issues/2203

    /* c8 ignore next */

    const fieldNodes =
      (_typeNode$fields = typeNode.fields) !== null &&
      _typeNode$fields !== void 0
        ? _typeNode$fields
        : [];

    for (const fieldDef of fieldNodes) {
      var _fieldDef$arguments;

      const fieldName = fieldDef.name.value; // FIXME: https://github.com/graphql/graphql-js/issues/2203

      /* c8 ignore next */

      const argumentNodes =
        (_fieldDef$arguments = fieldDef.arguments) !== null &&
        _fieldDef$arguments !== void 0
          ? _fieldDef$arguments
          : [];
      checkArgUniqueness(`${typeName}.${fieldName}`, argumentNodes);
    }

    return false;
  }

  function checkArgUniqueness(parentName, argumentNodes) {
    const seenArgs = (0, _groupBy.groupBy)(
      argumentNodes,
      (arg) => arg.name.value,
    );

    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Argument "${parentName}(${argName}:)" can only be defined once.`,
            {
              nodes: argNodes.map((node) => node.name),
            },
          ),
        );
      }
    }

    return false;
  }
}
