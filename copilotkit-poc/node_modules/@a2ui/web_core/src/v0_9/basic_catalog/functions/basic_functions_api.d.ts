import { z } from 'zod';
/**
 * Adds two numbers.
 *
 * Arguments:
 * - `a`: The first number.
 * - `b`: The second number.
 */
export declare const AddApi: {
    name: "add";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Subtracts one number from another.
 *
 * Arguments:
 * - `a`: The number to subtract from.
 * - `b`: The number to subtract.
 */
export declare const SubtractApi: {
    name: "subtract";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Multiplies two numbers.
 *
 * Arguments:
 * - `a`: The first number.
 * - `b`: The second number.
 */
export declare const MultiplyApi: {
    name: "multiply";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Divides one number by another.
 *
 * Arguments:
 * - `a`: The dividend.
 * - `b`: The divisor.
 */
export declare const DivideApi: {
    name: "divide";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Checks if two values are equal.
 *
 * Arguments:
 * - `a`: The first value.
 * - `b`: The second value.
 */
export declare const EqualsApi: {
    name: "equals";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodAny, any, any>;
        b: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        a?: any;
        b?: any;
    }, {
        a?: any;
        b?: any;
    }>;
};
/**
 * Checks if two values are not equal.
 *
 * Arguments:
 * - `a`: The first value.
 * - `b`: The second value.
 */
export declare const NotEqualsApi: {
    name: "not_equals";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodAny, any, any>;
        b: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        a?: any;
        b?: any;
    }, {
        a?: any;
        b?: any;
    }>;
};
/**
 * Checks if the first number is greater than the second.
 *
 * Arguments:
 * - `a`: The number to compare.
 * - `b`: The threshold number.
 */
export declare const GreaterThanApi: {
    name: "greater_than";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Checks if the first number is less than the second.
 *
 * Arguments:
 * - `a`: The number to compare.
 * - `b`: The threshold number.
 */
export declare const LessThanApi: {
    name: "less_than";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
};
/**
 * Performs a logical AND operation on a list of boolean values.
 *
 * Arguments:
 * - `values`: List of items to evaluate (minimum 2).
 */
export declare const AndApi: {
    name: "and";
    returnType: "boolean";
    schema: z.ZodObject<{
        values: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        values: any[];
    }, {
        values: any[];
    }>;
};
/**
 * Performs a logical OR operation on a list of boolean values.
 *
 * Arguments:
 * - `values`: List of items to evaluate (minimum 2).
 */
export declare const OrApi: {
    name: "or";
    returnType: "boolean";
    schema: z.ZodObject<{
        values: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        values: any[];
    }, {
        values: any[];
    }>;
};
/**
 * Performs a logical NOT operation on a boolean value.
 *
 * Arguments:
 * - `value`: The value to negate.
 */
export declare const NotApi: {
    name: "not";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
    }, {
        value?: any;
    }>;
};
/**
 * Checks if a string contains a substring.
 *
 * Arguments:
 * - `string`: The source string.
 * - `substring`: The substring to search for.
 */
export declare const ContainsApi: {
    name: "contains";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        substring: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        substring: string;
    }, {
        string?: unknown;
        substring?: unknown;
    }>;
};
/**
 * Checks if a string starts with a prefix.
 *
 * Arguments:
 * - `string`: The source string.
 * - `prefix`: The prefix to search for.
 */
export declare const StartsWithApi: {
    name: "starts_with";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        prefix: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        prefix: string;
    }, {
        string?: unknown;
        prefix?: unknown;
    }>;
};
/**
 * Checks if a string ends with a suffix.
 *
 * Arguments:
 * - `string`: The source string.
 * - `suffix`: The suffix to search for.
 */
export declare const EndsWithApi: {
    name: "ends_with";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        suffix: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        suffix: string;
    }, {
        string?: unknown;
        suffix?: unknown;
    }>;
};
/**
 * Checks that the value is not null, undefined, or empty.
 *
 * Arguments:
 * - `value`: The value to check.
 */
export declare const RequiredApi: {
    name: "required";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
    }, {
        value?: any;
    }>;
};
/**
 * Checks that the value matches a regular expression string.
 *
 * Arguments:
 * - `value`: The string to test.
 * - `pattern`: The regex pattern string.
 */
export declare const RegexApi: {
    name: "regex";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodString, string, unknown>;
        pattern: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        pattern: string;
    }, {
        value?: unknown;
        pattern?: unknown;
    }>;
};
/**
 * Checks string length constraints.
 *
 * Arguments:
 * - `value`: The value to inspect.
 * - `min`: Optional minimum length.
 * - `max`: Optional maximum length.
 */
