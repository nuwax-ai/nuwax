import { CoreEventQueue, PriorityQueue } from '@segment/analytics-core';
class NodePriorityQueue extends PriorityQueue {
    constructor() {
        super(1, []);
    }
    // do not use an internal "seen" map
    getAttempts(ctx) {
        return ctx.attempts ?? 0;
    }
    updateAttempts(ctx) {
        ctx.attempts = this.getAttempts(ctx) + 1;
        return this.getAttempts(ctx);
    }
}
export class NodeEventQueue extends CoreEventQueue {
    constructor() {
        super(new NodePriorityQueue());
    }
}
//# sourceMappingURL=event-queue.js.map