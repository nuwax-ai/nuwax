"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationASTFromRequest = void 0;
exports.getOperationASTFromDocument = getOperationASTFromDocument;
const graphql_1 = require("graphql");
const memoize_js_1 = require("./memoize.js");
function getOperationASTFromDocument(documentNode, operationName) {
    const doc = (0, graphql_1.getOperationAST)(documentNode, operationName);
    if (!doc) {
        throw new Error(`Cannot infer operation ${operationName || ''}`);
    }
    return doc;
}
exports.getOperationASTFromRequest = (0, memoize_js_1.memoize1)(function getOperationASTFromRequest(request) {
    return getOperationASTFromDocument(request.document, request.operationName);
});
