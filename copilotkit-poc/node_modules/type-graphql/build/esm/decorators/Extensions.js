import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Extensions(extensions) {
    return (targetOrPrototype, propertyKey, _descriptor) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        if (propertyKey) {
            getMetadataStorage().collectExtensionsFieldMetadata({
                target: targetOrPrototype.constructor,
                fieldName: propertyKey,
                extensions,
            });
        }
        else {
            getMetadataStorage().collectExtensionsClassMetadata({
                target: targetOrPrototype,
                extensions,
            });
        }
    };
}
