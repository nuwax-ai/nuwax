"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGETRequest = isGETRequest;
exports.parseGETRequest = parseGETRequest;
const fetch_1 = require("@whatwg-node/fetch");
const utils_js_1 = require("./utils.js");
function isGETRequest(request) {
    return request.method === 'GET';
}
function parseGETRequest(request) {
    const queryString = request.url.substring(request.url.indexOf('?') + 1);
    const searchParams = new fetch_1.URLSearchParams(queryString);
    return (0, utils_js_1.handleURLSearchParams)(searchParams);
}
