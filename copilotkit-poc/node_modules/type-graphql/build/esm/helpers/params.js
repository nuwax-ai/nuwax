import { SymbolKeysNotSupportedError } from "../errors/index.js";
import { findType } from "./findType.js";
export function getParamInfo({ prototype, propertyKey, parameterIndex, argName, returnTypeFunc, options = {}, }) {
    if (typeof propertyKey === "symbol") {
        throw new SymbolKeysNotSupportedError();
    }
    const { getType, typeOptions } = findType({
        metadataKey: "design:paramtypes",
        prototype,
        propertyKey,
        parameterIndex,
        argName,
        returnTypeFunc,
        typeOptions: options,
    });
    return {
        target: prototype.constructor,
        methodName: propertyKey,
        index: parameterIndex,
        getType,
        typeOptions,
        validateSettings: options.validate,
        validateFn: options.validateFn,
    };
}
