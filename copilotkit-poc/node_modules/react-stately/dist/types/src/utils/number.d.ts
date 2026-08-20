/**
 * Takes a value and forces it to the closest min/max if it's outside. Also forces it to the closest
 * valid step.
 */
export declare function clamp(value: number, min?: number, max?: number): number;
export declare function roundToStepPrecision(value: number, step: number): number;
export declare function snapValueToStep(value: number, min: number | undefined, max: number | undefined, step: number): number;
export declare function toFixedNumber(value: number, digits: number, base?: number): number;
