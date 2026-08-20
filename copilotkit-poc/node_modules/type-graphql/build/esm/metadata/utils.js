import { ReflectMetadataMissingError } from "../errors/index.js";
import { isThrowing } from "../helpers/isThrowing.js";
export function mapSuperResolverHandlers(definitions, superResolver, resolverMetadata) {
    return definitions.map(metadata => metadata.target === superResolver
        ? {
            ...metadata,
            target: resolverMetadata.target,
            resolverClassMetadata: resolverMetadata,
        }
        : metadata);
}
export function mapSuperFieldResolverHandlers(definitions, superResolver, resolverMetadata) {
    const superMetadata = mapSuperResolverHandlers(definitions, superResolver, resolverMetadata);
    return superMetadata.map(metadata => metadata.target === superResolver
        ? {
            ...metadata,
            getObjectType: isThrowing(metadata.getObjectType)
                ? resolverMetadata.getObjectType
                : metadata.getObjectType,
        }
        : metadata);
}
export function mapMiddlewareMetadataToArray(metadata) {
    return metadata
        .map(m => m.middlewares)
        .reduce((middlewares, resultArray) => resultArray.concat(middlewares), []);
}
export function ensureReflectMetadataExists() {
    if (typeof Reflect !== "object" || typeof Reflect.getMetadata !== "function") {
        throw new ReflectMetadataMissingError();
    }
}
