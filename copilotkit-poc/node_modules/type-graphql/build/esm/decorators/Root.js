import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { findType } from "../helpers/findType.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Root(propertyName) {
    return (prototype, propertyKey, parameterIndex) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        let getType;
        try {
            const typeInfo = findType({
                metadataKey: "design:paramtypes",
                prototype,
                propertyKey,
                parameterIndex,
            });
            getType = typeInfo.getType;
        }
        catch {
        }
        getMetadataStorage().collectHandlerParamMetadata({
            kind: "root",
            target: prototype.constructor,
            methodName: propertyKey,
            index: parameterIndex,
            propertyName,
            getType,
        });
    };
}
