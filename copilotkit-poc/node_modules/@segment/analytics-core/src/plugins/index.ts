import type { CoreAnalytics } from '../analytics'
import type { CoreContext } from '../context'

export type PluginType =
  | 'before'
  | 'after'
  | 'destination'
  | 'enrichment'
  | 'utility'

// enrichment - modifies the event. Enrichment can happen in parallel, by reducing all changes in the final event. Failures in this stage could halt event delivery.
// destination - runs in parallel at the end of the lifecycle. Cannot modify the event, can fail and not halt execution.
// utility - do not affect lifecycle. Should be run and executed once. Their `track/identify` calls don't really do anything. example

export interface CorePlugin<
  Ctx extends CoreContext = CoreContext,
  Analytics extends CoreAnalytics = any
> {
  name: string

  /**
   * A concatenation of the current destination name and the specific action. This field is only relevant for destination plugins.
   * @example ['Braze Web Mode (Actions) updateUserProfile'] // (and the plugin name would be 'Braze Web Mode (Actions)')
   */
  // This is only used for disabling action plugins. An action destination plugin name used to be the concatenation of the current destination name, and the specific action (like 'Braze Web Mode (Actions) updateUserProfile'. Which meant customers had to set that individual action to false to disable it before. Then with the destination filter route, we created a new wrapper around actions to make it easy to disable based on the creationName, which is when we added creationName to the objects in remotePlugin. However, to preserve backwards compatibility, we still needed to support disabling based on the concatenation since customers were doing that in the wild, so we can filter based on checking both name fields.
  alternativeNames?: string[]
  /**
   * The version of the plugin.
   * @example '1.0.0'
   */
  version?: string
  type: PluginType
  isLoaded: () => boolean
  load: (ctx: Ctx, instance: Analytics) => Promise<unknown>

  unload?: (ctx: Ctx, instance: Analytics) => Promise<unknown> | unknown
  ready?: () => Promise<unknown>
  track?: (ctx: Ctx) => Promise<Ctx> | Ctx
  identify?: (ctx: Ctx) => Promise<Ctx> | Ctx
  page?: (ctx: Ctx) => Promise<Ctx> | Ctx
  group?: (ctx: Ctx) => Promise<Ctx> | Ctx
  alias?: (ctx: Ctx) => Promise<Ctx> | Ctx
  screen?: (ctx: Ctx) => Promise<Ctx> | Ctx
}
