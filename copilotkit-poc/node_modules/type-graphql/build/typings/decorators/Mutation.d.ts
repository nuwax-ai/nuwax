import { type AdvancedOptions, type ReturnTypeFunc } from "./types.js";
export declare function Mutation(): MethodDecorator;
export declare function Mutation(options: AdvancedOptions): MethodDecorator;
export declare function Mutation(returnTypeFunc: ReturnTypeFunc, options?: AdvancedOptions): MethodDecorator;
