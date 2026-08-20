import { CoreContext } from '../context'
import { ID } from '../user'
import { DeepNullable } from '../utils/ts-helpers'

export type Callback<Ctx extends CoreContext = CoreContext> = (
  ctx: Ctx
) => Promise<unknown> | unknown

export type SegmentEventType =
  | 'track'
  | 'page'
  | 'identify'
  | 'group'
  | 'alias'
  | 'screen'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export type EventProperties = Record<string, any>

export type IntegrationsOptions = {
  All?: boolean | undefined
  [integrationName: string]: boolean | Record<string, unknown> | undefined
}

export interface CoreOptions {
  integrations?: IntegrationsOptions | undefined
  timestamp?: Timestamp | undefined
  context?: CoreExtraContext | undefined
  anonymousId?: string | undefined
  userId?: string | undefined
  traits?: Traits | undefined
  /**
   * Override the messageId. Under normal circumstances, this is not recommended -- but neccessary for deduping events.
   *
   * **Currently, This option only works in `@segment/analytics-node`.**
   */
  messageId?: string | undefined
  // ugh, this is ugly, but we allow literally any property to be passed to options (which get spread onto the event)
  [key: string]: any
}

/**
 * Context is a dictionary of extra information that provides useful context about a datapoint, for example the user’s ip address or locale. You should only use Context fields for their intended meaning.
 * @link https://segment.com/docs/connections/spec/common/#context
 */
export interface CoreExtraContext {
  /**
   * This is usually used to flag an .identify() call to just update the trait, rather than "last seen".
   */
  active?: boolean | undefined

  /**
   * Current user's IP address.
   */
  ip?: string | undefined

  /**
   * Locale string for the current user, for example en-US.
   * @example en-US
   */
  locale?: string | undefined
  /**
   * Dictionary of information about the user’s current location.
   */
  location?:
    | {
        /**
         * @example San Francisco
         */
        city?: string | undefined
        /**
         * @example United States
         */
        country?: string | undefined
        /**
         * @example 40.2964197
         */
        latitude?: string | undefined
        /**
         * @example -76.9411617
         */
        longitude?: string | undefined
        /**
         * @example CA
         */
        region?: string | undefined
        /**
         * @example 100
         */
        speed?: number | undefined
      }
    | undefined

  /**
   * Dictionary of information about the current web page.
   */
  page?:
    | {
        /**
         * @example /academy/
         */
        path?: string | undefined
        /**
         * @example https://www.foo.com/
         */
        referrer?: string | undefined
        /**
         * @example projectId=123
         */
        search?: string | undefined
        /**
         * @example Analytics Academy
         */
        title?: string | undefined
        /**
         * @example https://segment.com/academy/
         */
        url?: string | undefined
      }
    | undefined

  /**
   * User agent of the device making the request.
   */
  userAgent?: string | undefined

  /**
   * User agent data returned by the Client Hints API
   */
  userAgentData?:
    | {
        brands?:
          | {
              brand: string
              version: string
            }[]
          | undefined
        mobile?: boolean | undefined
        platform?: string | undefined
        architecture?: string | undefined
        bitness?: string | undefined
        model?: string | undefined
        platformVersion?: string | undefined
        /** @deprecated in favour of fullVersionList */
        uaFullVersion?: string | undefined
        fullVersionList?:
          | {
              brand: string
              version: string
            }[]
          | undefined
        wow64?: boolean | undefined
      }
    | undefined

  /**
   * Information about the current library.
   *
   * **Automatically filled out by the library.**
   *
   * This type should probably be "never"
   */
  library?:
    | {
        /**
         * @example analytics-node-next/latest
         */
        name: string
        /**
         * @example  "1.43.1"
         */
        version: string
      }
    | undefined

  /**
   * This is useful in cases where you need to track an event,
   * but also associate information from a previous identify call.
   * You should fill this object the same way you would fill traits in an identify call.
   */
  traits?: Traits | undefined

  /**
   * Dictionary of information about the campaign that resulted in the API call, containing name, source, medium, term, content, and any other custom UTM parameter.
   */
  campaign?: Campaign | undefined

  /**
   * Dictionary of information about the way the user was referred to the website or app.
   */
  referrer?:
    | {
        type?: string | undefined
        name?: string | undefined
        url?: string | undefined
        link?: string | undefined

        id?: string | undefined // undocumented
        btid?: string | undefined // undocumented?
        urid?: string | undefined // undocumented?
      }
    | undefined

  amp?:
    | {
        // undocumented?
        id: string
      }
    | undefined

  [key: string]: any
}

export interface CoreSegmentEvent {
  messageId?: string | undefined
  type: SegmentEventType

  // page specific
  category?: string | undefined
  name?: string | undefined

  properties?: EventProperties | undefined

  traits?: Traits | undefined // Traits is only defined in 'identify' and 'group', even if it can be passed in other calls.

  integrations?: IntegrationsOptions | undefined
  context?: CoreExtraContext | undefined
  options?: CoreOptions | undefined

  userId?: ID | undefined
  anonymousId?: ID | undefined
  groupId?: ID | undefined
  previousId?: ID | undefined

  event?: string | undefined

  writeKey?: string | undefined

  sentAt?: Date | undefined

  _metadata?: SegmentEventMetadata | undefined

