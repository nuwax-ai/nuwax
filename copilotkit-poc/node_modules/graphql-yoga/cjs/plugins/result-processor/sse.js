"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSSEProcessor = getSSEProcessor;
const core_1 = require("@envelop/core");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const server_1 = require("@whatwg-node/server");
const error_js_1 = require("../../error.js");
const stringify_js_1 = require("./stringify.js");
function getSSEProcessor() {
    return function processSSEResult(result, fetchAPI) {
        let pingIntervalMs = 12_000;
        // for testing the pings, reduce the timeout
        if (globalThis.process?.env?.['NODE_ENV'] === 'test') {
            pingIntervalMs = 300;
        }
        const headersInit = {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Content-Encoding': 'none',
        };
        const responseInit = (0, error_js_1.getResponseInitByRespectingErrors)(result, headersInit, true);
        let iterator;
        let pingInterval;
        const textEncoder = new fetchAPI.TextEncoder();
        const readableStream = new fetchAPI.ReadableStream({
            start(controller) {
                // always start with a ping because some browsers dont accept a header flush
                // causing the fetch to stall until something is streamed through the response
                controller.enqueue(textEncoder.encode(':\n\n'));
                // ping client every 12 seconds to keep the connection alive
                pingInterval = setInterval(() => {
                    if (!controller.desiredSize) {
                        clearInterval(pingInterval);
                        return;
                    }
                    controller.enqueue(textEncoder.encode(':\n\n'));
                }, pingIntervalMs);
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
            },
            pull(controller) {
                return (0, promise_helpers_1.handleMaybePromise)(() => iterator.next(), result => {
                    if (result.value != null) {
                        controller.enqueue(textEncoder.encode(`event: next\n`));
                        const chunk = (0, stringify_js_1.jsonStringifyResultWithoutInternals)(result.value);
                        controller.enqueue(textEncoder.encode(`data: ${chunk}\n\n`));
                    }
                    if (result.done) {
                        controller.enqueue(textEncoder.encode(`event: complete\n`));
                        controller.enqueue(textEncoder.encode(`data:\n\n`));
                        clearInterval(pingInterval);
                        controller.close();
                    }
                }, err => {
                    controller.error(err);
                });
            },
            cancel(e) {
                clearInterval(pingInterval);
                if (iterator.return) {
                    return (0, promise_helpers_1.handleMaybePromise)(() => iterator.return?.(e), () => { });
                }
            },
        });
        return new fetchAPI.Response(readableStream, responseInit);
    };
}
