import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Ctx(propertyName) {
    return (prototype, propertyKey, parameterIndex) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        getMetadataStorage().collectHandlerParamMetadata({
            kind: "context",
            target: prototype.constructor,
            methodName: propertyKey,
            index: parameterIndex,
            propertyName,
        });
    };
}
