"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExtendContext = void 0;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const useExtendContext = (contextFactory) => ({
    onContextBuilding({ context, extendContext }) {
        return (0, promise_helpers_1.handleMaybePromise)(() => contextFactory(context), result => extendContext(result));
    },
});
exports.useExtendContext = useExtendContext;
