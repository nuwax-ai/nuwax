"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useErrorHandler = void 0;
const utils_js_1 = require("../utils.js");
const use_masked_errors_js_1 = require("./use-masked-errors.js");
const makeHandleResult = (errorHandler) => ({ result, args }) => {
    const errors = result.errors ? [...result.errors] : [];
    if ('incremental' in result && result.incremental) {
        for (const increment of result.incremental) {
            if (increment.errors) {
                errors.push(...increment.errors);
            }
        }
    }
    if (errors.length) {
        errorHandler({ errors, context: args, phase: 'execution' });
    }
};
const useErrorHandler = (errorHandler) => {
    const handleResult = makeHandleResult(errorHandler);
    return {
        onParse() {
            return function onParseEnd({ result, context }) {
                if (result instanceof Error) {
                    errorHandler({ errors: [result], context, phase: 'parse' });
                }
            };
        },
        onValidate() {
            return function onValidateEnd({ valid, result, context }) {
                if (valid === false && result.length > 0) {
                    errorHandler({
                        errors: result,
                        context,
                        phase: 'validate',
                    });
                }
            };
        },
        onPluginInit({ registerContextErrorHandler }) {
            registerContextErrorHandler(({ error, context }) => {
                if ((0, use_masked_errors_js_1.isGraphQLError)(error)) {
                    errorHandler({ errors: [error], context, phase: 'context' });
                }
                else {
                    errorHandler({
                        // @ts-expect-error its not an error at this point so we just create a new one - can we handle this better?
                        errors: [new Error(error)],
                        context,
                        phase: 'context',
                    });
                }
            });
        },
        onExecute() {
            return {
                onExecuteDone(payload) {
                    return (0, utils_js_1.handleStreamOrSingleExecutionResult)(payload, handleResult);
                },
            };
        },
        onSubscribe() {
            return {
                onSubscribeResult(payload) {
                    return (0, utils_js_1.handleStreamOrSingleExecutionResult)(payload, handleResult);
                },
            };
        },
    };
};
exports.useErrorHandler = useErrorHandler;
