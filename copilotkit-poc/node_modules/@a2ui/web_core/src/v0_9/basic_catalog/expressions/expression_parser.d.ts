import { DynamicValue } from '../../schema/common-types.js';
/**
 * A parser for A2UI expressions, supporting string interpolation and functional calls.
 *
 * The parser converts strings with `${...}` placeholders into arrays of `DynamicValue`s.
 * It supports literals (strings, numbers, booleans), path-based data bindings, and
 * nested function calls with named arguments.
 */
export declare class ExpressionParser {
    /** The maximum allowed recursion depth for nested expressions to prevent stack overflows. */
    private static readonly MAX_DEPTH;
    /**
     * Parses an input string into an array of DynamicValues.
     * If the input contains no interpolation, it returns the raw string as a single literal.
     */
    parse(input: string, depth?: number): DynamicValue[];
    private extractInterpolationContent;
    /**
     * Parses a single expression string into a DynamicValue.
     *
     * Unlike `parse()`, which handles mixed literal text and interpolations,
     * this assumes the entire string is a single expression (e.g., as found inside `${...}`).
     *
     * @param expr The expression string to parse.
     * @param depth The current recursion depth.
     * @returns The resolved DynamicValue.
     */
    parseExpression(expr: string, depth?: number): DynamicValue;
    private parseExpressionInternal;
    private scanPathOrIdentifier;
    private parseFunctionCall;
    private scanIdentifier;
    private parseStringLiteral;
    private parseNumberLiteral;
    private isAlnum;
    private isDigit;
}
//# sourceMappingURL=expression_parser.d.ts.map