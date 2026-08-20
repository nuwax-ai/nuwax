import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { findType } from "./findType.js";
export function getResolverMetadata(prototype, propertyKey, returnTypeFunc, options = {}) {
    if (typeof propertyKey === "symbol") {
        throw new SymbolKeysNotSupportedError();
    }
    const { getType, typeOptions } = findType({
        metadataKey: "design:returntype",
        prototype,
        propertyKey,
        returnTypeFunc,
        typeOptions: options,
    });
    const methodName = propertyKey;
    return {
        methodName,
        schemaName: options.name || methodName,
        target: prototype.constructor,
        getReturnType: getType,
        returnTypeOptions: typeOptions,
        description: options.description,
        deprecationReason: options.deprecationReason,
        complexity: options.complexity,
    };
}
