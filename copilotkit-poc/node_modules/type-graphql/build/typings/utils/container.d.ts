import { type ResolverData } from "../typings/index.js";
export type SupportedType<T> = (new (...args: any[]) => T) | Function;
export interface ContainerType {
    get(someClass: any, resolverData: ResolverData<any>): any | Promise<any>;
}
export type ContainerGetter<TContext extends object> = (resolverData: ResolverData<TContext>) => ContainerType;
export declare class IOCContainer {
    private container;
    private containerGetter;
    private defaultContainer;
    constructor(iocContainerOrContainerGetter?: ContainerType | ContainerGetter<any>);
    getInstance<T = any>(someClass: SupportedType<T>, resolverData: ResolverData<any>): T | Promise<T>;
}
