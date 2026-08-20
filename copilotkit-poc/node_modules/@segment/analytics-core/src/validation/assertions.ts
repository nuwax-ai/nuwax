import { CoreSegmentEvent } from '../events'
import { ValidationError } from './errors'
import { isString, isPlainObject, exists } from './helpers'

const stringError = 'is not a string'
const objError = 'is not an object'
const nilError = 'is nil'

// user identity check could hypothetically could be used in the browser event factory, but not 100% sure -- so this is node only for now
export function assertUserIdentity(event: CoreSegmentEvent): void {
  const USER_FIELD_NAME = '.userId/anonymousId/previousId/groupId'

  const getAnyUserId = (event: CoreSegmentEvent) =>
    event.userId ?? event.anonymousId ?? event.groupId ?? event.previousId

  const id = getAnyUserId(event)
  if (!exists(id)) {
    throw new ValidationError(USER_FIELD_NAME, nilError)
  } else if (!isString(id)) {
    throw new ValidationError(USER_FIELD_NAME, stringError)
  }
}

export function assertEventExists(
  event?: CoreSegmentEvent | null
): asserts event is CoreSegmentEvent {
  if (!exists(event)) {
    throw new ValidationError('Event', nilError)
  }
  if (typeof event !== 'object') {
    throw new ValidationError('Event', objError)
  }
}

export function assertEventType(event: CoreSegmentEvent): void {
  if (!isString(event.type)) {
    throw new ValidationError('.type', stringError)
  }
}

export function assertTrackEventName(event: CoreSegmentEvent): void {
  if (!isString(event.event)) {
    throw new ValidationError('.event', stringError)
  }
}

export function assertTrackEventProperties(event: CoreSegmentEvent): void {
  if (!isPlainObject(event.properties)) {
    throw new ValidationError('.properties', objError)
  }
}

export function assertTraits(event: CoreSegmentEvent): void {
  if (!isPlainObject(event.traits)) {
    throw new ValidationError('.traits', objError)
  }
}

export function assertMessageId(event: CoreSegmentEvent): void {
  if (!isString(event.messageId)) {
    throw new ValidationError('.messageId', stringError)
  }
}

export function validateEvent(event?: CoreSegmentEvent | null) {
  assertEventExists(event)
  assertEventType(event)
  assertMessageId(event)

  if (event.type === 'track') {
    assertTrackEventName(event)
    assertTrackEventProperties(event)
  }

  if (['group', 'identify'].includes(event.type)) {
    assertTraits(event)
  }
}
