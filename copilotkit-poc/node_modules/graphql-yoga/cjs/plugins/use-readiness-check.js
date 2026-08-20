"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReadinessCheck = useReadinessCheck;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
/**
 * Adds a readiness check for Yoga by simply implementing the `check` option.
 */
function useReadinessCheck({ endpoint = '/ready', check, }) {
    let urlPattern;
    return {
        onYogaInit({ yoga }) {
            urlPattern = new yoga.fetchAPI.URLPattern({ pathname: endpoint });
        },
        onRequest({ request, endResponse, fetchAPI, url }) {
            if (request.url.endsWith(endpoint) || url.pathname === endpoint || urlPattern.test(url)) {
                return (0, promise_helpers_1.handleMaybePromise)(() => check({ request, fetchAPI }), readyOrResponse => {
                    let response;
                    if (typeof readyOrResponse === 'object') {
                        response = readyOrResponse;
                    }
                    else {
                        response = new fetchAPI.Response(null, {
                            status: readyOrResponse === false ? 503 : 200,
                        });
                    }
                    endResponse(response);
                }, err => {
                    const isError = err instanceof Error;
                    const response = new fetchAPI.Response(isError ? err.message : null, {
                        status: 503,
                        headers: isError ? { 'content-type': 'text/plain; charset=utf-8' } : {},
                    });
                    endResponse(response);
                });
            }
        },
    };
}
