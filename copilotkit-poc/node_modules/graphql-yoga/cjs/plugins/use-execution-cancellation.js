"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExecutionCancellation = useExecutionCancellation;
/**
 * Enables experimental support for request cancelation.
 */
function useExecutionCancellation() {
    return {
        onExecute({ args }) {
            // @ts-expect-error we don't have this typing in envelop
            args.signal = args.contextValue?.request?.signal ?? undefined;
        },
        onSubscribe({ args }) {
            // @ts-expect-error we don't have this typing in envelop
            args.signal = args.contextValue?.request?.signal ?? undefined;
        },
    };
}
