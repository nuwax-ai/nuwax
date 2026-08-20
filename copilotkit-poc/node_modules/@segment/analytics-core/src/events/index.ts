export * from './interfaces'
import { dset } from 'dset'
import { ID } from '../user'
import {
  IntegrationsOptions,
  EventProperties,
  CoreSegmentEvent,
  CoreOptions,
  CoreExtraContext,
  UserTraits,
  GroupTraits,
} from './interfaces'
import { pickBy } from '../utils/pick'
import type { RemoveIndexSignature } from '../utils/ts-helpers'
import { validateEvent } from '../validation/assertions'

export type EventMethodCallHook = ({
  type,
  options,
}: {
  type: 'track' | 'identify' | 'page' | 'group' | 'alias' | 'screen'
  options?: CoreOptions
}) => void

export type EventHook = (event: CoreSegmentEvent) => void

export interface EventFactorySettings {
  /**
   * Universal `messageId` builder for all events (these must be unique)
   */
  createMessageId: () => string
  /**
   * Hook to do something with an event right before they are returned from the factory.
   * This includes event modification or additional validation.
   */
  onFinishedEvent?: EventHook
  /**
   * Hook whenever an event method is called (track, page, etc.)
   * Can be used to update Options (or just listen)
   */
  onEventMethodCall?: EventMethodCallHook
}

/**
 * Internal settings object that is used internally by the factory
 */
class InternalEventFactorySettings {
  public createMessageId: EventFactorySettings['createMessageId']
  public onEventMethodCall: EventMethodCallHook
  public onFinishedEvent: EventHook

  constructor(public settings: EventFactorySettings) {
    this.createMessageId = settings.createMessageId
    this.onEventMethodCall = settings.onEventMethodCall ?? (() => {})
    this.onFinishedEvent = settings.onFinishedEvent ?? (() => {})
  }
}

export abstract class CoreEventFactory {
  private settings: InternalEventFactorySettings

  constructor(settings: EventFactorySettings) {
    this.settings = new InternalEventFactorySettings(settings)
  }

  track(
    event: string,
    properties?: EventProperties,
    options?: CoreOptions,
    integrationOptions?: IntegrationsOptions
  ) {
    this.settings.onEventMethodCall({ type: 'track', options })
    return this.normalize({
      ...this.baseEvent(),
      event,
      type: 'track',
      properties: properties ?? {}, // TODO: why is this not a shallow copy like everywhere else?
      options: { ...options },
      integrations: { ...integrationOptions },
    })
  }

  page(
    category: string | null,
    page: string | null,
    properties?: EventProperties,
    options?: CoreOptions,
    integrationOptions?: IntegrationsOptions
  ): CoreSegmentEvent {
    this.settings.onEventMethodCall({ type: 'page', options })
    const event: CoreSegmentEvent = {
      type: 'page',
      properties: { ...properties },
      options: { ...options },
      integrations: { ...integrationOptions },
    }

    if (category !== null) {
      event.category = category
      event.properties = event.properties ?? {}
      event.properties.category = category
    }

    if (page !== null) {
      event.name = page
    }

    return this.normalize({
      ...this.baseEvent(),
      ...event,
    })
  }

  screen(
    category: string | null,
    screen: string | null,
    properties?: EventProperties,
    options?: CoreOptions,
    integrationOptions?: IntegrationsOptions
  ): CoreSegmentEvent {
    this.settings.onEventMethodCall({ type: 'screen', options })
    const event: CoreSegmentEvent = {
      type: 'screen',
      properties: { ...properties },
      options: { ...options },
      integrations: { ...integrationOptions },
    }

    if (category !== null) {
      event.category = category
    }

    if (screen !== null) {
      event.name = screen
    }

    return this.normalize({
      ...this.baseEvent(),
      ...event,
    })
  }

