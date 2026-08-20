import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { getParamInfo } from "../helpers/params.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Args(paramTypeFnOrOptions, maybeOptions) {
    const { options, returnTypeFunc } = getTypeDecoratorParams(paramTypeFnOrOptions, maybeOptions);
    return (prototype, propertyKey, parameterIndex) => {
        getMetadataStorage().collectHandlerParamMetadata({
            kind: "args",
            ...getParamInfo({ prototype, propertyKey, parameterIndex, returnTypeFunc, options }),
        });
    };
}
