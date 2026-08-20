import { Key, LayoutDelegate, Rect, RefObject, Size } from '@react-types/shared';
export declare class DOMLayoutDelegate implements LayoutDelegate {
    private ref;
    constructor(ref: RefObject<HTMLElement | null>);
    getItemRect(key: Key): Rect | null;
    getContentSize(): Size;
    getVisibleRect(): Rect;
}
