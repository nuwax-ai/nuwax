/**
 * Base class for all A2UI specific errors.
 *
 * Includes a machine-readable `code` for categorical handling and ensures
 * proper stack trace capturing.
 */
export declare class A2uiError extends Error {
    /** A machine-readable string identifying the error category. */
    readonly code: string;
    constructor(message: string, code?: string);
}
/**
 * Thrown when JSON validation fails or schemas are mismatched.
 */
export declare class A2uiValidationError extends A2uiError {
    readonly details?: any | undefined;
    constructor(message: string, details?: any | undefined);
}
/**
 * Thrown during DataModel mutations (invalid paths, type mismatches).
 */
export declare class A2uiDataError extends A2uiError {
    readonly path?: string | undefined;
    constructor(message: string, path?: string | undefined);
}
/**
 * Thrown during string interpolation and function evaluation.
 */
export declare class A2uiExpressionError extends A2uiError {
    readonly expression?: string | undefined;
    readonly details?: any | undefined;
    constructor(message: string, expression?: string | undefined, details?: any | undefined);
}
/**
 * Thrown for structural issues in the UI tree (missing surfaces, duplicate components).
 */
export declare class A2uiStateError extends A2uiError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map