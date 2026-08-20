import { type ReturnTypeFunc, type TypeOptions, type TypeValueThunk } from "../decorators/types.js";
export type MetadataKey = "design:type" | "design:returntype" | "design:paramtypes";
export interface TypeInfo {
    getType: TypeValueThunk;
    typeOptions: TypeOptions;
}
export interface GetTypeParams {
    metadataKey: MetadataKey;
    prototype: Object;
    propertyKey: string;
    parameterIndex?: number;
    argName?: string;
    returnTypeFunc?: ReturnTypeFunc;
    typeOptions?: TypeOptions;
}
export declare function findType({ metadataKey, prototype, propertyKey, parameterIndex, argName, returnTypeFunc, typeOptions, }: GetTypeParams): TypeInfo;
