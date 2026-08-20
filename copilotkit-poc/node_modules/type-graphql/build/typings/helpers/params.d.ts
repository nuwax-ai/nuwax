import { type ReturnTypeFunc, type TypeOptions, type ValidateOptions } from "../decorators/types.js";
import { type CommonArgMetadata } from "../metadata/definitions/index.js";
export interface ParamInfo {
    prototype: Object;
    propertyKey: string | symbol;
    parameterIndex: number;
    argName?: string;
    returnTypeFunc?: ReturnTypeFunc;
    options?: TypeOptions & ValidateOptions;
}
export declare function getParamInfo({ prototype, propertyKey, parameterIndex, argName, returnTypeFunc, options, }: ParamInfo): CommonArgMetadata;
