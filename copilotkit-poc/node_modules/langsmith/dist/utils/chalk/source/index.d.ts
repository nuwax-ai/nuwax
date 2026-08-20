declare const stdoutColor: boolean | {
    level: any;
    hasBasic: boolean;
    has256: boolean;
    has16m: boolean;
}, stderrColor: boolean | {
    level: any;
    hasBasic: boolean;
    has256: boolean;
    has16m: boolean;
};
export declare class Chalk {
    constructor(options: any);
}
export declare const chalkStderr: (...strings: any[]) => string;
export { modifierNames, foregroundColorNames, backgroundColorNames, colorNames, modifierNames as modifiers, foregroundColorNames as foregroundColors, backgroundColorNames as backgroundColors, colorNames as colors, } from './vendor/ansi-styles/index.js';
export { stdoutColor as supportsColor, stderrColor as supportsColorStderr, };
declare const _default: any;
export default _default;
