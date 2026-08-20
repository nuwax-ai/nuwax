/** @category Schema Construction */
import { devAssert } from '../jsutils/devAssert.mjs';
import { Kind } from '../language/kinds.mjs';
import { parse } from '../language/parser.mjs';
import { specifiedDirectives } from '../type/directives.mjs';
import { GraphQLSchema } from '../type/schema.mjs';
import { assertValidSDL } from '../validation/validate.mjs';
import { extendSchemaImpl } from './extendSchema.mjs';
/** Options used when building a schema from SDL or a parsed SDL document. */

/**
 * Builds a GraphQLSchema from a parsed schema definition language document.
 *
 * If no schema definition is provided, then it will look for types named Query,
 * Mutation and Subscription.
 *
 * The resulting schema has no resolver functions, so execution will use the
 * default field resolver.
 * @param documentAST - The parsed GraphQL document AST.
 * @param options - Optional configuration for this operation.
 * @returns The schema built from the provided SDL document.
 * @example
 * ```ts
 * // Build a schema from a valid parsed SDL document.
 * import { parse } from 'graphql/language';
 * import { buildASTSchema } from 'graphql/utilities';
 *
 * const document = parse('type Query { hello: String }');
 * const schema = buildASTSchema(document);
 *
 * schema.getQueryType().name; // => 'Query'
 * ```
 * @example
 * ```ts
 * // This variant uses validation options when the SDL references unknown types.
 * import { parse } from 'graphql/language';
 * import { buildASTSchema } from 'graphql/utilities';
 *
 * const document = parse('type Query { broken: MissingType }');
 *
 * buildASTSchema(document); // throws an error
 * buildASTSchema(document, {
 *   assumeValid: true,
 *   assumeValidSDL: true,
 * }); // does not throw
 * ```
 */
export function buildASTSchema(documentAST, options) {
  (documentAST != null && documentAST.kind === Kind.DOCUMENT) ||
    devAssert(false, 'Must provide valid Document AST.');

  if (
    (options === null || options === void 0 ? void 0 : options.assumeValid) !==
      true &&
    (options === null || options === void 0
      ? void 0
      : options.assumeValidSDL) !== true
  ) {
    assertValidSDL(documentAST);
  }

  const emptySchemaConfig = {
    description: undefined,
    types: [],
    directives: [],
    extensions: Object.create(null),
    extensionASTNodes: [],
    assumeValid: false,
  };
  const config = extendSchemaImpl(emptySchemaConfig, documentAST, options);

  if (config.astNode == null) {
    for (const type of config.types) {
      switch (type.name) {
        // Note: While this could make early assertions to get the correctly
        // typed values below, that would throw immediately while type system
        // validation with validateSchema() will produce more actionable results.
        case 'Query':
          // @ts-expect-error validated in `validateSchema`
          config.query = type;
          break;

        case 'Mutation':
          // @ts-expect-error validated in `validateSchema`
          config.mutation = type;
          break;

        case 'Subscription':
          // @ts-expect-error validated in `validateSchema`
          config.subscription = type;
          break;
      }
    }
  }

  const directives = [
    ...config.directives, // If specified directives were not explicitly declared, add them.
    ...specifiedDirectives.filter((stdDirective) =>
      config.directives.every(
        (directive) => directive.name !== stdDirective.name,
      ),
    ),
  ];
  return new GraphQLSchema({ ...config, directives });
}
/**
 * Builds a GraphQLSchema directly from a schema definition language source.
 * @param source - The GraphQL source text or source object.
 * @param options - Optional configuration for this operation.
 * @returns The schema built from the provided SDL document.
 * @example
 * ```ts
 * // Build a schema from SDL source using the default options.
 * import { buildSchema } from 'graphql/utilities';
 *
 * const schema = buildSchema('type Query { hello: String }');
 *
 * schema.getQueryType().name; // => 'Query'
 * ```
 * @example
 * ```ts
 * // This variant enables parser options and omits source locations.
 * import { buildSchema } from 'graphql/utilities';
 *
 * const schema = buildSchema(
 *   'directive @tag on FIELD_DEFINITION\n' +
 *     'directive @compose @tag on FIELD_DEFINITION',
 *   {
 *     experimentalDirectivesOnDirectiveDefinitions: true,
 *     noLocation: true,
 *   },
 * );
 *
 * const directive = schema.getDirective('compose');
 *
 * directive.name; // => 'compose'
 * directive.astNode.loc; // => undefined
 * ```
 */

export function buildSchema(source, options) {
  const document = parse(source, {
    noLocation:
      options === null || options === void 0 ? void 0 : options.noLocation,
    allowLegacyFragmentVariables:
      options === null || options === void 0
        ? void 0
        : options.allowLegacyFragmentVariables,
    experimentalDirectivesOnDirectiveDefinitions:
      options === null || options === void 0
        ? void 0
        : options.experimentalDirectivesOnDirectiveDefinitions,
  });
  return buildASTSchema(document, {
    assumeValidSDL:
      options === null || options === void 0 ? void 0 : options.assumeValidSDL,
    assumeValid:
      options === null || options === void 0 ? void 0 : options.assumeValid,
  });
}
