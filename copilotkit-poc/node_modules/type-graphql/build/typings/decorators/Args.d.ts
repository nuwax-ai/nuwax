import { type ParameterDecorator } from "../typings/index.js";
import { type ReturnTypeFunc, type ValidateOptions } from "./types.js";
export declare function Args(): ParameterDecorator;
export declare function Args(options: ValidateOptions): ParameterDecorator;
export declare function Args(paramTypeFunction: ReturnTypeFunc, options?: ValidateOptions): ParameterDecorator;
