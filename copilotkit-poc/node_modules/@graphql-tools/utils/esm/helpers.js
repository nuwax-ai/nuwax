import { parse } from 'graphql';
const URL_REGEXP = /^(https?|wss?|file):\/\//;
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
export function isUrl(str) {
    if (typeof str !== 'string') {
        return false;
    }
    if (!URL_REGEXP.test(str)) {
        return false;
    }
    if (URL.canParse) {
        return URL.canParse(str);
    }
    try {
        const url = new URL(str);
        return !!url;
    }
    catch (e) {
        return false;
    }
}
export const asArray = (fns) => (Array.isArray(fns) ? fns : fns ? [fns] : []);
const invalidDocRegex = /\.[a-z0-9]+$/i;
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
export function isDocumentString(str) {
    if (typeof str !== 'string') {
        return false;
    }
    // XXX: is-valid-path or is-glob treat SDL as a valid path
    // (`scalar Date` for example)
    // this why checking the extension is fast enough
    // and prevent from parsing the string in order to find out
    // if the string is a SDL
    if (invalidDocRegex.test(str) || isUrl(str)) {
        return false;
    }
    try {
        parse(str);
        return true;
    }
    catch (e) {
        if (!e.message.includes('EOF') &&
            str.replace(/(\#[^*]*)/g, '').trim() !== '' &&
            str.includes(' ')) {
            throw new Error(`Failed to parse the GraphQL document. ${e.message}\n${str}`);
        }
    }
    return false;
}
const invalidPathRegex = /[‘“!%^<>`\n]/;
/**
 * Checkes whether the `str` contains any path illegal characters.
 *
 * A string may sometimes look like a path but is not (like an SDL of a simple
 * GraphQL schema). To make sure we don't yield false-positives in such cases,
 * we disallow new lines in paths (even though most Unix systems support new
 * lines in file names).
 */
export function isValidPath(str) {
    return typeof str === 'string' && !invalidPathRegex.test(str);
}
export function compareStrings(a, b) {
    if (String(a) < String(b)) {
        return -1;
    }
    if (String(a) > String(b)) {
        return 1;
    }
    return 0;
}
export function nodeToString(a) {
    let name;
    if ('alias' in a) {
        name = a.alias?.value;
    }
    if (name == null && 'name' in a) {
        name = a.name?.value;
    }
    if (name == null) {
        name = a.kind;
    }
    return name;
}
export function compareNodes(a, b, customFn) {
    const aStr = nodeToString(a);
    const bStr = nodeToString(b);
    if (typeof customFn === 'function') {
        return customFn(aStr, bStr);
    }
    return compareStrings(aStr, bStr);
}
export function isSome(input) {
    return input != null;
}
export function assertSome(input, message = 'Value should be something') {
    if (input == null) {
        throw new Error(message);
    }
}
