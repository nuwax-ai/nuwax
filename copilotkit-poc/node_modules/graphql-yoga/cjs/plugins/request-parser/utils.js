"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleURLSearchParams = handleURLSearchParams;
exports.parseURLSearchParams = parseURLSearchParams;
exports.isContentTypeMatch = isContentTypeMatch;
const fetch_1 = require("@whatwg-node/fetch");
function handleURLSearchParams(searchParams) {
    const operationName = searchParams.get('operationName') || undefined;
    const query = searchParams.get('query') || undefined;
    const variablesStr = searchParams.get('variables') || undefined;
    const extensionsStr = searchParams.get('extensions') || undefined;
    return {
        operationName,
        query,
        variables: variablesStr ? JSON.parse(variablesStr) : undefined,
        extensions: extensionsStr ? JSON.parse(extensionsStr) : undefined,
    };
}
function parseURLSearchParams(requestBody) {
    const searchParams = new fetch_1.URLSearchParams(requestBody);
    return handleURLSearchParams(searchParams);
}
function isContentTypeMatch(request, expectedContentType) {
    let contentType = request.headers.get('content-type');
    // a list of content-types is not valid as per HTTP spec, but some clients dont care
    contentType = contentType?.split(',')[0] || null;
    return (contentType === expectedContentType || !!contentType?.startsWith(`${expectedContentType};`));
}
