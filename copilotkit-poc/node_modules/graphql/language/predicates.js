'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isConstValueNode = isConstValueNode;
exports.isDefinitionNode = isDefinitionNode;
exports.isExecutableDefinitionNode = isExecutableDefinitionNode;
exports.isSchemaCoordinateNode = isSchemaCoordinateNode;
exports.isSelectionNode = isSelectionNode;
exports.isTypeDefinitionNode = isTypeDefinitionNode;
exports.isTypeExtensionNode = isTypeExtensionNode;
exports.isTypeNode = isTypeNode;
exports.isTypeSystemDefinitionNode = isTypeSystemDefinitionNode;
exports.isTypeSystemExtensionNode = isTypeSystemExtensionNode;
exports.isValueNode = isValueNode;

var _kinds = require('./kinds.js');

/** @category AST Predicates */

/**
 * Returns true when the AST node is a definition node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a definition node.
 * @example
 * ```ts
 * import { parse, isDefinitionNode } from 'graphql/language';
 *
 * const document = parse('{ hello }');
 *
 * isDefinitionNode(document.definitions[0]); // => true
 * isDefinitionNode(document); // => false
 * ```
 */
function isDefinitionNode(node) {
  return (
    isExecutableDefinitionNode(node) ||
    isTypeSystemDefinitionNode(node) ||
    isTypeSystemExtensionNode(node)
  );
}
/**
 * Returns true when the AST node is an executable definition node.
 * @param node - The AST node to test.
 * @returns True when the AST node is an executable definition node.
 * @example
 * ```ts
 * import { parse, isExecutableDefinitionNode } from 'graphql/language';
 *
 * const query = parse('{ hello }');
 * const schema = parse('type Query { hello: String }');
 *
 * isExecutableDefinitionNode(query.definitions[0]); // => true
 * isExecutableDefinitionNode(schema.definitions[0]); // => false
 * ```
 */

function isExecutableDefinitionNode(node) {
  return (
    node.kind === _kinds.Kind.OPERATION_DEFINITION ||
    node.kind === _kinds.Kind.FRAGMENT_DEFINITION
  );
}
/**
 * Returns true when the AST node is a selection node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a selection node.
 * @example
 * ```ts
 * import { Kind, isSelectionNode } from 'graphql/language';
 *
 * const field = { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'hello' } };
 * const document = { kind: Kind.DOCUMENT, definitions: [] };
 *
 * isSelectionNode(field); // => true
 * isSelectionNode(document); // => false
 * ```
 */

function isSelectionNode(node) {
  return (
    node.kind === _kinds.Kind.FIELD ||
    node.kind === _kinds.Kind.FRAGMENT_SPREAD ||
    node.kind === _kinds.Kind.INLINE_FRAGMENT
  );
}
/**
 * Returns true when the AST node is a value node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a value node.
 * @example
 * ```ts
 * import { parseType, parseValue, isValueNode } from 'graphql/language';
 *
 * const value = parseValue('[42]');
 * const type = parseType('[String!]');
 *
 * isValueNode(value); // => true
 * isValueNode(type); // => false
 * ```
 */

function isValueNode(node) {
  return (
    node.kind === _kinds.Kind.VARIABLE ||
    node.kind === _kinds.Kind.INT ||
    node.kind === _kinds.Kind.FLOAT ||
    node.kind === _kinds.Kind.STRING ||
    node.kind === _kinds.Kind.BOOLEAN ||
    node.kind === _kinds.Kind.NULL ||
    node.kind === _kinds.Kind.ENUM ||
    node.kind === _kinds.Kind.LIST ||
    node.kind === _kinds.Kind.OBJECT
  );
}
/**
 * Returns true when the AST node is a constant value node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a constant value node.
 * @example
 * ```ts
 * import { parseConstValue, parseValue, isConstValueNode } from 'graphql/language';
 *
 * const value = parseConstValue('[42]');
 * const variable = parseValue('$id');
 *
 * isConstValueNode(value); // => true
 * isConstValueNode(variable); // => false
 * ```
 */

function isConstValueNode(node) {
  return (
    isValueNode(node) &&
    (node.kind === _kinds.Kind.LIST
      ? node.values.some(isConstValueNode)
      : node.kind === _kinds.Kind.OBJECT
      ? node.fields.some((field) => isConstValueNode(field.value))
      : node.kind !== _kinds.Kind.VARIABLE)
  );
}
/**
 * Returns true when the AST node is a type node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a type node.
 * @example
 * ```ts
 * import { parseType, parseValue, isTypeNode } from 'graphql/language';
 *
 * const type = parseType('[String!]');
 * const value = parseValue('[42]');
 *
 * isTypeNode(type); // => true
 * isTypeNode(value); // => false
 * ```
 */

