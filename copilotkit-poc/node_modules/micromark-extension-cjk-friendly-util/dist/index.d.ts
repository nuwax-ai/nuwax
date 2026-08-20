export { isCjk, isCjkOrIvs, isIvs, isNonCjkPunctuation, isNonEmojiGeneralUseVS, isSpaceOrPunctuation, isUnicodeWhitespace } from './categoryUtil.js';
export { classifyCharacter, classifyPrecedingCharacter, constantsEx } from './classifyCharacter.js';
export { TwoPreviousCode, isCodeHighSurrogate, isCodeLowSurrogate, tryGetCodeTwoBefore, tryGetGenuineNextCode, tryGetGenuinePreviousCode } from './codeUtil.js';
import 'micromark-util-symbol';
import 'micromark-util-types';
