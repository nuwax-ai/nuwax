import { ASTNode } from 'graphql';
/**
 * Checks if the given string is a valid URL.
 *
 * @param str - The string to validate as a URL
 * @returns A boolean indicating whether the string is a valid URL
 *
 * @remarks
 * This function first attempts to use the `URL.canParse` method if available.
 * If not, it falls back to creating a new `URL` object to validate the string.
 */
export declare function isUrl(str: string): boolean;
export declare const asArray: <T>(fns: T | T[]) => T[];
/**
 * Determines if a given input is a valid GraphQL document string.
 *
 * @param str - The input to validate as a GraphQL document
 * @returns A boolean indicating whether the input is a valid GraphQL document string
 *
 * @remarks
 * This function performs several validation checks:
 * - Ensures the input is a string
 * - Filters out strings with invalid document extensions
 * - Excludes URLs
 * - Attempts to parse the string as a GraphQL document
 *
 * @throws {Error} If the document fails to parse and is empty except GraphQL comments
 */
export declare function isDocumentString(str: any): boolean;
/**
 * Checkes whether the `str` contains any path illegal characters.
 *
 * A string may sometimes look like a path but is not (like an SDL of a simple
 * GraphQL schema). To make sure we don't yield false-positives in such cases,
 * we disallow new lines in paths (even though most Unix systems support new
 * lines in file names).
 */
export declare function isValidPath(str: any): boolean;
export declare function compareStrings<A, B>(a: A, b: B): 0 | 1 | -1;
export declare function nodeToString(a: ASTNode): string;
export declare function compareNodes(a: ASTNode, b: ASTNode, customFn?: (a: any, b: any) => number): number;
export declare function isSome<T>(input: T): input is Exclude<T, null | undefined>;
export declare function assertSome<T>(input: T, message?: string): asserts input is Exclude<T, null | undefined>;