export declare const LengthApi: {
    name: "length";
    returnType: "boolean";
    schema: z.ZodEffects<z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }>;
};
/**
 * Checks numeric range constraints.
 *
 * Arguments:
 * - `value`: The value to inspect.
 * - `min`: Optional minimum value.
 * - `max`: Optional maximum value.
 */
export declare const NumericApi: {
    name: "numeric";
    returnType: "boolean";
    schema: z.ZodEffects<z.ZodObject<{
        value: z.ZodNumber;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }>;
};
/**
 * Checks that the value is a valid email address.
 *
 * Arguments:
 * - `value`: The string to inspect.
 */
export declare const EmailApi: {
    name: "email";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        value: string;
    }, {
        value?: unknown;
    }>;
};
/**
 * Performs string interpolation on a value, resolving model paths and functions.
 *
 * Interpolation uses the `${expression}` syntax. Supported expressions include:
 * - **JSON Pointer paths**: `${/absolute/path}` or `${relative/path}` to access data model values.
 * - **Function calls**: `${now()}` or with named arguments like `${formatDate(value:${/currentDate}, format:'MM-dd')}`.
 *
 * To include a literal `${` sequence, escape it as `\\${`.
 *
 * @example
 * "Hello ${/user/name}"
 * "Total: ${formatCurrency(value:${/total}, currency:'USD')}"
 *
 * Arguments:
 * - `value`: The string template to interpolate.
 */
export declare const FormatStringApi: {
    name: "formatString";
    returnType: "any";
    schema: z.ZodObject<{
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
    }, {
        value: string;
    }>;
};
/**
 * Formats a number with the specified grouping and decimal precision.
 *
 * Arguments:
 * - `value`: The number to format.
 * - `decimals`: Optional number of decimal places.
 * - `grouping`: Whether to use thousands separators, defaults to true.
 */
export declare const FormatNumberApi: {
    name: "formatNumber";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        decimals: z.ZodOptional<z.ZodNumber>;
        grouping: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        grouping: boolean;
        decimals?: number | undefined;
    }, {
        value: number;
        decimals?: number | undefined;
        grouping?: boolean | undefined;
    }>;
};
/**
 * Formats a number as a currency string.
 *
 * Arguments:
 * - `value`: The number to format.
 * - `currency`: Currency code (e.g. "USD"), defaults to "USD".
 * - `decimals`: Optional number of decimal places.
 * - `grouping`: Whether to use thousands separators, defaults to true.
 */
export declare const FormatCurrencyApi: {
    name: "formatCurrency";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        currency: z.ZodString;
        decimals: z.ZodOptional<z.ZodNumber>;
        grouping: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        grouping: boolean;
        currency: string;
        decimals?: number | undefined;
    }, {
        value: number;
        currency: string;
        decimals?: number | undefined;
        grouping?: boolean | undefined;
    }>;
};
/**
 * Formats a timestamp into a string using a pattern.
 *
 * Token Reference:
 * - Year: 'yy' (26), 'yyyy' (2026)
 * - Month: 'M' (1), 'MM' (01), 'MMM' (Jan), 'MMMM' (January)
 * - Day: 'd' (1), 'dd' (01), 'E' (Tue), 'EEEE' (Tuesday)
 * - Hour (12h): 'h' (1-12), 'hh' (01-12) - requires 'a' for AM/PM
 * - Hour (24h): 'H' (0-23), 'HH' (00-23) - Military Time
 * - Minute: 'mm' (00-59), Second: 'ss' (00-59)
 * - Period: 'a' (AM/PM)
 *
 * Arguments:
 * - `value`: The date to format.
 * - `format`: A Unicode TR35 date pattern string.
 */
export declare const FormatDateApi: {
    name: "formatDate";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
        format: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        format: string;
        value?: any;
    }, {
        format: string;
        value?: any;
    }>;
};
/**
 * Returns a localized string based on the Common Locale Data Repository (CLDR) plural category of the count.
 *
 * Requires an 'other' fallback. For English, just use 'one' and 'other'.
 *
 * Arguments:
 * - `value`: Count to evaluate.
 * - `zero`: Optional text for count 0.
 * - `one`: Optional text for count 1.
 * - `two`: Optional text for count 2.
 * - `few`: Optional text for few items.
 * - `many`: Optional text for many items.
 * - `other`: Default text fallback.
 */
