'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.UniqueFieldDefinitionNamesRule = UniqueFieldDefinitionNamesRule;

var _GraphQLError = require('../../error/GraphQLError.js');

var _definition = require('../../type/definition.js');

/** @category Validation Rules */

/**
 * Unique field definition names
 *
 * A GraphQL complex type is only valid if all its fields are uniquely named.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueFieldDefinitionNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { name: String name: String }
 * `;
 *
 * UniqueFieldDefinitionNamesRule.name; // => 'UniqueFieldDefinitionNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { name: String other: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
function UniqueFieldDefinitionNamesRule(context) {
  const schema = context.getSchema();
  const existingTypeMap = schema ? schema.getTypeMap() : Object.create(null);
  const knownFieldNames = Object.create(null);
  return {
    InputObjectTypeDefinition: checkFieldUniqueness,
    InputObjectTypeExtension: checkFieldUniqueness,
    InterfaceTypeDefinition: checkFieldUniqueness,
    InterfaceTypeExtension: checkFieldUniqueness,
    ObjectTypeDefinition: checkFieldUniqueness,
    ObjectTypeExtension: checkFieldUniqueness,
  };

  function checkFieldUniqueness(node) {
    var _node$fields;

    const typeName = node.name.value;

    if (!knownFieldNames[typeName]) {
      knownFieldNames[typeName] = Object.create(null);
    } // FIXME: https://github.com/graphql/graphql-js/issues/2203

    /* c8 ignore next */

    const fieldNodes =
      (_node$fields = node.fields) !== null && _node$fields !== void 0
        ? _node$fields
        : [];
    const fieldNames = knownFieldNames[typeName];

    for (const fieldDef of fieldNodes) {
      const fieldName = fieldDef.name.value;

      if (hasField(existingTypeMap[typeName], fieldName)) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Field "${typeName}.${fieldName}" already exists in the schema. It cannot also be defined in this type extension.`,
            {
              nodes: fieldDef.name,
            },
          ),
        );
      } else if (fieldNames[fieldName]) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Field "${typeName}.${fieldName}" can only be defined once.`,
            {
              nodes: [fieldNames[fieldName], fieldDef.name],
            },
          ),
        );
      } else {
        fieldNames[fieldName] = fieldDef.name;
      }
    }

    return false;
  }
}

function hasField(type, fieldName) {
  if (
    (0, _definition.isObjectType)(type) ||
    (0, _definition.isInterfaceType)(type) ||
    (0, _definition.isInputObjectType)(type)
  ) {
    return type.getFields()[fieldName] != null;
  }

  return false;
}
