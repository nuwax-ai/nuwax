import { backoff } from '@segment/analytics-core'
import type { Context } from '../../app/context'
import { tryCreateFormattedUrl } from '../../lib/create-url'
import { createDeferred } from '@segment/analytics-generic-utils'
import { ContextBatch } from './context-batch'
import { NodeEmitter } from '../../app/emitter'
import { HTTPClient, HTTPClientRequest } from '../../lib/http-client'
import { OAuthSettings } from '../../lib/types'
import { TokenManager } from '../../lib/token-manager'

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

function noop() {}

interface PendingItem {
  resolver: (ctx: Context) => void
  context: Context
}

export interface PublisherProps {
  host?: string
  path?: string
  flushInterval: number
  flushAt: number
  maxRetries: number
  writeKey: string
  httpRequestTimeout?: number
  disable?: boolean
  httpClient: HTTPClient
  oauthSettings?: OAuthSettings
}

/**
 * The Publisher is responsible for batching events and sending them to the Segment API.
 */
export class Publisher {
  private pendingFlushTimeout?: ReturnType<typeof setTimeout>
  private _batch?: ContextBatch

  private _flushInterval: number
  private _flushAt: number
  private _maxRetries: number
  private _url: string
  private _flushPendingItemsCount?: number
  private _httpRequestTimeout: number
  private _emitter: NodeEmitter
  private _disable: boolean
  private _httpClient: HTTPClient
  private _writeKey: string
  private _tokenManager: TokenManager | undefined

  constructor(
    {
      host,
      path,
      maxRetries,
      flushAt,
      flushInterval,
      writeKey,
      httpRequestTimeout,
      httpClient,
      disable,
      oauthSettings,
    }: PublisherProps,
    emitter: NodeEmitter
  ) {
    this._emitter = emitter
    this._maxRetries = maxRetries
    this._flushAt = Math.max(flushAt, 1)
    this._flushInterval = flushInterval
    this._url = tryCreateFormattedUrl(
      host ?? 'https://api.segment.io',
      path ?? '/v1/batch'
    )
    this._httpRequestTimeout = httpRequestTimeout ?? 10000
    this._disable = Boolean(disable)
    this._httpClient = httpClient
    this._writeKey = writeKey

    if (oauthSettings) {
      this._tokenManager = new TokenManager({
        ...oauthSettings,
        httpClient: oauthSettings.httpClient ?? httpClient,
        maxRetries: oauthSettings.maxRetries ?? maxRetries,
      })
    }
  }

  private createBatch(): ContextBatch {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    const batch = new ContextBatch(this._flushAt)
    this._batch = batch
    this.pendingFlushTimeout = setTimeout(() => {
      if (batch === this._batch) {
        this._batch = undefined
      }
      this.pendingFlushTimeout = undefined
      if (batch.length) {
        this.send(batch).catch(noop)
      }
    }, this._flushInterval)
    return batch
  }

  private clearBatch() {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    this._batch = undefined
  }

  flush(pendingItemsCount: number): void {
    if (!pendingItemsCount) {
      // if number of pending items is 0, there will never be anything else entering the batch, since the app is closed.
      if (this._tokenManager) {
        this._tokenManager.stopPoller()
      }
      return
    }

    this._flushPendingItemsCount = pendingItemsCount

    // if batch is empty, there's nothing to flush, and when things come in, enqueue will handle them.
    if (!this._batch) return

    // the number of globally pending items will always be larger or the same as batch size.
    // Any mismatch is because some globally pending items are in plugins.
    const isExpectingNoMoreItems = this._batch.length === pendingItemsCount
    if (isExpectingNoMoreItems) {
      this.send(this._batch)
        .catch(noop)
        .finally(() => {
          // stop poller so program can exit ().
          if (this._tokenManager) {
            this._tokenManager.stopPoller()
          }
        })
      this.clearBatch()
    }
  }

