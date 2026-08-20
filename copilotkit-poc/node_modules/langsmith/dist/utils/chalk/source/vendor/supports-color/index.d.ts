export declare function createSupportsColor(stream: any, options?: {}): false | {
    level: any;
    hasBasic: boolean;
    has256: boolean;
    has16m: boolean;
};
declare const supportsColor: {
    stdout: boolean | {
        level: any;
        hasBasic: boolean;
        has256: boolean;
        has16m: boolean;
    };
    stderr: boolean | {
        level: any;
        hasBasic: boolean;
        has256: boolean;
        has16m: boolean;
    };
};
export default supportsColor;
