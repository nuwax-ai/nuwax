import { getTypeDecoratorParams } from "../helpers/decorators.js";
import { getParamInfo } from "../helpers/params.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Arg(name, returnTypeFuncOrOptions, maybeOptions) {
    return (prototype, propertyKey, parameterIndex) => {
        const { options, returnTypeFunc } = getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions);
        getMetadataStorage().collectHandlerParamMetadata({
            kind: "arg",
            name,
            description: options.description,
            deprecationReason: options.deprecationReason,
            ...getParamInfo({
                prototype,
                propertyKey,
                parameterIndex,
                returnTypeFunc,
                options,
                argName: name,
            }),
        });
    };
}
