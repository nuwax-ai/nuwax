'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.assertValidSDL = assertValidSDL;
exports.assertValidSDLExtension = assertValidSDLExtension;
exports.validate = validate;
exports.validateSDL = validateSDL;

var _devAssert = require('../jsutils/devAssert.js');

var _mapValue = require('../jsutils/mapValue.js');

var _GraphQLError = require('../error/GraphQLError.js');

var _ast = require('../language/ast.js');

var _visitor = require('../language/visitor.js');

var _validate = require('../type/validate.js');

var _TypeInfo = require('../utilities/TypeInfo.js');

var _specifiedRules = require('./specifiedRules.js');

var _ValidationContext = require('./ValidationContext.js');

/** @category Validation */
// Per the specification, descriptions must not affect validation.
// See https://spec.graphql.org/draft/#sec-Descriptions
const QueryDocumentKeysToValidate = (0, _mapValue.mapValue)(
  _ast.QueryDocumentKeys,
  (keys) => keys.filter((key) => key !== 'description'),
);
/**
 * Options used when validating a GraphQL document.
 * @internal
 */

/**
 * Implements the "Validation" section of the spec.
 *
 * Validation runs synchronously, returning an array of encountered errors, or
 * an empty array if no errors were encountered and the document is valid.
 *
 * A list of specific validation rules may be provided. If not provided, the
 * default list of rules defined by the GraphQL specification will be used.
 *
 * Each validation rule is a function that returns a visitor
 * (see the language/visitor API). Visitor methods are expected to return
 * GraphQLErrors, or Arrays of GraphQLErrors when invalid.
 *
 * Validate will stop validation after a `maxErrors` limit has been reached.
 * Attackers can send pathologically invalid queries to induce a DoS attack,
 * so `maxErrors` defaults to 100 errors.
 *
 * Optionally a custom TypeInfo instance may be provided. If not provided, one
 * will be created from the provided schema.
 * @param schema - Schema to validate against.
 * @param documentAST - Document AST to validate.
 * @param rules - Validation rules to apply.
 * @param options - Validation options, including error limits.
 * @param typeInfo - TypeInfo instance to update during traversal.
 * @returns Validation errors, or an empty array when the document is valid.
 * @example
 * ```ts
 * // Validate with the default specified rules.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { validate } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * validate(schema, parse('{ greeting }')); // => []
 *
 * const errors = validate(schema, parse('{ missing }'));
 * errors[0].message; // => 'Cannot query field "missing" on type "Query".'
 * ```
 * @example
 * ```ts
 * // This variant uses a custom rule list, TypeInfo, and validation options.
 * import { parse } from 'graphql/language';
 * import { buildSchema, TypeInfo } from 'graphql/utilities';
 * import { FieldsOnCorrectTypeRule, validate } from 'graphql/validation';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 * const document = parse('{ missingOne missingTwo }');
 *
 * const errors = validate(
 *   schema,
 *   document,
 *   [FieldsOnCorrectTypeRule],
 *   { maxErrors: 1 },
 *   new TypeInfo(schema),
 * );
 *
 * errors.length; // => 2
 * errors[1].message; // => 'Too many validation errors, error limit reached. Validation aborted.'
 * ```
 */
function validate(
  schema,
  documentAST,
  rules = _specifiedRules.specifiedRules,
  options,
  /**
   * Deprecated TypeInfo instance used to track traversal state during
   * validation. Omit this argument so validate creates the TypeInfo instance.
   * @deprecated will be removed in 17.0.0
   */
  typeInfo = new _TypeInfo.TypeInfo(schema),
) {
  var _options$maxErrors;

  const maxErrors =
    (_options$maxErrors =
      options === null || options === void 0 ? void 0 : options.maxErrors) !==
      null && _options$maxErrors !== void 0
      ? _options$maxErrors
      : 100;
  documentAST || (0, _devAssert.devAssert)(false, 'Must provide document.'); // If the schema used for validation is invalid, throw an error.

  (0, _validate.assertValidSchema)(schema);
  const abortObj = Object.freeze({});
  const errors = [];
  const context = new _ValidationContext.ValidationContext(
    schema,
    documentAST,
    typeInfo,
    (error) => {
      if (errors.length >= maxErrors) {
        errors.push(
          new _GraphQLError.GraphQLError(
            'Too many validation errors, error limit reached. Validation aborted.',
          ),
        ); // eslint-disable-next-line @typescript-eslint/no-throw-literal

        throw abortObj;
      }

      errors.push(error);
    },
  ); // This uses a specialized visitor which runs multiple visitors in parallel,
  // while maintaining the visitor skip and break API.

  const visitor = (0, _visitor.visitInParallel)(
    rules.map((rule) => rule(context)),
  ); // Visit the whole document with each instance of all provided rules.

  try {
    (0, _visitor.visit)(
      documentAST,
      (0, _TypeInfo.visitWithTypeInfo)(typeInfo, visitor),
      QueryDocumentKeysToValidate,
    );
  } catch (e) {
    if (e !== abortObj) {
      throw e;
    }
  }

  return errors;
}
/** @internal */

function validateSDL(
  documentAST,
  schemaToExtend,
  rules = _specifiedRules.specifiedSDLRules,
) {
  const errors = [];
  const context = new _ValidationContext.SDLValidationContext(
    documentAST,
    schemaToExtend,
    (error) => {
      errors.push(error);
    },
  );
  const visitors = rules.map((rule) => rule(context));
  (0, _visitor.visit)(documentAST, (0, _visitor.visitInParallel)(visitors));
  return errors;
}
/**
 * Utility function which asserts a SDL document is valid by throwing an error
 * if it is invalid.
 *
 * @internal
 */

function assertValidSDL(documentAST) {
  const errors = validateSDL(documentAST);

  if (errors.length !== 0) {
    throw new Error(errors.map((error) => error.message).join('\n\n'));
  }
}
/**
 * Utility function which asserts a SDL document is valid by throwing an error
 * if it is invalid.
 *
 * @internal
 */

function assertValidSDLExtension(documentAST, schema) {
  const errors = validateSDL(documentAST, schema);

  if (errors.length !== 0) {
    throw new Error(errors.map((error) => error.message).join('\n\n'));
  }
}
