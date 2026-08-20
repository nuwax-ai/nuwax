import { type MergeExclusive } from "../typings/index.js";
import { type AdvancedOptions, type ReturnTypeFunc, type SubscriptionFilterFunc, type SubscriptionSubscribeFunc, type SubscriptionTopicIdFunc, type SubscriptionTopicsFunc } from "./types.js";
interface PubSubOptions {
    topics: string | string[] | SubscriptionTopicsFunc;
    topicId?: SubscriptionTopicIdFunc | undefined;
    filter?: SubscriptionFilterFunc;
}
interface SubscribeOptions {
    subscribe: SubscriptionSubscribeFunc;
}
export type SubscriptionOptions = AdvancedOptions & MergeExclusive<PubSubOptions, SubscribeOptions>;
export declare function Subscription(options: SubscriptionOptions): MethodDecorator;
export declare function Subscription(returnTypeFunc: ReturnTypeFunc, options: SubscriptionOptions): MethodDecorator;
export {};
