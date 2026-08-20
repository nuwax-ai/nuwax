/** @category Validation Rules */
import { GraphQLError } from '../../error/GraphQLError.mjs';

/**
 * Unique type names
 *
 * A GraphQL document is only valid if all defined types have unique names.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueTypeNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { name: String } type Query { other: String }
 * `;
 *
 * UniqueTypeNamesRule.name; // => 'UniqueTypeNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { name: String } type Other { name: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export function UniqueTypeNamesRule(context) {
  const knownTypeNames = Object.create(null);
  const schema = context.getSchema();
  return {
    ScalarTypeDefinition: checkTypeName,
    ObjectTypeDefinition: checkTypeName,
    InterfaceTypeDefinition: checkTypeName,
    UnionTypeDefinition: checkTypeName,
    EnumTypeDefinition: checkTypeName,
    InputObjectTypeDefinition: checkTypeName,
  };

  function checkTypeName(node) {
    const typeName = node.name.value;

    if (schema !== null && schema !== void 0 && schema.getType(typeName)) {
      context.reportError(
        new GraphQLError(
          `Type "${typeName}" already exists in the schema. It cannot also be defined in this type definition.`,
          {
            nodes: node.name,
          },
        ),
      );
      return;
    }

    if (knownTypeNames[typeName]) {
      context.reportError(
        new GraphQLError(`There can be only one type named "${typeName}".`, {
          nodes: [knownTypeNames[typeName], node.name],
        }),
      );
    } else {
      knownTypeNames[typeName] = node.name;
    }

    return false;
  }
}
