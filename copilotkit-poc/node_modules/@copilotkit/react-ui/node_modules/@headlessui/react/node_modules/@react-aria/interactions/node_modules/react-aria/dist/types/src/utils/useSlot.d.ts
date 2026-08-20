import { RefCallback } from 'react';
export declare function useSlot(initialState?: boolean | (() => boolean)): [RefCallback<any>, boolean];
interface SlotAria {
    id: string | undefined;
    ref: RefCallback<any>;
}
export declare function useSlotId2(initialState?: boolean | (() => boolean)): SlotAria;
export {};
