import type { CoreEmitterContract } from '@segment/analytics-core';
import { Emitter } from '@segment/analytics-generic-utils';
import { Context } from './context';
import type { AnalyticsSettings } from './settings';
import { SegmentEvent } from './types';
/**
 * Map of emitter event names to method args.
 */
export type NodeEmitterEvents = CoreEmitterContract<Context> & {
    initialize: [AnalyticsSettings];
    call_after_close: [SegmentEvent];
    http_request: [
        {
            url: string;
            method: string;
            headers: Record<string, string>;
            body: string;
        }
    ];
    drained: [];
};
export declare class NodeEmitter extends Emitter<NodeEmitterEvents> {
}
//# sourceMappingURL=emitter.d.ts.map