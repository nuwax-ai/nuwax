'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.valueFromASTUntyped = valueFromASTUntyped;

var _keyValMap = require('../jsutils/keyValMap.js');

var _kinds = require('../language/kinds.js');

/** @category Values */

/**
 * Produces a JavaScript value given a GraphQL Value AST.
 *
 * Because no GraphQL type is provided, the returned JavaScript value reflects
 * the provided GraphQL value AST.
 *
 * | GraphQL Value        | JavaScript Value |
 * | -------------------- | ---------------- |
 * | Input Object         | Object           |
 * | List                 | Array            |
 * | Boolean              | Boolean          |
 * | String / Enum        | String           |
 * | Int / Float          | Number           |
 * | Null                 | null             |
 * @param valueNode - GraphQL value AST node to convert.
 * @param variables - Optional runtime variable values keyed by variable name.
 * @returns JavaScript value represented by the GraphQL value AST.
 * @example
 * ```ts
 * import { parseValue } from 'graphql/language';
 * import { valueFromASTUntyped } from 'graphql/utilities';
 *
 * const value = valueFromASTUntyped(parseValue('[1, 2, 3]'));
 *
 * value; // => [1, 2, 3]
 * valueFromASTUntyped(parseValue('$name'), { name: 'Ada' }); // => 'Ada'
 * ```
 */
function valueFromASTUntyped(valueNode, variables) {
  switch (valueNode.kind) {
    case _kinds.Kind.NULL:
      return null;

    case _kinds.Kind.INT:
      return parseInt(valueNode.value, 10);

    case _kinds.Kind.FLOAT:
      return parseFloat(valueNode.value);

    case _kinds.Kind.STRING:
    case _kinds.Kind.ENUM:
    case _kinds.Kind.BOOLEAN:
      return valueNode.value;

    case _kinds.Kind.LIST:
      return valueNode.values.map((node) =>
        valueFromASTUntyped(node, variables),
      );

    case _kinds.Kind.OBJECT:
      return (0, _keyValMap.keyValMap)(
        valueNode.fields,
        (field) => field.name.value,
        (field) => valueFromASTUntyped(field.value, variables),
      );

    case _kinds.Kind.VARIABLE:
      return variables === null || variables === void 0
        ? void 0
        : variables[valueNode.name.value];
  }
}
