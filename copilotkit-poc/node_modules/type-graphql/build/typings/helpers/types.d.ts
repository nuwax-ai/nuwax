import { GraphQLScalarType, type GraphQLType } from "graphql";
import { type TypeOptions } from "../decorators/types.js";
export declare function convertTypeIfScalar(type: any): GraphQLScalarType | undefined;
export declare function wrapWithTypeOptions<T extends GraphQLType>(target: Function, propertyName: string, type: T, typeOptions: TypeOptions, nullableByDefault: boolean): T;
export declare function convertToType(Target: any, data?: object): object | undefined;
export declare function getEnumValuesMap<T extends object>(enumObject: T): any;
