'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.DirectiveLocation = void 0;

/** @category Kinds */

/** The set of allowed directive location values. */
var DirectiveLocation;
exports.DirectiveLocation = DirectiveLocation;

(function (DirectiveLocation) {
  DirectiveLocation['QUERY'] = 'QUERY';
  DirectiveLocation['MUTATION'] = 'MUTATION';
  DirectiveLocation['SUBSCRIPTION'] = 'SUBSCRIPTION';
  DirectiveLocation['FIELD'] = 'FIELD';
  DirectiveLocation['FRAGMENT_DEFINITION'] = 'FRAGMENT_DEFINITION';
  DirectiveLocation['FRAGMENT_SPREAD'] = 'FRAGMENT_SPREAD';
  DirectiveLocation['INLINE_FRAGMENT'] = 'INLINE_FRAGMENT';
  DirectiveLocation['VARIABLE_DEFINITION'] = 'VARIABLE_DEFINITION';
  DirectiveLocation['SCHEMA'] = 'SCHEMA';
  DirectiveLocation['SCALAR'] = 'SCALAR';
  DirectiveLocation['OBJECT'] = 'OBJECT';
  DirectiveLocation['FIELD_DEFINITION'] = 'FIELD_DEFINITION';
  DirectiveLocation['ARGUMENT_DEFINITION'] = 'ARGUMENT_DEFINITION';
  DirectiveLocation['INTERFACE'] = 'INTERFACE';
  DirectiveLocation['UNION'] = 'UNION';
  DirectiveLocation['ENUM'] = 'ENUM';
  DirectiveLocation['ENUM_VALUE'] = 'ENUM_VALUE';
  DirectiveLocation['INPUT_OBJECT'] = 'INPUT_OBJECT';
  DirectiveLocation['INPUT_FIELD_DEFINITION'] = 'INPUT_FIELD_DEFINITION';
  DirectiveLocation['DIRECTIVE_DEFINITION'] = 'DIRECTIVE_DEFINITION';
})(DirectiveLocation || (exports.DirectiveLocation = DirectiveLocation = {}));
/**
 * Deprecated legacy alias for the enum type representing directive location
 * values. This alias will be removed in v17. In v17, `DirectiveLocation` is
 * exported as the single public symbol for both the runtime object and the
 * corresponding TypeScript type.
 * @deprecated Will be removed in v17. In v17, use `DirectiveLocation` as both
 * the runtime value and the type.
 */
