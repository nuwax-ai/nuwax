import { uuid } from '../../lib/uuid';
const MAX_EVENT_SIZE_IN_KB = 32;
const MAX_BATCH_SIZE_IN_KB = 480; //  (500 KB is the limit, leaving some padding)
export class ContextBatch {
    id = uuid();
    items = [];
    sizeInBytes = 0;
    maxEventCount;
    constructor(maxEventCount) {
        this.maxEventCount = Math.max(1, maxEventCount);
    }
    tryAdd(item) {
        if (this.length === this.maxEventCount)
            return {
                success: false,
                message: `Event limit of ${this.maxEventCount} has been exceeded.`,
            };
        const eventSize = this.calculateSize(item.context);
        if (eventSize > MAX_EVENT_SIZE_IN_KB * 1024) {
            return {
                success: false,
                message: `Event exceeds maximum event size of ${MAX_EVENT_SIZE_IN_KB} KB`,
            };
        }
        if (this.sizeInBytes + eventSize > MAX_BATCH_SIZE_IN_KB * 1024) {
            return {
                success: false,
                message: `Event has caused batch size to exceed ${MAX_BATCH_SIZE_IN_KB} KB`,
            };
        }
        this.items.push(item);
        this.sizeInBytes += eventSize;
        return { success: true };
    }
    get length() {
        return this.items.length;
    }
    calculateSize(ctx) {
        return encodeURI(JSON.stringify(ctx.event)).split(/%..|i/).length;
    }
    getEvents() {
        const events = this.items.map(({ context }) => context.event);
        return events;
    }
    getContexts() {
        return this.items.map((item) => item.context);
    }
    resolveEvents() {
        this.items.forEach(({ resolver, context }) => resolver(context));
    }
}
//# sourceMappingURL=context-batch.js.map