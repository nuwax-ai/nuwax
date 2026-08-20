import { classifyCharacter } from './classifyCharacter.js';
import 'micromark-util-symbol';
import 'micromark-util-types';

type Category = ReturnType<typeof classifyCharacter>;
/**
 * `true` if the code point represents an [Unicode whitespace character](https://spec.commonmark.org/0.31.2/#unicode-whitespace-character).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents an Unicode whitespace character
 */
declare function isUnicodeWhitespace(category: Category): boolean;
/**
 * `true` if the code point represents a [non-CJK punctuation character](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md#non-cjk-punctuation-character).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents a non-CJK punctuation character
 */
declare function isNonCjkPunctuation(category: Category): boolean;
/**
 * `true` if the code point represents a [CJK character](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md#cjk-character).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents a CJK character
 */
declare function isCjk(category: Category): boolean;
/**
 * `true` if the code point represents an [Ideographic Variation Selector](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md#ideographi-variation-selector).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents an IVS
 */
declare function isIvs(category: Category): boolean;
/**
 * `true` if {@link isCjk} or {@link isIvs}.
 *
 * @param category the return value of {@link classifyCharacter}.
 * @returns `true` if the code point represents a CJK or IVS
 */
declare function isCjkOrIvs(category: Category): boolean;
/**
 * `true` if the code point represents a [Non-emoji General-use Variation Selector](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md#non-emoji-general-use-variation-selector).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents an Non-emoji General-use Variation Selector
 */
declare function isNonEmojiGeneralUseVS(category: Category): boolean;
/**
 * `true` if the code point represents an [Unicode whitespace character](https://spec.commonmark.org/0.31.2/#unicode-whitespace-character) or an [Unicode punctuation character](https://spec.commonmark.org/0.31.2/#unicode-punctuation-character).
 *
 * @param category the return value of `classifyCharacter`.
 * @returns `true` if the code point represents a space or punctuation
 */
declare function isSpaceOrPunctuation(category: Category): boolean;

export { isCjk, isCjkOrIvs, isIvs, isNonCjkPunctuation, isNonEmojiGeneralUseVS, isSpaceOrPunctuation, isUnicodeWhitespace };
