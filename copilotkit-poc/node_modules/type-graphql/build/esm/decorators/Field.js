import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { findType } from "../helpers/findType.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Field(returnTypeFuncOrOptions, maybeOptions) {
    return (prototype, propertyKey, descriptor) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        const { options, returnTypeFunc } = getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions);
        const isResolver = Boolean(descriptor);
        const isResolverMethod = Boolean(descriptor && descriptor.value);
        const { getType, typeOptions } = findType({
            metadataKey: isResolverMethod ? "design:returntype" : "design:type",
            prototype,
            propertyKey,
            returnTypeFunc,
            typeOptions: options,
        });
        getMetadataStorage().collectClassFieldMetadata({
            name: propertyKey,
            schemaName: options.name || propertyKey,
            getType,
            typeOptions,
            complexity: options.complexity,
            target: prototype.constructor,
            description: options.description,
            deprecationReason: options.deprecationReason,
            simple: options.simple,
        });
        if (isResolver) {
            getMetadataStorage().collectFieldResolverMetadata({
                kind: "internal",
                methodName: propertyKey,
                schemaName: options.name || propertyKey,
                target: prototype.constructor,
                complexity: options.complexity,
            });
        }
    };
}