function isTypeNode(node) {
  return (
    node.kind === _kinds.Kind.NAMED_TYPE ||
    node.kind === _kinds.Kind.LIST_TYPE ||
    node.kind === _kinds.Kind.NON_NULL_TYPE
  );
}
/**
 * Returns true when the AST node is a type system definition node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a type system definition node.
 * @example
 * ```ts
 * import { parse, isTypeSystemDefinitionNode } from 'graphql/language';
 *
 * const schema = parse('type Query { hello: String }');
 * const query = parse('{ hello }');
 *
 * isTypeSystemDefinitionNode(schema.definitions[0]); // => true
 * isTypeSystemDefinitionNode(query.definitions[0]); // => false
 * ```
 */

function isTypeSystemDefinitionNode(node) {
  return (
    node.kind === _kinds.Kind.SCHEMA_DEFINITION ||
    isTypeDefinitionNode(node) ||
    node.kind === _kinds.Kind.DIRECTIVE_DEFINITION
  );
}
/**
 * Returns true when the AST node is a type definition node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a type definition node.
 * @example
 * ```ts
 * import { parse, isTypeDefinitionNode } from 'graphql/language';
 *
 * const typeDefinition = parse('type Query { hello: String }');
 * const directiveDefinition = parse('directive @cache on FIELD');
 *
 * isTypeDefinitionNode(typeDefinition.definitions[0]); // => true
 * isTypeDefinitionNode(directiveDefinition.definitions[0]); // => false
 * ```
 */

function isTypeDefinitionNode(node) {
  return (
    node.kind === _kinds.Kind.SCALAR_TYPE_DEFINITION ||
    node.kind === _kinds.Kind.OBJECT_TYPE_DEFINITION ||
    node.kind === _kinds.Kind.INTERFACE_TYPE_DEFINITION ||
    node.kind === _kinds.Kind.UNION_TYPE_DEFINITION ||
    node.kind === _kinds.Kind.ENUM_TYPE_DEFINITION ||
    node.kind === _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION
  );
}
/**
 * Returns true when the AST node is a type system extension node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a type system extension node.
 * @example
 * ```ts
 * import { parse, isTypeSystemExtensionNode } from 'graphql/language';
 *
 * const extension = parse('extend type Query { hello: String }');
 * const definition = parse('type Query { hello: String }');
 *
 * isTypeSystemExtensionNode(extension.definitions[0]); // => true
 * isTypeSystemExtensionNode(definition.definitions[0]); // => false
 * ```
 */

function isTypeSystemExtensionNode(node) {
  return (
    node.kind === _kinds.Kind.SCHEMA_EXTENSION ||
    node.kind === _kinds.Kind.DIRECTIVE_EXTENSION ||
    isTypeExtensionNode(node)
  );
}
/**
 * Returns true when the AST node is a type extension node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a type extension node.
 * @example
 * ```ts
 * import { parse, isTypeExtensionNode } from 'graphql/language';
 *
 * const extension = parse('extend type Query { hello: String }');
 * const schemaExtension = parse('extend schema { query: Query }');
 *
 * isTypeExtensionNode(extension.definitions[0]); // => true
 * isTypeExtensionNode(schemaExtension.definitions[0]); // => false
 * ```
 */

function isTypeExtensionNode(node) {
  return (
    node.kind === _kinds.Kind.SCALAR_TYPE_EXTENSION ||
    node.kind === _kinds.Kind.OBJECT_TYPE_EXTENSION ||
    node.kind === _kinds.Kind.INTERFACE_TYPE_EXTENSION ||
    node.kind === _kinds.Kind.UNION_TYPE_EXTENSION ||
    node.kind === _kinds.Kind.ENUM_TYPE_EXTENSION ||
    node.kind === _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION
  );
}
/**
 * Returns true when the AST node is a schema coordinate node.
 * @param node - The AST node to test.
 * @returns True when the AST node is a schema coordinate node.
 * @example
 * ```ts
 * import {
 *   parse,
 *   parseSchemaCoordinate,
 *   isSchemaCoordinateNode,
 * } from 'graphql/language';
 *
 * const coordinate = parseSchemaCoordinate('Query.hero');
 * const document = parse('{ hero }');
 *
 * isSchemaCoordinateNode(coordinate); // => true
 * isSchemaCoordinateNode(document); // => false
 * ```
 */

function isSchemaCoordinateNode(node) {
  return (
    node.kind === _kinds.Kind.TYPE_COORDINATE ||
    node.kind === _kinds.Kind.MEMBER_COORDINATE ||
    node.kind === _kinds.Kind.ARGUMENT_COORDINATE ||
    node.kind === _kinds.Kind.DIRECTIVE_COORDINATE ||
    node.kind === _kinds.Kind.DIRECTIVE_ARGUMENT_COORDINATE
  );
}
