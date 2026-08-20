"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchAndEmit = void 0;
const analytics_core_1 = require("@segment/analytics-core");
const context_1 = require("./context");
const normalizeDispatchCb = (cb) => (ctx) => {
    const failedDelivery = ctx.failedDelivery();
    return failedDelivery ? cb(failedDelivery.reason, ctx) : cb(undefined, ctx);
};
/* Dispatch function, but swallow promise rejections and use event emitter instead */
const dispatchAndEmit = async (event, queue, emitter, callback) => {
    try {
        const context = new context_1.Context(event);
        const ctx = await (0, analytics_core_1.dispatch)(context, queue, emitter, {
            ...(callback ? { callback: normalizeDispatchCb(callback) } : {}),
        });
        const failedDelivery = ctx.failedDelivery();
        if (failedDelivery) {
            emitter.emit('error', {
                code: 'delivery_failure',
                reason: failedDelivery.reason,
                ctx: ctx,
            });
        }
        else {
            emitter.emit(event.type, ctx);
        }
    }
    catch (err) {
        emitter.emit('error', {
            code: 'unknown',
            reason: err,
        });
    }
};
exports.dispatchAndEmit = dispatchAndEmit;
//# sourceMappingURL=dispatch-emit.js.map