  timestamp?: Timestamp | undefined
}

export interface SegmentEventMetadata {
  failedInitializations?: unknown[] | undefined
  bundled?: string[] | undefined
  unbundled?: string[] | undefined
  nodeVersion?: string | undefined
  bundledConfigIds?: string[] | undefined
  unbundledConfigIds?: string[] | undefined
  bundledIds?: string[] | undefined
}

export type Timestamp = Date | string

/**
 * A Plan allows users to specify events and which destinations they would like them to be sent to
 */
export interface Plan {
  track?: TrackPlan | undefined
  identify?: TrackPlan | undefined
  group?: TrackPlan | undefined
}

export interface TrackPlan {
  [key: string]: PlanEvent | undefined
  // __default SHOULD always exist, but marking as optional for extra safety.
  __default?: PlanEvent
}

export interface PlanEvent {
  /**
   * Whether or not this plan event is enabled
   */
  enabled: boolean
  /**
   * Which integrations the plan event applies to
   */
  integrations?:
    | {
        [key: string]: boolean
      }
    | undefined
}

type DbId = string | number // TODO: the docs says that this can only be a string?
type PhoneNumber = string | number // TODO: the docs say this can only be a string?

/**
 * Traits are pieces of information you know about a group.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/group/#traits
 */
type BaseGroupTraits = DeepNullable<{
  /**
   * Street address of a group.
   */
  address?: BaseUserTraits['address'] | undefined

  /**
   * URL to an avatar image for the group.
   */
  avatar?: BaseUserTraits['avatar'] | undefined

  /**
   * Date the group's account was first created. Segment recommends ISO-8601 date strings.
   */
  createdAt?: BaseUserTraits['createdAt'] | undefined

  /**
   * Description of a group
   */
  description?: BaseUserTraits['description'] | undefined
  /**
   * Email address of group.
   */
  email?: BaseUserTraits['email'] | undefined
  /**
   * Number of employees of a group, typically used for companies.
   */
  employees?: string | number | undefined // TODO: the docs says that this must be a string?

  /**
   * Unique ID in your database for a group.
   */
  id?: BaseUserTraits['id'] | undefined

  /**
   * Industry a group is part of.
   */
  industry?: BaseUserTraits['industry'] | undefined

  /**
   * Name of a group.
   */
  name?: BaseUserTraits['name'] | undefined

  /**
   * Phone number of a group
   */
  phone?: BaseUserTraits['phone'] | undefined

  /**
   * Website of a group.
   */
  website?: BaseUserTraits['website'] | undefined

  /**
   * 	Plan that a group is in.
   */
  plan?: BaseUserTraits['plan'] | undefined
}>

/**
 * Traits are pieces of information you know about a user.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/identify/#traits
 */
export type BaseUserTraits = DeepNullable<{
  /**
   * Unique ID in your database for a user
   */
  id?: DbId | undefined

  /**
   * Industry a user works in
   */
  industry?: string | undefined

  /**
   * First name of a user.
   */
  firstName?: string | undefined

  /**
   * Last name of a user.
   */
  lastName?: string | undefined

  /**
   * Full name of a user. If you only pass a first and last name Segment automatically fills in the full name for you.
   */
  name?: string | undefined

  /**
   * Phone number of a user
   */
  phone?: PhoneNumber | undefined

  /**
   * Title of a user, usually related to their position at a specific company.
   * @example VP of Engineering
   */
  title?: string | undefined

  /**
   * User's username. This should be unique to each user, like the usernames of Twitter or GitHub.
   */
  username?: string | undefined

  /**
   * Website of a user.
   */
  website?: string | undefined

  /**
   * Street address of a user.
   */
  address?:
    | {
        city?: string | undefined
        country?: string | undefined
        postalCode?: string | undefined
        state?: string | undefined
        street?: string | undefined
      }
    | undefined
  /**
   * Age of a user.
   */
  age?: number | undefined

  /**
   * URL to an avatar image for the user.
   */
  avatar?: string | undefined

  /**
   * User's birthday.
   */
  birthday?: Timestamp | undefined

  /**
   * User's company.
   */
  company?:
    | {
        name?: string | undefined
        id?: DbId | undefined
        industry?: BaseUserTraits['industry'] | undefined
        employee_count?: number | undefined
        plan?: BaseUserTraits['plan'] | undefined
      }
    | undefined

  /**
    Plan that a user is in.

   * @example enterprise
   */
  plan?: string | undefined

  /**
   * 	Date the user's account was first created. Segment recommends using ISO-8601 date strings.
   */
  createdAt?: Timestamp | undefined

  /**
   * Description of user, such as bio.
   */
  description?: string | undefined

  /**
   * Email address of a user.
   */
  email?: string | undefined

  /**
   * @example female
   */
  gender?: string | undefined
}>

/**
 * Traits are pieces of information you know about a group.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/group/#traits
 */
export type GroupTraits = BaseGroupTraits & {
  [customTrait: string]: any
}

/**
 * Traits are pieces of information you know about a user.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/identify/#traits
 */
export type UserTraits = BaseUserTraits & {
  [customTrait: string]: any
}

/**
 * Traits are pieces of information you know about a user or group.
 */
export type Traits = UserTraits | GroupTraits

export type Campaign = {
  name: string
  source: string
  medium: string
  [key: string]: string
}
