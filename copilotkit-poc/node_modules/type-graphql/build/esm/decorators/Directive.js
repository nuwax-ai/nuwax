import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Directive(nameOrDefinition) {
    return (targetOrPrototype, propertyKey, parameterIndexOrDescriptor) => {
        const directive = { nameOrDefinition, args: {} };
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        if (propertyKey) {
            if (typeof parameterIndexOrDescriptor === "number") {
                getMetadataStorage().collectDirectiveArgumentMetadata({
                    target: targetOrPrototype.constructor,
                    fieldName: propertyKey,
                    parameterIndex: parameterIndexOrDescriptor,
                    directive,
                });
            }
            else {
                getMetadataStorage().collectDirectiveFieldMetadata({
                    target: targetOrPrototype.constructor,
                    fieldName: propertyKey,
                    directive,
                });
            }
        }
        else {
            getMetadataStorage().collectDirectiveClassMetadata({
                target: targetOrPrototype,
                directive,
            });
        }
    };
}
