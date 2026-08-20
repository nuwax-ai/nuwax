import { DOMAttributes, DragItem, DropItem } from '@react-types/shared';
export interface ClipboardProps {
    /** A function that returns the items to copy. */
    getItems?: (details: {
        action: 'cut' | 'copy';
    }) => DragItem[];
    /** Handler that is called when the user triggers a copy interaction. */
    onCopy?: () => void;
    /** Handler that is called when the user triggers a cut interaction. */
    onCut?: () => void;
    /** Handler that is called when the user triggers a paste interaction. */
    onPaste?: (items: DropItem[]) => void;
    /** Whether the clipboard is disabled. */
    isDisabled?: boolean;
}
export interface ClipboardResult {
    /** Props for the element that will handle clipboard events. */
    clipboardProps: DOMAttributes;
}
/**
 * Handles clipboard interactions for a focusable element. Supports items of multiple
 * data types, and integrates with the operating system native clipboard.
 */
export declare function useClipboard(options: ClipboardProps): ClipboardResult;
