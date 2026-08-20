interface Event {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}
export declare function isCtrlKeyPressed(e: Event): boolean;
export declare function willOpenKeyboard(target: Element): boolean;
export {};
