"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executorFromSchema = void 0;
exports.normalizedExecutor = normalizedExecutor;
const graphql_1 = require("graphql");
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const execute_js_1 = require("./execute.js");
function normalizedExecutor(args) {
    const operationAST = (0, graphql_1.getOperationAST)(args.document, args.operationName);
    if (operationAST == null) {
        throw new Error('Must provide an operation.');
    }
    if (operationAST.operation === 'subscription') {
        return (0, execute_js_1.subscribe)(args);
    }
    return (0, promise_helpers_1.handleMaybePromise)(() => (0, execute_js_1.execute)(args), result => {
        if ((0, execute_js_1.isIncrementalResults)(result)) {
            return (0, execute_js_1.flattenIncrementalResults)(result);
        }
        return result;
    });
}
exports.executorFromSchema = (0, utils_1.memoize1)(function executorFromSchema(schema) {
    return function schemaExecutor(request) {
        return normalizedExecutor({
            schema,
            document: request.document,
            variableValues: request.variables,
            operationName: request.operationName,
            rootValue: request.rootValue,
            contextValue: request.context,
            signal: request.signal || request.info?.signal,
            schemaCoordinateInErrors: request.schemaCoordinateInErrors,
        });
    };
});
