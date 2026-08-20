import { type AdvancedOptions, type ReturnTypeFunc } from "./types.js";
export declare function Query(): MethodDecorator;
export declare function Query(options: AdvancedOptions): MethodDecorator;
export declare function Query(returnTypeFunc: ReturnTypeFunc, options?: AdvancedOptions): MethodDecorator;
