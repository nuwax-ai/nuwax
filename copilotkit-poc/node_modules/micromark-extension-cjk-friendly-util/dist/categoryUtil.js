// src/categoryUtil.ts
import { constants as constants2 } from "micromark-util-symbol";

// src/classifyCharacter.ts
import { markdownLineEndingOrSpace } from "micromark-util-character";
import { codes, constants } from "micromark-util-symbol";
var constantsEx;
((constantsEx2) => {
  constantsEx2.spaceOrPunctuation = 3;
  constantsEx2.cjk = 4096;
  constantsEx2.cjkPunctuation = 4098;
  constantsEx2.ivs = 8192;
  constantsEx2.cjkOrIvs = 12288;
  constantsEx2.nonEmojiGeneralUseVS = 16384;
  constantsEx2.variationSelector = 24576;
  constantsEx2.ivsToCjkRightShift = 1;
})(constantsEx || (constantsEx = {}));

// src/categoryUtil.ts
function isUnicodeWhitespace(category) {
  return Boolean(category & constants2.characterGroupWhitespace);
}
function isNonCjkPunctuation(category) {
  return (category & constantsEx.cjkPunctuation) === constants2.characterGroupPunctuation;
}
function isCjk(category) {
  return Boolean(category & constantsEx.cjk);
}
function isIvs(category) {
  return category === constantsEx.ivs;
}
function isCjkOrIvs(category) {
  return Boolean(category & constantsEx.cjkOrIvs);
}
function isNonEmojiGeneralUseVS(category) {
  return category === constantsEx.nonEmojiGeneralUseVS;
}
function isSpaceOrPunctuation(category) {
  return Boolean(category & constantsEx.spaceOrPunctuation);
}
export {
  isCjk,
  isCjkOrIvs,
  isIvs,
  isNonCjkPunctuation,
  isNonEmojiGeneralUseVS,
  isSpaceOrPunctuation,
  isUnicodeWhitespace
};
