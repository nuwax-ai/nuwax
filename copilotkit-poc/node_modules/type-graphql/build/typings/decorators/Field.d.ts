import { type AdvancedOptions, type MethodAndPropDecorator, type ReturnTypeFunc } from "./types.js";
export type FieldOptions = AdvancedOptions & {
    /** Set to `true` to disable auth and all middlewares stack for this field resolver */
    simple?: boolean;
};
export declare function Field(): MethodAndPropDecorator;
export declare function Field(options: FieldOptions): MethodAndPropDecorator;
export declare function Field(returnTypeFunction?: ReturnTypeFunc, options?: FieldOptions): MethodAndPropDecorator;
