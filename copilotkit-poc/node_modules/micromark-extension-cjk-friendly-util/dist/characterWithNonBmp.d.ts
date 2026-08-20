import { Code } from 'micromark-util-types';

/**
 * Check if `uc` is CJK or IVS
 *
 * @param uc code point
 * @returns `true` if `uc` is CJK, `null` if IVS, or `false` if neither
 */
declare function cjkOrIvs(uc: Code): boolean | null;
declare function isCjkAmbiguousPunctuation(main: Code, vs: Code): boolean;
/**
 * Check whether the character code represents Non-emoji General-use Variation Selector (U+FE00-U+FE0E).
 */
declare function nonEmojiGeneralUseVS(code: Code): boolean;
/**
 * Check whether the character code represents Unicode punctuation.
 *
 * A **Unicode punctuation** is a character in the Unicode `Pc` (Punctuation,
 * Connector), `Pd` (Punctuation, Dash), `Pe` (Punctuation, Close), `Pf`
 * (Punctuation, Final quote), `Pi` (Punctuation, Initial quote), `Po`
 * (Punctuation, Other), or `Ps` (Punctuation, Open) categories, or an ASCII
 * punctuation (see `asciiPunctuation`).
 *
 * See:
 * **\[UNICODE]**:
 * [The Unicode Standard](https://www.unicode.org/versions/).
 * Unicode Consortium.
 *
 * @param code
 *   Code.
 * @returns
 *   Whether it matches.
 */
declare const unicodePunctuation: (code: Code) => boolean;
/**
 * Check whether the character code represents Unicode whitespace.
 *
 * Note that this does handle micromark specific markdown whitespace characters.
 * See `markdownLineEndingOrSpace` to check that.
 *
 * A **Unicode whitespace** is a character in the Unicode `Zs` (Separator,
 * Space) category, or U+0009 CHARACTER TABULATION (HT), U+000A LINE FEED (LF),
 * U+000C (FF), or U+000D CARRIAGE RETURN (CR) (**\[UNICODE]**).
 *
 * See:
 * **\[UNICODE]**:
 * [The Unicode Standard](https://www.unicode.org/versions/).
 * Unicode Consortium.
 *
 * @param code
 *   Code.
 * @returns
 *   Whether it matches.
 */
declare const unicodeWhitespace: (code: Code) => boolean;

export { cjkOrIvs, isCjkAmbiguousPunctuation, nonEmojiGeneralUseVS, unicodePunctuation, unicodeWhitespace };
