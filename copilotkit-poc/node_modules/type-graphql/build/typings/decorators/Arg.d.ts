import { type ParameterDecorator } from "../typings/index.js";
import { type DecoratorTypeOptions, type DeprecationOptions, type DescriptionOptions, type ReturnTypeFunc, type ValidateOptions } from "./types.js";
export type ArgOptions = DecoratorTypeOptions & DescriptionOptions & ValidateOptions & DeprecationOptions;
export declare function Arg(name: string, options?: ArgOptions): ParameterDecorator;
export declare function Arg(name: string, returnTypeFunc: ReturnTypeFunc, options?: ArgOptions): ParameterDecorator;
