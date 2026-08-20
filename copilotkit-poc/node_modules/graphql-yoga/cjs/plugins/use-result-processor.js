"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResultProcessors = useResultProcessors;
const core_1 = require("@envelop/core");
const accept_js_1 = require("./result-processor/accept.js");
const multipart_js_1 = require("./result-processor/multipart.js");
const regular_js_1 = require("./result-processor/regular.js");
const sse_js_1 = require("./result-processor/sse.js");
const multipart = {
    mediaTypes: ['multipart/mixed'],
    asyncIterables: true,
    processResult: multipart_js_1.processMultipartResult,
};
function getSSEProcessorConfig() {
    return {
        mediaTypes: ['text/event-stream'],
        asyncIterables: true,
        processResult: (0, sse_js_1.getSSEProcessor)(),
    };
}
const regular = {
    mediaTypes: ['application/graphql-response+json', 'application/json'],
    asyncIterables: false,
    processResult: regular_js_1.processRegularResult,
};
function useResultProcessors() {
    const isSubscriptionRequestMap = new WeakMap();
    const sse = getSSEProcessorConfig();
    const defaultList = [sse, multipart, regular];
    const subscriptionList = [sse, regular];
    return {
        onSubscribe({ args: { contextValue } }) {
            if (contextValue.request) {
                isSubscriptionRequestMap.set(contextValue.request, true);
            }
        },
        onResultProcess({ request, result, acceptableMediaTypes, setResultProcessor }) {
            const isSubscriptionRequest = isSubscriptionRequestMap.get(request);
            const processorConfigList = isSubscriptionRequest ? subscriptionList : defaultList;
            const requestMediaTypes = (0, accept_js_1.getMediaTypesForRequestInOrder)(request);
            const isAsyncIterableResult = (0, core_1.isAsyncIterable)(result);
            for (const resultProcessorConfig of processorConfigList) {
                for (const requestMediaType of requestMediaTypes) {
                    if (isAsyncIterableResult && !resultProcessorConfig.asyncIterables) {
                        continue;
                    }
                    for (const processorMediaType of resultProcessorConfig.mediaTypes) {
                        acceptableMediaTypes.push(processorMediaType);
                        if ((0, accept_js_1.isMatchingMediaType)(processorMediaType, requestMediaType)) {
                            setResultProcessor(resultProcessorConfig.processResult, processorMediaType);
                        }
                    }
                }
            }
        },
    };
}
