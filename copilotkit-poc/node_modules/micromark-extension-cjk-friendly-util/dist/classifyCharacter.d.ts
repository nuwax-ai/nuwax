import { constants } from 'micromark-util-symbol';
import { Code } from 'micromark-util-types';

declare namespace constantsEx {
    const spaceOrPunctuation: 3;
    const cjk: 4096;
    const cjkPunctuation: 4098;
    const ivs: 8192;
    const cjkOrIvs: 12288;
    const nonEmojiGeneralUseVS: 16384;
    const variationSelector: 24576;
    const ivsToCjkRightShift: 1;
}
/**
 * Classify whether a code represents whitespace, punctuation, or something
 * else.
 *
 * Used for attention (emphasis, strong), whose sequences can open or close
 * based on the class of surrounding characters.
 *
 * > 👉 **Note**: eof (`null`) is seen as whitespace.
 *
 * @param code
 *   Code.
 * @returns
 *   Group.
 */
declare function classifyCharacter(code: Code): typeof constants.characterGroupWhitespace | typeof constants.characterGroupPunctuation | typeof constantsEx.cjk | typeof constantsEx.cjkPunctuation | typeof constantsEx.ivs | typeof constantsEx.nonEmojiGeneralUseVS | 0;
/**}
 * Classify whether a code represents whitespace, punctuation, or something else.
 *
 * Recognizes general-use variation selectors. Use this instead of {@linkcode classifyCharacter} for previous character.
 *
 * @param before result of {@linkcode classifyCharacter} of the preceding character.
 * @param get2Previous a function that returns the code point of the character before the preceding character. Use lambda or {@linkcode Function.prototype.bind}.
 * @param previous code point of the preceding character
 * @returns
 *   Group of the main code point of the preceding character. Use `isCjkOrIvs` to check whether it is CJK
 */
declare function classifyPrecedingCharacter(before: ReturnType<typeof classifyCharacter>, get2Previous: () => Code, previous: Code): ReturnType<typeof classifyCharacter>;

export { classifyCharacter, classifyPrecedingCharacter, constantsEx };
