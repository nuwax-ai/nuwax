'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getLocation = getLocation;

var _invariant = require('../jsutils/invariant.js');

/** @category Source */
const LineRegExp = /\r\n|[\n\r]/g;
/** Represents a location in a Source. */

/**
 * Takes a Source and a UTF-8 character offset, and returns the corresponding
 * line and column as a SourceLocation.
 * @param source - The source document that contains the position.
 * @param position - The UTF-8 character offset in the source body.
 * @returns The 1-indexed line and column for the given source position.
 * @example
 * ```ts
 * import { Source, getLocation } from 'graphql/language';
 *
 * const source = new Source('type Query { hello: String }');
 * const location = getLocation(source, 13);
 *
 * location; // => { line: 1, column: 14 }
 * ```
 */
function getLocation(source, position) {
  let lastLineStart = 0;
  let line = 1;

  for (const match of source.body.matchAll(LineRegExp)) {
    typeof match.index === 'number' || (0, _invariant.invariant)(false);

    if (match.index >= position) {
      break;
    }

    lastLineStart = match.index + match[0].length;
    line += 1;
  }

  return {
    line,
    column: position + 1 - lastLineStart,
  };
}
