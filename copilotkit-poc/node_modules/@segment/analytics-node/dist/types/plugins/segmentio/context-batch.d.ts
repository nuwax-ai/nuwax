import type { Context } from '../../app/context';
import { SegmentEvent } from '../../app/types';
interface PendingItem {
    resolver: (ctx: Context) => void;
    context: Context;
}
export declare class ContextBatch {
    id: string;
    private items;
    private sizeInBytes;
    private maxEventCount;
    constructor(maxEventCount: number);
    tryAdd(item: PendingItem): {
        success: true;
    } | {
        success: false;
        message: string;
    };
    get length(): number;
    private calculateSize;
    getEvents(): SegmentEvent[];
    getContexts(): Context[];
    resolveEvents(): void;
}
export {};
//# sourceMappingURL=context-batch.d.ts.map