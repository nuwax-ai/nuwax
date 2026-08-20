import { Publisher, PublisherProps } from './publisher'
import { version } from '../../generated/version'
import { detectRuntime } from '../../lib/env'
import { Plugin } from '../../app/types'
import { Context } from '../../app/context'
import { NodeEmitter } from '../../app/emitter'

function normalizeEvent(ctx: Context) {
  ctx.updateEvent('context.library.name', '@segment/analytics-node')
  ctx.updateEvent('context.library.version', version)
  const runtime = detectRuntime()
  if (runtime === 'node') {
    // eslint-disable-next-line no-restricted-globals
    ctx.updateEvent('_metadata.nodeVersion', process.version)
  }
  ctx.updateEvent('_metadata.jsRuntime', runtime)
}

type DefinedPluginFields =
  | 'name'
  | 'type'
  | 'version'
  | 'isLoaded'
  | 'load'
  | 'alias'
  | 'group'
  | 'identify'
  | 'page'
  | 'screen'
  | 'track'

type SegmentNodePlugin = Plugin & Required<Pick<Plugin, DefinedPluginFields>>

export type ConfigureNodePluginProps = PublisherProps

export function createNodePlugin(publisher: Publisher): SegmentNodePlugin {
  function action(ctx: Context): Promise<Context> {
    normalizeEvent(ctx)
    return publisher.enqueue(ctx)
  }

  return {
    name: 'Segment.io',
    type: 'destination',
    version: '1.0.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    alias: action,
    group: action,
    identify: action,
    page: action,
    screen: action,
    track: action,
  }
}

export const createConfiguredNodePlugin = (
  props: ConfigureNodePluginProps,
  emitter: NodeEmitter
) => {
  const publisher = new Publisher(props, emitter)
  return {
    publisher: publisher,
    plugin: createNodePlugin(publisher),
  }
}
