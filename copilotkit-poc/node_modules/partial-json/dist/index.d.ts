import { Allow } from "./options";
export * from "./options";
declare class PartialJSON extends Error {
}
declare class MalformedJSON extends Error {
}
/**
 * Parse incomplete JSON
 * @param {string} jsonString Partial JSON to be parsed
 * @param {number} allowPartial Specify what types are allowed to be partial, see {@link Allow} for details
 * @returns The parsed JSON
 * @throws {PartialJSON} If the JSON is incomplete (related to the `allow` parameter)
 * @throws {MalformedJSON} If the JSON is malformed
 */
declare function parseJSON(jsonString: string, allowPartial?: number): any;
declare const parse: typeof parseJSON;
export { parse, parseJSON, PartialJSON, MalformedJSON, Allow };
//# sourceMappingURL=index.d.ts.map