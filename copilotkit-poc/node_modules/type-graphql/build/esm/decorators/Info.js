import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Info() {
    return (prototype, propertyKey, parameterIndex) => {
        if (typeof propertyKey === "symbol") {
            throw new SymbolKeysNotSupportedError();
        }
        getMetadataStorage().collectHandlerParamMetadata({
            kind: "info",
            target: prototype.constructor,
            methodName: propertyKey,
            index: parameterIndex,
        });
    };
}
