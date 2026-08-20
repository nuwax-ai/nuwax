import { Repeater } from "./core.js";
export interface Token {
    readonly id: number;
    readonly limit: number;
    readonly remaining: number;
    release(): void;
}
export declare function createSemaphore(limit: number): Repeater<Token>;
export interface ThrottleToken extends Token {
    readonly reset: number;
}
export declare function createThrottle(wait: number, options?: {
    limit?: number;
    cooldown?: boolean;
}): Repeater<ThrottleToken>;
