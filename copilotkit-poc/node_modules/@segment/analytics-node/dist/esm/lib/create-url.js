const stripTrailingSlash = (str) => str.replace(/\/$/, '');
/**
 *
 * @param host e.g. "http://foo.com"
 * @param path e.g. "/bar"
 * @returns "e.g." "http://foo.com/bar"
 */
export const tryCreateFormattedUrl = (host, path) => {
    return stripTrailingSlash(new URL(path || '', host).href);
};
//# sourceMappingURL=create-url.js.map