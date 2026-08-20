"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCreateFormattedUrl = void 0;
const stripTrailingSlash = (str) => str.replace(/\/$/, '');
/**
 *
 * @param host e.g. "http://foo.com"
 * @param path e.g. "/bar"
 * @returns "e.g." "http://foo.com/bar"
 */
const tryCreateFormattedUrl = (host, path) => {
    return stripTrailingSlash(new URL(path || '', host).href);
};
exports.tryCreateFormattedUrl = tryCreateFormattedUrl;
//# sourceMappingURL=create-url.js.map