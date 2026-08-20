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
export {
  cjkOrIvs,
  isCjkAmbiguousPunctuation,
  nonEmojiGeneralUseVS,
  unicodePunctuation,
  unicodeWhitespace
};
