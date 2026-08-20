import { type AdvancedOptions, type ReturnTypeFunc } from "../decorators/types.js";
import { type ResolverMetadata } from "../metadata/definitions/index.js";
export declare function getResolverMetadata(prototype: object, propertyKey: string | symbol, returnTypeFunc?: ReturnTypeFunc, options?: AdvancedOptions): ResolverMetadata;
