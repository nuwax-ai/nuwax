import type { CoreSegmentEvent } from '@segment/analytics-core';
type SegmentEventType = 'track' | 'page' | 'identify' | 'alias' | 'screen';
export interface SegmentEvent extends CoreSegmentEvent {
    type: SegmentEventType;
}
export {};
//# sourceMappingURL=segment-event.d.ts.map