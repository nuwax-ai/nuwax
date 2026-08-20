type EventName = string;
type EventFnArgs = any[];
type EmitterContract = Record<EventName, EventFnArgs>;
export interface EmitterOptions {
    /** How many event listeners for a particular event before emitting a warning (0 = disabled)
     *  @default 10
     **/
    maxListeners?: number;
}
/**
 * Event Emitter that takes the expected contract as a generic
 * @example
 * ```ts
 *  type Contract = {
 *    delivery_success: [DeliverySuccessResponse, Metrics],
 *    delivery_failure: [DeliveryError]
 * }
 *  new Emitter<Contract>()
 *  .on('delivery_success', (res, metrics) => ...)
 *  .on('delivery_failure', (err) => ...)
 * ```
 */
export declare class Emitter<Contract extends EmitterContract = EmitterContract> {
    maxListeners: number;
    constructor(options?: EmitterOptions);
    private callbacks;
    private warned;
    private warnIfPossibleMemoryLeak;
    on<EventName extends keyof Contract>(event: EventName, callback: (...args: Contract[EventName]) => void): this;
    once<EventName extends keyof Contract>(event: EventName, callback: (...args: Contract[EventName]) => void): this;
    off<EventName extends keyof Contract>(event: EventName, callback: (...args: Contract[EventName]) => void): this;
    emit<EventName extends keyof Contract>(event: EventName, ...args: Contract[EventName]): this;
}
export {};
//# sourceMappingURL=emitter.d.ts.map