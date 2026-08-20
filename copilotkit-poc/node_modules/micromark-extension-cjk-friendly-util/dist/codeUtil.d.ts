import { Code, Point, TokenizeContext } from 'micromark-util-types';

/**
 * Check if the given code is a [High-Surrogate Code Unit](https://www.unicode.org/glossary/#high_surrogate_code_unit).
 *
 * A High-Surrogate Code Unit is the _first_ half of a [Surrogate Pair](https://www.unicode.org/glossary/#surrogate_pair).
 *
 * @param code Code.
 * @returns `true` if the code is a High-Surrogate Code Unit, `false` otherwise.
 */
declare function isCodeHighSurrogate(code: Code): code is Exclude<Code, null>;
/**
 * Check if the given code is a [Low-Surrogate Code Unit](https://www.unicode.org/glossary/#low_surrogate_code_unit).
 *
 * A Low-Surrogate Code Unit is the _second_ half of a [Surrogate Pair](https://www.unicode.org/glossary/#surrogate_pair).
 * @param code
 *   The character code to check.
 * @returns
 *   True if the code is a Low-Surrogate Code Unit, false otherwise.
 */
declare function isCodeLowSurrogate(code: Code): code is Exclude<Code, null>;
/**
 * If `code` is a [Low-Surrogate Code Unit](https://www.unicode.org/glossary/#low_surrogate_code_unit), try to get a genuine previous [Unicode Scalar Value](https://www.unicode.org/glossary/#unicode_scalar_value) corresponding to the Low-Surrogate Code Unit.
 * @param code a tentative previous [code unit](https://www.unicode.org/glossary/#code_unit) less than 65,536, including a Low-Surrogate one
 * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
 * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
 * @returns a value greater than 65,535 if the previous code point represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), or `code` otherwise
 */
declare function tryGetGenuinePreviousCode(code: Exclude<Code, null>, nowPoint: Point, sliceSerialize: TokenizeContext["sliceSerialize"]): Exclude<Code, null>;
/**
 * Try to get the [Unicode Code Point](https://www.unicode.org/glossary/#code_point) two positions before the current position.
 *
 * @param previousCode a previous code point. Should be greater than 65,535 if it represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character).
 * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
 * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
 * @returns a value greater than 65,535 if the code point two positions before represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), a value less than 65,536 for a [BMP Character](https://www.unicode.org/glossary/#bmp_character), or `null` if not found
 */
declare function tryGetCodeTwoBefore(previousCode: Exclude<Code, null>, nowPoint: Point, sliceSerialize: TokenizeContext["sliceSerialize"]): Code;
/**
 * Lazily get the [Unicode Code Point](https://www.unicode.org/glossary/#code_point) two positions before the current position only if necessary.
 *
 * @see {@link tryGetCodeTwoBefore}
 */
declare class TwoPreviousCode {
    readonly previousCode: Exclude<Code, null>;
    readonly nowPoint: Point;
    readonly sliceSerialize: TokenizeContext["sliceSerialize"];
    private cachedValue;
    /**
     * @see {@link tryGetCodeTwoBefore}
     *
     * @param previousCode a previous code point. Should be greater than 65,535 if it represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character).
     * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
     * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
     */
    constructor(previousCode: Exclude<Code, null>, nowPoint: Point, sliceSerialize: TokenizeContext["sliceSerialize"]);
    /**
     * Returns the return value of {@link tryGetCodeTwoBefore}.
     *
     * If the value has not been computed yet, it will be computed and cached.
     *
     * @see {@link tryGetCodeTwoBefore}
     *
     * @returns a value greater than 65,535 if the code point two positions before represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), a value less than 65,536 for a [BMP Character](https://www.unicode.org/glossary/#bmp_character), or `null` if not found
     */
    value(): Code;
}
/**
 * If `code` is a [High-Surrogate Code Unit](https://www.unicode.org/glossary/#high_surrogate_code_unit), try to get a genuine next [Unicode Scalar Value](https://www.unicode.org/glossary/#unicode_scalar_value) corresponding to the High-Surrogate Code Unit.
 * @param code a tentative next [code unit](https://www.unicode.org/glossary/#code_unit) less than 65,536, including a High-Surrogate one
 * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
 * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
 * @returns a value greater than 65,535 if the next code point represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), or `code` otherwise
 */
declare function tryGetGenuineNextCode(code: Exclude<Code, null>, nowPoint: Point, sliceSerialize: TokenizeContext["sliceSerialize"]): Exclude<Code, null>;

export { TwoPreviousCode, isCodeHighSurrogate, isCodeLowSurrogate, tryGetCodeTwoBefore, tryGetGenuineNextCode, tryGetGenuinePreviousCode };
