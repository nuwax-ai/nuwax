import { FetchAPI, ServerAdapterRequestHandler, type ServerAdapterInitialContext } from '../types.cjs';
export interface ServerAdapterPlugin<TServerContext = {}> {
    /**
     * A tracer instance. It can be used to wrap the entire request handling pipeline (including the
     * plugin hooks). It is mostly used for observability (monitoring, tracing, etc...).
     */
    instrumentation?: Instrumentation;
    /**
     * This hook is invoked for ANY incoming HTTP request. Here you can manipulate the request,
     * create a short circuit before the request handler takes it over.
     *
     * Warning: Exceptions thrown by this hook are not caught.
     * This means they will buble up to the HTTP server underlying implementation.
     * For example, the `node:http` server crashes the entire process on uncaught exceptions.
     */
    onRequest?: OnRequestHook<TServerContext & ServerAdapterInitialContext>;
    /**
     * This hook is invoked after a HTTP request (both GraphQL and NON GraphQL) has been processed
     * and after the response has been forwarded to the client. Here you can perform any cleanup
     * or logging operations, or you can manipulate the outgoing response object.
     *
     * Warning: Exceptions thrown by this hook are not caught.
     * This means they will buble up to the HTTP server underlying implementation.
     * For example, the `node:http` server crashes the entire process on uncaught exceptions.
     */
    onResponse?: OnResponseHook<TServerContext & ServerAdapterInitialContext>;
    /**
     * This hook is invoked when the server is being disposed.
     * The server disposal is triggered either by the process termination or the explicit server disposal.
     * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
     */
    [Symbol.dispose]?: () => void;
    /**
     * This hook is invoked when the server is being disposed.
     * The server disposal is triggered either by the process termination or the explicit server disposal.
     * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
     */
    [Symbol.asyncDispose]?: () => PromiseLike<void> | void;
    /**
     * This hook is invoked when the server is being disposed.
     * The server disposal is triggered either by the process termination or the explicit server disposal.
     * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
     */
    onDispose?: () => PromiseLike<void> | void;
}
export type Instrumentation = {
    /**
     * Run code befor, after or around the handling of each request.
     * This instrument can't modify result or paramters of the request handling.
     * To have access to the input or the output of the request handling, use the `onRequest` hook.
     *
     * Note: The `wrapped` function must be called, otherwise the request will not be handled properly
     */
    request?: (payload: {
        request: Request;
    }, wrapped: () => Promise<void> | void) => Promise<void> | void;
};
export type OnRequestHook<TServerContext> = (payload: OnRequestEventPayload<TServerContext>) => Promise<void> | void;
export interface OnRequestEventPayload<TServerContext> {
    request: Request;
    setRequest(newRequest: Request): void;
    serverContext: TServerContext;
    fetchAPI: FetchAPI;
    requestHandler: ServerAdapterRequestHandler<TServerContext>;
    setRequestHandler(newRequestHandler: ServerAdapterRequestHandler<TServerContext>): void;
    endResponse(response: Response): void;
    url: URL;
}
export type OnResponseHook<TServerContext> = (payload: OnResponseEventPayload<TServerContext>) => Promise<void> | void;
export interface OnResponseEventPayload<TServerContext> {
    request: Request;
    serverContext: TServerContext;
    response: Response;
    setResponse(newResponse: Response): void;
    fetchAPI: FetchAPI;
}
