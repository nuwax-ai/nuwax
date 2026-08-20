"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMultipartResult = processMultipartResult;
const core_1 = require("@envelop/core");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const server_1 = require("@whatwg-node/server");
const error_js_1 = require("../../error.js");
const stringify_js_1 = require("./stringify.js");
function processMultipartResult(result, fetchAPI) {
    const headersInit = {
        Connection: 'keep-alive',
        'Content-Type': 'multipart/mixed; boundary="-"',
        'Transfer-Encoding': 'chunked',
    };
    const responseInit = (0, error_js_1.getResponseInitByRespectingErrors)(result, headersInit);
    let iterator;
    const textEncoder = new fetchAPI.TextEncoder();
    const readableStream = new fetchAPI.ReadableStream({
        start(controller) {
            if ((0, core_1.isAsyncIterable)(result)) {
                iterator = result[Symbol.asyncIterator]();
            }
            else {
                let finished = false;
                iterator = {
                    next: () => {
                        if (finished) {
                            return (0, server_1.fakePromise)({ done: true, value: null });
                        }
                        finished = true;
                        return (0, server_1.fakePromise)({ done: false, value: result });
                    },
                };
            }
            controller.enqueue(textEncoder.encode('\r\n'));
            controller.enqueue(textEncoder.encode(`---`));
        },
        pull(controller) {
            return (0, promise_helpers_1.handleMaybePromise)(() => iterator.next(), ({ done, value }) => {
                if (value != null) {
                    controller.enqueue(textEncoder.encode('\r\n'));
                    controller.enqueue(textEncoder.encode('Content-Type: application/json; charset=utf-8'));
                    controller.enqueue(textEncoder.encode('\r\n'));
                    const chunk = (0, stringify_js_1.jsonStringifyResultWithoutInternals)(value);
                    const encodedChunk = textEncoder.encode(chunk);
                    controller.enqueue(textEncoder.encode('Content-Length: ' + encodedChunk.byteLength));
                    controller.enqueue(textEncoder.encode('\r\n'));
                    controller.enqueue(textEncoder.encode('\r\n'));
                    controller.enqueue(encodedChunk);
                    controller.enqueue(textEncoder.encode('\r\n'));
                    controller.enqueue(textEncoder.encode('---'));
                }
                if (done) {
                    controller.enqueue(textEncoder.encode('--\r\n'));
                    controller.close();
                }
            }, err => {
                controller.error(err);
            });
        },
        cancel(e) {
            if (iterator.return) {
                return (0, promise_helpers_1.handleMaybePromise)(() => iterator.return?.(e), () => { });
            }
        },
    });
    return new fetchAPI.Response(readableStream, responseInit);
}
