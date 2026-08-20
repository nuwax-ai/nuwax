'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.assertEnumValueName = assertEnumValueName;
exports.assertName = assertName;

var _devAssert = require('../jsutils/devAssert.js');

var _GraphQLError = require('../error/GraphQLError.js');

var _characterClasses = require('../language/characterClasses.js');

/** @category Names */

/**
 * Upholds the spec rules about naming.
 * @param name - The GraphQL name to validate.
 * @returns The validated GraphQL name.
 * @example
 * ```ts
 * import { assertName } from 'graphql/type';
 *
 * assertName('User'); // => 'User'
 * assertName('123User'); // throws an error
 * ```
 */
function assertName(name) {
  name != null || (0, _devAssert.devAssert)(false, 'Must provide name.');
  typeof name === 'string' ||
    (0, _devAssert.devAssert)(false, 'Expected name to be a string.');

  if (name.length === 0) {
    throw new _GraphQLError.GraphQLError(
      'Expected name to be a non-empty string.',
    );
  }

  for (let i = 1; i < name.length; ++i) {
    if (!(0, _characterClasses.isNameContinue)(name.charCodeAt(i))) {
      throw new _GraphQLError.GraphQLError(
        `Names must only contain [_a-zA-Z0-9] but "${name}" does not.`,
      );
    }
  }

  if (!(0, _characterClasses.isNameStart)(name.charCodeAt(0))) {
    throw new _GraphQLError.GraphQLError(
      `Names must start with [_a-zA-Z] but "${name}" does not.`,
    );
  }

  return name;
}
/**
 * Upholds the spec rules about naming enum values.
 * @param name - The GraphQL name to validate.
 * @returns The validated GraphQL name.
 * @example
 * ```ts
 * import { assertEnumValueName } from 'graphql/type';
 *
 * assertEnumValueName('ACTIVE'); // => 'ACTIVE'
 * assertEnumValueName('true'); // throws an error
 * ```
 */

function assertEnumValueName(name) {
  if (name === 'true' || name === 'false' || name === 'null') {
    throw new _GraphQLError.GraphQLError(
      `Enum values cannot be named: ${name}`,
    );
  }

  return assertName(name);
}
