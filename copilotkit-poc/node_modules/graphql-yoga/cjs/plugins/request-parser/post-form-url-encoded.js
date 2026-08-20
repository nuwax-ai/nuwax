"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPOSTFormUrlEncodedRequest = isPOSTFormUrlEncodedRequest;
exports.parsePOSTFormUrlEncodedRequest = parsePOSTFormUrlEncodedRequest;
const utils_js_1 = require("./utils.js");
function isPOSTFormUrlEncodedRequest(request) {
    return (request.method === 'POST' && (0, utils_js_1.isContentTypeMatch)(request, 'application/x-www-form-urlencoded'));
}
function parsePOSTFormUrlEncodedRequest(request) {
    return request.text().then(utils_js_1.parseURLSearchParams);
}
