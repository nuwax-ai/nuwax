import { MissingSubscriptionTopicsError } from "../errors/index.js";
import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { getResolverMetadata } from "../helpers/resolver-metadata.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Subscription(returnTypeFuncOrOptions, maybeOptions) {
    const params = getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions);
    const options = params.options;
    return (prototype, methodName) => {
        const metadata = getResolverMetadata(prototype, methodName, params.returnTypeFunc, options);
        if (Array.isArray(options.topics) && options.topics.length === 0) {
            throw new MissingSubscriptionTopicsError(metadata.target, metadata.methodName);
        }
        getMetadataStorage().collectSubscriptionHandlerMetadata({
            ...metadata,
            topics: options.topics,
            topicId: options.topicId,
            filter: options.filter,
            subscribe: options.subscribe,
        });
    };
}
