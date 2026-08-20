/** @category Introspection */

/** Options controlling which fields are included in the introspection query. */

/**
 * Produce the GraphQL query recommended for a full schema introspection.
 * Accepts optional IntrospectionOptions.
 * @param options - Optional configuration for this operation.
 * @returns The resolved introspection query.
 * @example
 * ```ts
 * // Generate the default introspection query.
 * import { getIntrospectionQuery } from 'graphql/utilities';
 *
 * const query = getIntrospectionQuery();
 *
 * query; // matches /__schema/
 * query; // matches /description/
 * query; // does not match /specifiedByURL/
 * ```
 * @example
 * ```ts
 * // This variant customizes optional introspection fields and nesting depth.
 * import { getIntrospectionQuery } from 'graphql/utilities';
 *
 * const query = getIntrospectionQuery({
 *   descriptions: false,
 *   specifiedByUrl: true,
 *   directiveIsRepeatable: true,
 *   schemaDescription: true,
 *   inputValueDeprecation: true,
 *   experimentalDirectiveDeprecation: true,
 *   oneOf: true,
 *   typeDepth: 3,
 * });
 *
 * query; // does not match /description/
 * query; // matches /specifiedByURL/
 * query; // matches /isRepeatable/
 * query; // matches /includeDeprecated: true/
 * query; // matches /isOneOf/
 * (query.match(/ofType/g)?.length ?? 0) > 0; // => true
 * ```
 */
export function getIntrospectionQuery(options) {
  const optionsWithDefault = {
    descriptions: true,
    specifiedByUrl: false,
    directiveIsRepeatable: false,
    schemaDescription: false,
    inputValueDeprecation: false,
    experimentalDirectiveDeprecation: false,
    oneOf: false,
    typeDepth: 9,
    ...options,
  };
  const descriptions = optionsWithDefault.descriptions ? 'description' : '';
  const specifiedByUrl = optionsWithDefault.specifiedByUrl
    ? 'specifiedByURL'
    : '';
  const directiveIsRepeatable = optionsWithDefault.directiveIsRepeatable
    ? 'isRepeatable'
    : '';
  const schemaDescription = optionsWithDefault.schemaDescription
    ? descriptions
    : '';

  function inputDeprecation(str) {
    return optionsWithDefault.inputValueDeprecation ? str : '';
  }

  function experimentalDirectiveDeprecation(str) {
    return optionsWithDefault.experimentalDirectiveDeprecation ? str : '';
  }

  const oneOf = optionsWithDefault.oneOf ? 'isOneOf' : '';

  function ofType(level, indent) {
    if (level <= 0) {
      return '';
    }

    if (level > 100) {
      throw new Error(
        'Please set typeDepth to a reasonable value between 0 and 100; the default is 9.',
      );
    }

    return `
${indent}ofType {
${indent}  name
${indent}  kind${ofType(level - 1, indent + '  ')}
${indent}}`;
  }

  return `
    query IntrospectionQuery {
      __schema {
        ${schemaDescription}
        queryType { name kind }
        mutationType { name kind }
        subscriptionType { name kind }
        types {
          ...FullType
        }
        directives${experimentalDirectiveDeprecation(
          '(includeDeprecated: true)',
        )} {
          name
          ${descriptions}
          ${directiveIsRepeatable}
          ${experimentalDirectiveDeprecation('isDeprecated')}
          ${experimentalDirectiveDeprecation('deprecationReason')}
          locations
          args${inputDeprecation('(includeDeprecated: true)')} {
            ...InputValue
          }
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      ${descriptions}
      ${specifiedByUrl}
      ${oneOf}
      fields(includeDeprecated: true) {
        name
        ${descriptions}
        args${inputDeprecation('(includeDeprecated: true)')} {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields${inputDeprecation('(includeDeprecated: true)')} {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        ${descriptions}
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }

    fragment InputValue on __InputValue {
      name
      ${descriptions}
      type { ...TypeRef }
      defaultValue
      ${inputDeprecation('isDeprecated')}
      ${inputDeprecation('deprecationReason')}
    }

    fragment TypeRef on __Type {
      kind
      name${ofType(optionsWithDefault.typeDepth, '      ')}
    }
  `;
}
/** The result shape returned by a full introspection query. */
