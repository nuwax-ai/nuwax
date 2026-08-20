// src/classifyCharacter.ts
import { markdownLineEndingOrSpace } from "micromark-util-character";
import { codes, constants as constants2 } from "micromark-util-symbol";

// src/categoryUtil.ts
import { constants } from "micromark-util-symbol";
function isUnicodeWhitespace(category) {
  return Boolean(category & constants.characterGroupWhitespace);
}
function isNonEmojiGeneralUseVS(category) {
  return category === constantsEx.nonEmojiGeneralUseVS;
}

// src/characterWithNonBmp.ts
import { eastAsianWidthType } from "get-east-asian-width";
function isEmoji(uc) {
  return /^\p{Emoji_Presentation}/u.test(String.fromCodePoint(uc));
}
function cjkOrIvs(uc) {
  if (!uc || uc < 4352) {
    return false;
  }
  const eaw = eastAsianWidthType(uc);
  switch (eaw) {
    case "fullwidth":
    case "halfwidth":
      return true;
    // never be emoji
    case "wide":
      return !isEmoji(uc);
    case "narrow":
      return false;
    case "ambiguous":
      return 917760 <= uc && uc <= 917999 ? null : false;
    case "neutral":
      return /^\p{sc=Hangul}/u.test(String.fromCodePoint(uc));
  }
}
function isCjkAmbiguousPunctuation(main, vs) {
  if (vs !== 65025 || !main || main < 8216) return false;
  return main === 8216 || main === 8217 || main === 8220 || main === 8221;
}
function nonEmojiGeneralUseVS(code) {
  return code !== null && code >= 65024 && code <= 65038;
}
var unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);
var unicodeWhitespace = regexCheck(/\s/);
function regexCheck(regex) {
  return check;
  function check(code) {
    return code !== null && code > -1 && regex.test(String.fromCodePoint(code));
  }
}

// src/classifyCharacter.ts
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
function classifyCharacter(code) {
  if (code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
    return constants2.characterGroupWhitespace;
  }
  let value = 0;
  if (code >= 4352) {
    if (nonEmojiGeneralUseVS(code)) {
      return constantsEx.nonEmojiGeneralUseVS;
    }
    switch (cjkOrIvs(code)) {
      case null:
        return constantsEx.ivs;
      case true:
        value |= constantsEx.cjk;
        break;
    }
  }
  if (unicodePunctuation(code)) {
    value |= constants2.characterGroupPunctuation;
  }
  return value;
}
function classifyPrecedingCharacter(before, get2Previous, previous) {
  if (!isNonEmojiGeneralUseVS(before)) {
    return before;
  }
  const twoPrevious = get2Previous();
  const twoBefore = classifyCharacter(twoPrevious);
  return !twoPrevious || isUnicodeWhitespace(twoBefore) ? before : isCjkAmbiguousPunctuation(twoPrevious, previous) ? constantsEx.cjkPunctuation : stripIvs(twoBefore);
}
function stripIvs(twoBefore) {
  return twoBefore & ~constantsEx.ivs;
}
export {
  classifyCharacter,
  classifyPrecedingCharacter,
  constantsEx
};
