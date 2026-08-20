import { CoreSegmentEvent } from '../events';
export declare function assertUserIdentity(event: CoreSegmentEvent): void;
export declare function assertEventExists(event?: CoreSegmentEvent | null): asserts event is CoreSegmentEvent;
export declare function assertEventType(event: CoreSegmentEvent): void;
export declare function assertTrackEventName(event: CoreSegmentEvent): void;
export declare function assertTrackEventProperties(event: CoreSegmentEvent): void;
export declare function assertTraits(event: CoreSegmentEvent): void;
export declare function assertMessageId(event: CoreSegmentEvent): void;
export declare function validateEvent(event?: CoreSegmentEvent | null): void;
//# sourceMappingURL=assertions.d.ts.map