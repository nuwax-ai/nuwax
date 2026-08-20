import { DropOperation } from '@react-types/shared';
export interface IDropOperation {
    readonly none: 0;
    readonly cancel: 0;
    readonly move: number;
    readonly copy: number;
    readonly link: number;
    readonly all: number;
}
export declare enum DROP_OPERATION {
    none = 0,
    cancel = 0,
    move = 1,
    copy = 2,
    link = 4,
    all = 7
}
interface DropOperationAllowed extends IDropOperation {
    readonly copyMove: number;
    readonly copyLink: number;
    readonly linkMove: number;
    readonly all: number;
    readonly uninitialized: number;
}
export declare const DROP_OPERATION_ALLOWED: DropOperationAllowed;
interface EffectAllowed {
    0: 'none' | 'cancel';
    1: 'move';
    2: 'copy';
    3: 'copyMove';
    4: 'link';
    5: 'linkMove';
    6: 'copyLink';
    7: 'all';
}
export declare const EFFECT_ALLOWED: EffectAllowed;
type DropEffect = 'none' | 'link' | 'copy' | 'move';
export declare const DROP_EFFECT_TO_DROP_OPERATION: {
    [K in DropEffect]: DropOperation;
};
export declare const DROP_OPERATION_TO_DROP_EFFECT: {
    [K in DropOperation]: DropEffect;
};
export declare const NATIVE_DRAG_TYPES: Set<string>;
export declare const CUSTOM_DRAG_TYPE = "application/vnd.react-aria.items+json";
export declare const GENERIC_TYPE = "application/octet-stream";
export {};
