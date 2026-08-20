import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { findType } from "../helpers/findType.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function FieldResolver(returnTypeFuncOrOptions, maybeOptions) {
    return (prototype, propertyKey) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        let getType;
        let typeOptions;
        const { options, returnTypeFunc } = getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions);
        try {
            const typeInfo = findType({
                metadataKey: "design:returntype",
                prototype,
                propertyKey,
                returnTypeFunc,
                typeOptions: options,
            });
            typeOptions = typeInfo.typeOptions;
            getType = typeInfo.getType;
        }
        catch {
        }
        getMetadataStorage().collectFieldResolverMetadata({
            kind: "external",
            methodName: propertyKey,
            schemaName: options.name || propertyKey,
            target: prototype.constructor,
            getType,
            typeOptions,
            complexity: options.complexity,
            description: options.description,
            deprecationReason: options.deprecationReason,
        });
    };
}
