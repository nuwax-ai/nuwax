import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { getResolverMetadata } from "../helpers/resolver-metadata.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Mutation(returnTypeFuncOrOptions, maybeOptions) {
    const { options, returnTypeFunc } = getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions);
    return (prototype, methodName) => {
        const metadata = getResolverMetadata(prototype, methodName, returnTypeFunc, options);
        getMetadataStorage().collectMutationHandlerMetadata(metadata);
    };
}
