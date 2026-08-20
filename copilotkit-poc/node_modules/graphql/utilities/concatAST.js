'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.concatAST = concatAST;

var _kinds = require('../language/kinds.js');

/** @category AST Utilities */

/**
 * Provided a collection of ASTs, presumably each from different files,
 * concatenate the ASTs together into batched AST, useful for validating many
 * GraphQL source files which together represent one conceptual application.
 * @param documents - Document ASTs to concatenate.
 * @returns A document AST containing all definitions from the provided documents.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { concatAST } from 'graphql/utilities';
 *
 * const document = concatAST([parse('type Query { a: String }'), parse('type User { id: ID }')]);
 *
 * document.definitions.length; // => 2
 * ```
 */
function concatAST(documents) {
  const definitions = [];

  for (const doc of documents) {
    definitions.push(...doc.definitions);
  }

  return {
    kind: _kinds.Kind.DOCUMENT,
    definitions,
  };
}
