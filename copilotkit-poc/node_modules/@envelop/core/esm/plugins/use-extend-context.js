import { handleMaybePromise } from '@whatwg-node/promise-helpers';
export const useExtendContext = (contextFactory) => ({
    onContextBuilding({ context, extendContext }) {
        return handleMaybePromise(() => contextFactory(context), result => extendContext(result));
    },
});
