import { assertUserIdentity, CoreEventFactory } from '@segment/analytics-core'
import { createMessageId } from '../lib/get-message-id'
import { SegmentEvent } from './types'

// use declaration merging to downcast CoreSegmentEvent without adding any runtime code.
// if/when we decide to add an actual implementation to NodeEventFactory that actually changes the event shape, we can remove this.
export interface NodeEventFactory {
  alias(...args: Parameters<CoreEventFactory['alias']>): SegmentEvent
  group(...args: Parameters<CoreEventFactory['group']>): SegmentEvent
  identify(...args: Parameters<CoreEventFactory['identify']>): SegmentEvent
  track(...args: Parameters<CoreEventFactory['track']>): SegmentEvent
  page(...args: Parameters<CoreEventFactory['page']>): SegmentEvent
  screen(...args: Parameters<CoreEventFactory['screen']>): SegmentEvent
}

export class NodeEventFactory extends CoreEventFactory {
  constructor() {
    super({
      createMessageId,
      onFinishedEvent: (event) => {
        assertUserIdentity(event)
      },
    })
  }
}
