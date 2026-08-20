declare const supportsColor: {
    stdout: false | {
        level: number;
        hasBasic: boolean;
        has256: boolean;
        has16m: boolean;
    };
    stderr: false | {
        level: number;
        hasBasic: boolean;
        has256: boolean;
        has16m: boolean;
    };
};
export default supportsColor;
