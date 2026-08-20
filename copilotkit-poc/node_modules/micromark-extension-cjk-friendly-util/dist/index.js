var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/categoryUtil.ts
import { constants as constants2 } from "micromark-util-symbol";

// src/classifyCharacter.ts
import { markdownLineEndingOrSpace } from "micromark-util-character";
import { codes, constants } from "micromark-util-symbol";

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
    return constants.characterGroupWhitespace;
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
    value |= constants.characterGroupPunctuation;
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

// src/codeUtil.ts
function isCodeHighSurrogate(code) {
  return Boolean(code && code >= 55296 && code <= 56319);
}
function isCodeLowSurrogate(code) {
  return Boolean(code && code >= 56320 && code <= 57343);
}
function tryGetGenuinePreviousCode(code, nowPoint, sliceSerialize) {
  if (nowPoint._bufferIndex < 2) {
    return code;
  }
  const previousBuffer = sliceSerialize({
    // take 2 characters (code units)
    start: { ...nowPoint, _bufferIndex: nowPoint._bufferIndex - 2 },
    end: nowPoint
  });
  const previousCandidate = previousBuffer.codePointAt(0);
  return previousCandidate && previousCandidate >= 65536 ? previousCandidate : code;
}
function tryGetCodeTwoBefore(previousCode, nowPoint, sliceSerialize) {
  const previousWidth = previousCode >= 65536 ? 2 : 1;
  if (nowPoint._bufferIndex < 1 + previousWidth) {
    return null;
  }
  const idealStart = nowPoint._bufferIndex - previousWidth - 2;
  const twoPreviousBuffer = sliceSerialize({
    // take 1--2 character
    start: {
      ...nowPoint,
      _bufferIndex: idealStart >= 0 ? idealStart : 0
    },
    end: {
      ...nowPoint,
      _bufferIndex: nowPoint._bufferIndex - previousWidth
    }
  });
  const twoPreviousLast = twoPreviousBuffer.charCodeAt(
    twoPreviousBuffer.length - 1
  );
  if (Number.isNaN(twoPreviousLast)) {
    return null;
  }
  if (twoPreviousBuffer.length < 2 || twoPreviousLast < 56320 || 57343 < twoPreviousLast) {
    return twoPreviousLast;
  }
  const twoPreviousCandidate = twoPreviousBuffer.codePointAt(0);
  if (twoPreviousCandidate && twoPreviousCandidate >= 65536) {
    return twoPreviousCandidate;
  }
  return twoPreviousLast;
}
var TwoPreviousCode = class {
  /**
   * @see {@link tryGetCodeTwoBefore}
   *
   * @param previousCode a previous code point. Should be greater than 65,535 if it represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character).
   * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
   * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
   */
  constructor(previousCode, nowPoint, sliceSerialize) {
    this.previousCode = previousCode;
    this.nowPoint = nowPoint;
    this.sliceSerialize = sliceSerialize;
    __publicField(this, "cachedValue");
  }
  /**
   * Returns the return value of {@link tryGetCodeTwoBefore}.
   *
   * If the value has not been computed yet, it will be computed and cached.
   *
   * @see {@link tryGetCodeTwoBefore}
   *
   * @returns a value greater than 65,535 if the code point two positions before represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), a value less than 65,536 for a [BMP Character](https://www.unicode.org/glossary/#bmp_character), or `null` if not found
   */
  value() {
    if (this.cachedValue === void 0) {
      this.cachedValue = tryGetCodeTwoBefore(
        this.previousCode,
        this.nowPoint,
        this.sliceSerialize
      );
    }
    return this.cachedValue;
  }
};
function tryGetGenuineNextCode(code, nowPoint, sliceSerialize) {
  const nextCandidate = sliceSerialize({
    start: nowPoint,
    end: { ...nowPoint, _bufferIndex: nowPoint._bufferIndex + 2 }
  }).codePointAt(0);
  return nextCandidate && nextCandidate >= 65536 ? nextCandidate : code;
}
export {
  TwoPreviousCode,
  classifyCharacter,
  classifyPrecedingCharacter,
  constantsEx,
  isCjk,
  isCjkOrIvs,
  isCodeHighSurrogate,
  isCodeLowSurrogate,
  isIvs,
  isNonCjkPunctuation,
  isNonEmojiGeneralUseVS,
  isSpaceOrPunctuation,
  isUnicodeWhitespace,
  tryGetCodeTwoBefore,
  tryGetGenuineNextCode,
  tryGetGenuinePreviousCode
};
