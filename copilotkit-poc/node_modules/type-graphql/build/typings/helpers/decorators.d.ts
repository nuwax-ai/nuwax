import { type DescriptionOptions, type ReturnTypeFunc } from "../decorators/types.js";
export interface TypeDecoratorParams<T> {
    options: Partial<T>;
    returnTypeFunc?: ReturnTypeFunc;
}
export declare function getTypeDecoratorParams<T extends object>(returnTypeFuncOrOptions: ReturnTypeFunc | T | undefined, maybeOptions: T | undefined): TypeDecoratorParams<T>;
export declare function getNameDecoratorParams<T extends DescriptionOptions>(nameOrOptions: string | T | undefined, maybeOptions: T | undefined): {
    name: string;
    options: T;
} | {
    options: T;
    name?: undefined;
};
export declare function getArrayFromOverloadedRest<T>(overloadedArray: Array<T | readonly T[]>): T[];
