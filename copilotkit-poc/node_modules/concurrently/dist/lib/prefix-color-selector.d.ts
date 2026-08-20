import { ChalkInstance } from 'chalk';
export declare class PrefixColorSelector {
    private colorGenerator;
    constructor(customColors?: string | string[]);
    /**
     * Colors used by `auto` selection and default cycling.
     *
     * Each color is chosen to be visually distinct on both dark and light
     * terminal backgrounds, without carrying semantic meaning (e.g. red
     * implies errors) or blending into default text (e.g. white/grey).
     * Background colors are excluded to keep output lightweight.
     *
     * This list does NOT restrict manually specified colors — any valid Chalk
     * color name, hex value, or modifier can be passed via `--prefix-colors`.
     */
    static get ACCEPTABLE_CONSOLE_COLORS(): (keyof ChalkInstance)[];
    /**
     * @returns The given custom colors then a set of acceptable console colors indefinitely.
     */
    getNextColor(): string;
}
