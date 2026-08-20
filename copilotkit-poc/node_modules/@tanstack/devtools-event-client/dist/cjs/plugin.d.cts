interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
    type: TEventName;
    payload: TPayload;
    pluginId?: string;
}
declare global {
    var __TANSTACK_EVENT_TARGET__: EventTarget | null;
}
type AllDevtoolsEvents<TEventMap extends Record<string, any>> = {
    [Key in keyof TEventMap & string]: TanStackDevtoolsEvent<Key, TEventMap[Key]>;
}[keyof TEventMap & string];
export declare class EventClient<TEventMap extends Record<string, any>> {
    #private;
    constructor({ pluginId, debug, enabled, reconnectEveryMs, }: {
        pluginId: string;
        debug?: boolean;
        reconnectEveryMs?: number;
        enabled?: boolean;
    });
    private startConnectLoop;
    private stopConnectLoop;
    private debugLog;
    private getGlobalTarget;
    getPluginId(): string;
    private dispatchCustomEventShim;
    private dispatchCustomEvent;
    private emitEventToBus;
    createEventPayload<TEvent extends keyof TEventMap & string>(eventSuffix: TEvent, payload: TEventMap[TEvent]): {
        type: string;
        payload: TEventMap[TEvent];
        pluginId: string;
    };
    emit<TEvent extends keyof TEventMap & string>(eventSuffix: TEvent, payload: TEventMap[TEvent]): void;
    on<TEvent extends keyof TEventMap & string>(eventSuffix: TEvent, cb: (event: TanStackDevtoolsEvent<TEvent, TEventMap[TEvent]>) => void, options?: {
        withEventTarget?: boolean;
    }): () => void;
    onAll(cb: (event: TanStackDevtoolsEvent<string, any>) => void): () => void;
    onAllPluginEvents(cb: (event: AllDevtoolsEvents<TEventMap>) => void): () => void;
}
export {};