export declare const PluralizeApi: {
    name: "pluralize";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
};
/**
 * Opens the specified URL in a browser or handler. This function has no return value.
 *
 * Arguments:
 * - `url`: The address URL string.
 */
export declare const OpenUrlApi: {
    name: "openUrl";
    returnType: "void";
    schema: z.ZodObject<{
        url: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url?: unknown;
    }>;
};
/**
 * Collection containing ALL available Basic Function API descriptors.
 */
export declare const BASIC_FUNCTION_APIS: ({
    name: "add";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "subtract";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "multiply";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "divide";
    returnType: "number";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "equals";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodAny, any, any>;
        b: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        a?: any;
        b?: any;
    }, {
        a?: any;
        b?: any;
    }>;
} | {
    name: "not_equals";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodAny, any, any>;
        b: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        a?: any;
        b?: any;
    }, {
        a?: any;
        b?: any;
    }>;
} | {
    name: "greater_than";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "less_than";
    returnType: "boolean";
    schema: z.ZodObject<{
        a: z.ZodEffects<z.ZodNumber, number, unknown>;
        b: z.ZodEffects<z.ZodNumber, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        a: number;
        b: number;
    }, {
        a?: unknown;
        b?: unknown;
    }>;
} | {
    name: "and";
    returnType: "boolean";
    schema: z.ZodObject<{
        values: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        values: any[];
    }, {
        values: any[];
    }>;
} | {
    name: "or";
    returnType: "boolean";
    schema: z.ZodObject<{
        values: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        values: any[];
    }, {
        values: any[];
    }>;
} | {
    name: "not";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
    }, {
        value?: any;
    }>;
} | {
    name: "contains";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        substring: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        substring: string;
    }, {
        string?: unknown;
        substring?: unknown;
    }>;
} | {
    name: "starts_with";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        prefix: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        prefix: string;
    }, {
        string?: unknown;
        prefix?: unknown;
    }>;
} | {
    name: "ends_with";
    returnType: "boolean";
    schema: z.ZodObject<{
        string: z.ZodEffects<z.ZodString, string, unknown>;
        suffix: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        string: string;
        suffix: string;
    }, {
        string?: unknown;
        suffix?: unknown;
    }>;
} | {
    name: "required";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
    }, {
        value?: any;
    }>;
} | {
    name: "regex";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodString, string, unknown>;
        pattern: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        pattern: string;
    }, {
        value?: unknown;
        pattern?: unknown;
    }>;
} | {
    name: "length";
    returnType: "boolean";
    schema: z.ZodEffects<z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value?: any;
        min?: number | undefined;
        max?: number | undefined;
    }>;
} | {
    name: "numeric";
    returnType: "boolean";
    schema: z.ZodEffects<z.ZodObject<{
        value: z.ZodNumber;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        value: number;
        min?: number | undefined;
        max?: number | undefined;
    }>;
} | {
    name: "email";
    returnType: "boolean";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        value: string;
    }, {
        value?: unknown;
    }>;
} | {
    name: "formatString";
    returnType: "any";
    schema: z.ZodObject<{
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
    }, {
        value: string;
    }>;
} | {
    name: "formatNumber";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        decimals: z.ZodOptional<z.ZodNumber>;
        grouping: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        grouping: boolean;
        decimals?: number | undefined;
    }, {
        value: number;
        decimals?: number | undefined;
        grouping?: boolean | undefined;
    }>;
} | {
    name: "formatCurrency";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        currency: z.ZodString;
        decimals: z.ZodOptional<z.ZodNumber>;
        grouping: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        grouping: boolean;
        currency: string;
        decimals?: number | undefined;
    }, {
        value: number;
        currency: string;
        decimals?: number | undefined;
        grouping?: boolean | undefined;
    }>;
} | {
    name: "formatDate";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodEffects<z.ZodAny, any, any>;
        format: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        format: string;
        value?: any;
    }, {
        format: string;
        value?: any;
    }>;
} | {
    name: "pluralize";
    returnType: "string";
    schema: z.ZodObject<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        value: z.ZodNumber;
        zero: z.ZodOptional<z.ZodString>;
        one: z.ZodOptional<z.ZodString>;
        two: z.ZodOptional<z.ZodString>;
        few: z.ZodOptional<z.ZodString>;
        many: z.ZodOptional<z.ZodString>;
        other: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
} | {
    name: "openUrl";
    returnType: "void";
    schema: z.ZodObject<{
        url: z.ZodEffects<z.ZodString, string, unknown>;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url?: unknown;
    }>;
})[];
//# sourceMappingURL=basic_functions_api.d.ts.map