var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
  isCodeHighSurrogate,
  isCodeLowSurrogate,
  tryGetCodeTwoBefore,
  tryGetGenuineNextCode,
  tryGetGenuinePreviousCode
};
