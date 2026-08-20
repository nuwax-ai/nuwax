'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getOperationAST = getOperationAST;

var _kinds = require('../language/kinds.js');

/** @category Operations */

/**
 * Returns an operation AST given a document AST and optionally an operation
 * name. If a name is not provided, an operation is only returned if only one is
 * provided in the document.
 * @param documentAST - The parsed GraphQL document AST.
 * @param operationName - The optional operation name to select.
 * @returns The resolved operation ast.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { getOperationAST } from 'graphql/utilities';
 *
 * const document = parse('query GetName { name }');
 * const operation = getOperationAST(document, 'GetName');
 *
 * operation.name.value; // => 'GetName'
 * getOperationAST(document, 'Missing'); // => undefined
 * ```
 */
function getOperationAST(documentAST, operationName) {
  let operation = null;

  for (const definition of documentAST.definitions) {
    if (definition.kind === _kinds.Kind.OPERATION_DEFINITION) {
      var _definition$name;

      if (operationName == null) {
        // If no operation name was provided, only return an Operation if there
        // is one defined in the document. Upon encountering the second, return
        // null.
        if (operation) {
          return null;
        }

        operation = definition;
      } else if (
        ((_definition$name = definition.name) === null ||
        _definition$name === void 0
          ? void 0
          : _definition$name.value) === operationName
      ) {
        return definition;
      }
    }
  }

  return operation;
}
