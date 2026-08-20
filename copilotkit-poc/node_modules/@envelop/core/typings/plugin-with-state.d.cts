import { MaybePromise } from '@whatwg-node/promise-helpers';
export declare function withState<P extends {
    instrumentation?: GenericInstrumentation;
}, State = object>(pluginFactory: (getState: <SP extends {}>(payload: SP) => PayloadWithState<SP, State, State, State>['state']) => PluginWithState<P, State, State, State>): P;
export type HttpState<T> = {
    forRequest: Partial<T>;
};
export type GraphQLState<T> = {
    forOperation: Partial<T>;
};
export type GatewayState<T> = {
    forSubgraphExecution: Partial<T>;
};
export declare function getMostSpecificState<T>(state?: Partial<HttpState<T> & GraphQLState<T> & GatewayState<T>>): Partial<T> | undefined;
type GenericInstrumentation = Record<string, (payload: any, wrapped: () => MaybePromise<void>) => MaybePromise<void>>;
type PayloadWithState<T, Http, GraphQL, Gateway> = T extends {
    executionRequest: any;
} ? T & {
    state: Partial<HttpState<Http> & GraphQLState<GraphQL>> & GatewayState<Gateway>;
} : T extends {
    executionRequest?: any;
} ? T & {
    state: Partial<HttpState<Http> & GraphQLState<GraphQL> & GatewayState<Gateway>>;
} : T extends {
    context: any;
} ? T & {
    state: HttpState<Http> & GraphQLState<GraphQL>;
} : T extends {
    request: any;
} ? T & {
    state: HttpState<Http>;
} : T extends {
    request?: any;
} ? T & {
    state: Partial<HttpState<Http>>;
} : T;
export type PluginWithState<P, Http = object, GraphQL = object, Gateway = object> = {
    [K in keyof P]: K extends 'instrumentation' ? P[K] extends infer Instrumentation | undefined ? {
        [I in keyof Instrumentation]: Instrumentation[I] extends ((payload: infer IP, ...args: infer Args) => infer IR) | undefined ? ((payload: PayloadWithState<IP, Http, GraphQL, Gateway>, ...args: Args) => IR) | undefined : Instrumentation[I];
    } : P[K] : P[K] extends ((payload: infer T) => infer R) | undefined ? ((payload: PayloadWithState<T, Http, GraphQL, Gateway>) => R) | undefined : P[K];
};
export {};
