import type { CorePlugin } from '@segment/analytics-core'
import type { Analytics } from '../analytics-node'
import type { Context } from '../context'

export interface Plugin extends CorePlugin<Context, Analytics> {}
