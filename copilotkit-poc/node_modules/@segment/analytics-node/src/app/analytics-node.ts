import { CoreAnalytics, bindAll, pTimeout } from '@segment/analytics-core'
import { AnalyticsSettings, validateSettings } from './settings'
import { version } from '../generated/version'
import { createConfiguredNodePlugin } from '../plugins/segmentio'
import { NodeEventFactory } from './event-factory'
import { Callback, dispatchAndEmit } from './dispatch-emit'
import { NodeEmitter } from './emitter'
import {
  AliasParams,
  GroupParams,
  IdentifyParams,
  PageParams,
  TrackParams,
  Plugin,
  SegmentEvent,
  FlushParams,
  CloseAndFlushParams,
} from './types'
import { Context } from './context'
import { NodeEventQueue } from './event-queue'
import { FetchHTTPClient } from '../lib/http-client'

export class Analytics extends NodeEmitter implements CoreAnalytics {
  private readonly _eventFactory: NodeEventFactory
  private _isClosed = false
  private _pendingEvents = 0
  private readonly _closeAndFlushDefaultTimeout: number
  private readonly _publisher: ReturnType<
    typeof createConfiguredNodePlugin
  >['publisher']

  private _isFlushing = false

  private readonly _queue: NodeEventQueue

  ready: Promise<void>

  constructor(settings: AnalyticsSettings) {
    super()
    validateSettings(settings)

    this._eventFactory = new NodeEventFactory()
    this._queue = new NodeEventQueue()

    const flushInterval = settings.flushInterval ?? 10000

    this._closeAndFlushDefaultTimeout = flushInterval * 1.25 // add arbitrary multiplier in case an event is in a plugin.

    const { plugin, publisher } = createConfiguredNodePlugin(
      {
        writeKey: settings.writeKey,
        host: settings.host,
        path: settings.path,
        maxRetries: settings.maxRetries ?? 3,
        flushAt: settings.flushAt ?? settings.maxEventsInBatch ?? 15,
        httpRequestTimeout: settings.httpRequestTimeout,
        disable: settings.disable,
        flushInterval,
        httpClient:
          typeof settings.httpClient === 'function'
            ? new FetchHTTPClient(settings.httpClient)
            : settings.httpClient ?? new FetchHTTPClient(),
        oauthSettings: settings.oauthSettings,
      },
      this as NodeEmitter
    )
    this._publisher = publisher

    this.ready = this.register(plugin).then(() => undefined)

    this.emit('initialize', settings)

    bindAll(this)
  }

  get VERSION() {
    return version
  }

  /**
   * Call this method to stop collecting new events and flush all existing events.
   * This method also waits for any event method-specific callbacks to be triggered,
   * and any of their subsequent promises to be resolved/rejected.
   */
  public closeAndFlush({
    timeout = this._closeAndFlushDefaultTimeout,
  }: CloseAndFlushParams = {}): Promise<void> {
    return this.flush({ timeout, close: true })
  }

  /**
   * Call this method to flush all existing events..
   * This method also waits for any event method-specific callbacks to be triggered,
   * and any of their subsequent promises to be resolved/rejected.
   */
  public async flush({
    timeout,
    close = false,
  }: FlushParams = {}): Promise<void> {
    if (this._isFlushing) {
      // if we're already flushing, then we don't need to do anything
      console.warn(
        'Overlapping flush calls detected. Please wait for the previous flush to finish before calling .flush again'
      )
      return
    } else {
      this._isFlushing = true
    }
    if (close) {
      this._isClosed = true
    }
    this._publisher.flush(this._pendingEvents)
    const promise = new Promise<void>((resolve) => {
      if (!this._pendingEvents) {
        resolve()
      } else {
        this.once('drained', () => {
          resolve()
        })
      }
    }).finally(() => {
      this._isFlushing = false
    })
    return timeout ? pTimeout(promise, timeout).catch(() => undefined) : promise
  }

  private _dispatch(segmentEvent: SegmentEvent, callback?: Callback) {
    if (this._isClosed) {
      this.emit('call_after_close', segmentEvent as SegmentEvent)
      return undefined
    }

    this._pendingEvents++

    dispatchAndEmit(segmentEvent, this._queue, this, callback)
      .catch((ctx) => ctx)
      .finally(() => {
        this._pendingEvents--

        if (!this._pendingEvents) {
          this.emit('drained')
        }
      })
  }

  /**
   * Combines two unassociated user identities.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#alias
   */
  alias(
    {
      userId,
      previousId,
      context,
      timestamp,
      integrations,
      messageId,
    }: AliasParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.alias(userId, previousId, {
      context,
      integrations,
      timestamp,
      messageId,
    })
    this._dispatch(segmentEvent, callback)
  }

  /**
   * Associates an identified user with a collective.
   *  @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#group
   */
  group(
    {
      timestamp,
      groupId,
      userId,
      anonymousId,
      traits = {},
      context,
      integrations,
      messageId,
    }: GroupParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.group(groupId, traits, {
      context,
      anonymousId,
      userId,
      timestamp,
      integrations,
      messageId,
    })

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Includes a unique userId and (maybe anonymousId) and any optional traits you know about them.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#identify
   */
  identify(
    {
      userId,
      anonymousId,
      traits = {},
      context,
      timestamp,
      integrations,
      messageId,
    }: IdentifyParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.identify(userId, traits, {
      context,
      anonymousId,
      userId,
      timestamp,
      integrations,
      messageId,
    })
    this._dispatch(segmentEvent, callback)
  }

  /**
   * The page method lets you record page views on your website, along with optional extra information about the page being viewed.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#page
   */
  page(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      context,
      timestamp,
      integrations,
      messageId,
    }: PageParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.page(
      category ?? null,
      name ?? null,
      properties,
      { context, anonymousId, userId, timestamp, integrations, messageId }
    )
    this._dispatch(segmentEvent, callback)
  }

  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   *
   * TODO: This is not documented on the segment docs ATM (for node).
   */
  screen(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      context,
      timestamp,
      integrations,
      messageId,
    }: PageParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.screen(
      category ?? null,
      name ?? null,
      properties,
      { context, anonymousId, userId, timestamp, integrations, messageId }
    )

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Records actions your users perform.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#track
   */
  track(
    {
      userId,
      anonymousId,
      event,
      properties,
      context,
      timestamp,
      integrations,
      messageId,
    }: TrackParams,
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.track(event, properties, {
      context,
      userId,
      anonymousId,
      timestamp,
      integrations,
      messageId,
    })

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Registers one or more plugins to augment Analytics functionality.
   * @param plugins
   */
  register(...plugins: Plugin[]): Promise<void> {
    return this._queue.criticalTasks.run(async () => {
      const ctx = Context.system()

      const registrations = plugins.map((xt) =>
        this._queue.register(ctx, xt, this)
      )
      await Promise.all(registrations)
      this.emit(
        'register',
        plugins.map((el) => el.name)
      )
    })
  }

  /**
   * Deregisters one or more plugins based on their names.
   * @param pluginNames - The names of one or more plugins to deregister.
   */
  async deregister(...pluginNames: string[]): Promise<void> {
    const ctx = Context.system()

    const deregistrations = pluginNames.map((pl) => {
      const plugin = this._queue.plugins.find((p) => p.name === pl)
      if (plugin) {
        return this._queue.deregister(ctx, plugin, this)
      } else {
        ctx.log('warn', `plugin ${pl} not found`)
      }
    })

    await Promise.all(deregistrations)
    this.emit('deregister', pluginNames)
  }
}