  /**
   * Enqueues the context for future delivery.
   * @param ctx - Context containing a Segment event.
   * @returns a promise that resolves with the context after the event has been delivered.
   */
  enqueue(ctx: Context): Promise<Context> {
    const batch = this._batch ?? this.createBatch()

    const { promise: ctxPromise, resolve } = createDeferred<Context>()

    const pendingItem: PendingItem = {
      context: ctx,
      resolver: resolve,
    }

    /*
      The following logic ensures that a batch is never orphaned,
      and is always sent before a new batch is created.

      Add an event to the existing batch.
        Success: Check if batch is full or no more items are expected to come in (i.e. closing). If so, send batch.
        Failure: Assume event is too big to fit in current batch - send existing batch.
          Add an event to the new batch.
            Success: Check if batch is full and send if it is.
            Failure: Event exceeds maximum size (it will never fit), fail the event.
    */
    const addStatus = batch.tryAdd(pendingItem)
    if (addStatus.success) {
      const isExpectingNoMoreItems =
        batch.length === this._flushPendingItemsCount
      const isFull = batch.length === this._flushAt
      if (isFull || isExpectingNoMoreItems) {
        this.send(batch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    }

    // If the new item causes the maximimum event size to be exceeded, send the current batch and create a new one.
    if (batch.length) {
      this.send(batch).catch(noop)
      this.clearBatch()
    }

    const fallbackBatch = this.createBatch()

    const fbAddStatus = fallbackBatch.tryAdd(pendingItem)

    if (fbAddStatus.success) {
      const isExpectingNoMoreItems =
        fallbackBatch.length === this._flushPendingItemsCount
      if (isExpectingNoMoreItems) {
        this.send(fallbackBatch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    } else {
      // this should only occur if max event size is exceeded
      ctx.setFailedDelivery({
        reason: new Error(fbAddStatus.message),
      })
      return Promise.resolve(ctx)
    }
  }

  private async send(batch: ContextBatch) {
    if (this._flushPendingItemsCount) {
      this._flushPendingItemsCount -= batch.length
    }
    const events = batch.getEvents()
    const maxAttempts = this._maxRetries + 1

    let currentAttempt = 0
    while (currentAttempt < maxAttempts) {
      currentAttempt++

      let requestedRetryTimeout: number | undefined
      let failureReason: unknown
      try {
        if (this._disable) {
          return batch.resolveEvents()
        }

        let authString = undefined
        if (this._tokenManager) {
          const token = await this._tokenManager.getAccessToken()
          if (token && token.access_token) {
            authString = `Bearer ${token.access_token}`
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'analytics-node-next/latest',
          ...(authString ? { Authorization: authString } : {}),
        }

        const request: HTTPClientRequest = {
          url: this._url,
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            batch: events,
            writeKey: this._writeKey,
            sentAt: new Date(),
          }),
          httpRequestTimeout: this._httpRequestTimeout,
        }

        this._emitter.emit('http_request', {
          body: request.body,
          method: request.method,
          url: request.url,
          headers: request.headers,
        })

        const response = await this._httpClient.makeRequest(request)

        if (response.status >= 200 && response.status < 300) {
          // Successfully sent events, so exit!
          batch.resolveEvents()
          return
        } else if (
          this._tokenManager &&
          (response.status === 400 ||
            response.status === 401 ||
            response.status === 403)
        ) {
          // Retry with a new OAuth token if we have OAuth data
          this._tokenManager.clearToken()
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
        } else if (response.status === 400) {
          // https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/#max-request-size
          // Request either malformed or size exceeded - don't retry.
          resolveFailedBatch(
            batch,
            new Error(`[${response.status}] ${response.statusText}`)
          )
          return
        } else if (response.status === 429) {
          // Rate limited, wait for the reset time
          if (response.headers && 'x-ratelimit-reset' in response.headers) {
            const rateLimitResetTimestamp = parseInt(
              response.headers['x-ratelimit-reset'],
              10
            )
            if (isFinite(rateLimitResetTimestamp)) {
              requestedRetryTimeout = rateLimitResetTimestamp - Date.now()
            }
          }
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
        } else {
          // Treat other errors as transient and retry.
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
        }
      } catch (err) {
        // Network errors get thrown, retry them.
        failureReason = err
      }

      // Final attempt failed, update context and resolve events.
      if (currentAttempt === maxAttempts) {
        resolveFailedBatch(batch, failureReason)
        return
      }

      // Retry after attempt-based backoff.
      await sleep(
        requestedRetryTimeout
          ? requestedRetryTimeout
          : backoff({
              attempt: currentAttempt,
              minTimeout: 25,
              maxTimeout: 1000,
            })
      )
    }
  }
}

function resolveFailedBatch(batch: ContextBatch, reason: unknown) {
  batch.getContexts().forEach((ctx) => ctx.setFailedDelivery({ reason }))
  batch.resolveEvents()
}