  identify(
    userId: ID,
    traits?: UserTraits,
    options?: CoreOptions,
    integrationsOptions?: IntegrationsOptions
  ): CoreSegmentEvent {
    this.settings.onEventMethodCall({ type: 'identify', options })
    return this.normalize({
      ...this.baseEvent(),
      type: 'identify',
      userId,
      traits: traits ?? {},
      options: { ...options },
      integrations: integrationsOptions,
    })
  }

  group(
    groupId: ID,
    traits?: GroupTraits,
    options?: CoreOptions,
    integrationOptions?: IntegrationsOptions
  ): CoreSegmentEvent {
    this.settings.onEventMethodCall({ type: 'group', options })
    return this.normalize({
      ...this.baseEvent(),
      type: 'group',
      traits: traits ?? {},
      options: { ...options }, // this spreading is intentional
      integrations: { ...integrationOptions }, //
      groupId,
    })
  }

  alias(
    to: string,
    from: string | null, // TODO: can we make this undefined?
    options?: CoreOptions,
    integrationOptions?: IntegrationsOptions
  ): CoreSegmentEvent {
    this.settings.onEventMethodCall({ type: 'alias', options })
    const base: CoreSegmentEvent = {
      userId: to,
      type: 'alias',
      options: { ...options },
      integrations: { ...integrationOptions },
    }

    if (from !== null) {
      base.previousId = from
    }

    if (to === undefined) {
      return this.normalize({
        ...base,
        ...this.baseEvent(),
      })
    }

    return this.normalize({
      ...this.baseEvent(),
      ...base,
    })
  }

  private baseEvent(): Partial<CoreSegmentEvent> {
    return {
      integrations: {},
      options: {},
    }
  }

  /**
   * Builds the context part of an event based on "foreign" keys that
   * are provided in the `Options` parameter for an Event
   */
  private context(
    options: CoreOptions
  ): [CoreExtraContext, Partial<CoreSegmentEvent>] {
    type CoreOptionKeys = keyof RemoveIndexSignature<CoreOptions>
    /**
     * If the event options are known keys from this list, we move them to the top level of the event.
     * Any other options are moved to context.
     */
    const eventOverrideKeys: CoreOptionKeys[] = [
      'userId',
      'anonymousId',
      'timestamp',
      'messageId',
    ]

    delete options['integrations']
    const providedOptionsKeys = Object.keys(options) as Exclude<
      CoreOptionKeys,
      'integrations'
    >[]

    const context = options.context ?? {}
    const eventOverrides = {}

    providedOptionsKeys.forEach((key) => {
      if (key === 'context') {
        return
      }

      if (eventOverrideKeys.includes(key)) {
        dset(eventOverrides, key, options[key])
      } else {
        dset(context, key, options[key])
      }
    })

    return [context, eventOverrides]
  }

  private normalize(event: CoreSegmentEvent): CoreSegmentEvent {
    const integrationBooleans = Object.keys(event.integrations ?? {}).reduce(
      (integrationNames, name) => {
        return {
          ...integrationNames,
          [name]: Boolean(event.integrations?.[name]),
        }
      },
      {} as Record<string, boolean>
    )

    // filter out any undefined options
    event.options = pickBy(event.options || {}, (_, value) => {
      return value !== undefined
    })

    // This is pretty trippy, but here's what's going on:
    // - a) We don't pass initial integration options as part of the event, only if they're true or false
    // - b) We do accept per integration overrides (like integrations.Amplitude.sessionId) at the event level
    // Hence the need to convert base integration options to booleans, but maintain per event integration overrides
    const allIntegrations = {
      // Base config integrations object as booleans
      ...integrationBooleans,

      // Per event overrides, for things like amplitude sessionId, for example
      ...event.options?.integrations,
    }

    const [context, overrides] = event.options
      ? this.context(event.options)
      : []

    const { options, ...rest } = event

    const evt: CoreSegmentEvent = {
      timestamp: new Date(),
      ...rest,
      context,
      integrations: allIntegrations,
      ...overrides,
      messageId: options.messageId || this.settings.createMessageId(),
    }

    this.settings.onFinishedEvent(evt)
    validateEvent(evt)

    return evt
  }
}
