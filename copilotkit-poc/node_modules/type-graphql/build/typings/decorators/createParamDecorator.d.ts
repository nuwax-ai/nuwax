import { type ParameterDecorator, type ResolverData } from "../typings/index.js";
export declare function createParamDecorator<TContextType extends object = object>(resolver: (resolverData: ResolverData<TContextType>) => any): ParameterDecorator;
