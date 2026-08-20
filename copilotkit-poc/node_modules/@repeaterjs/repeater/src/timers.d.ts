import { Repeater, RepeaterBuffer } from "./core.js";
export declare class TimeoutError extends Error {
    constructor(message: string);
}
export declare function createDelay(wait: number): Repeater<number>;
export declare function createTimeout(wait: number): Repeater<undefined>;
export declare function createInterval(wait: number, buffer?: RepeaterBuffer): Repeater<number>;
