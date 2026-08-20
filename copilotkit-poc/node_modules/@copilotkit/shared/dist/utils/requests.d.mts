//#region src/utils/requests.d.ts
/**
 * Safely read a Response/Request body with sensible defaults:
 * - clones the response/request to avoid consuming the original response/request
 * - Skips GET/HEAD
 * - Tries JSON first regardless of content-type
 * - Falls back to text and optionally parses when it "looks" like JSON
 */
declare function readBody<T extends Response | Request>(r: T): Promise<unknown>;
//#endregion
export { readBody };
//# sourceMappingURL=requests.d.mts.map