import { PointerType } from '@react-types/shared';
export type Modality = 'keyboard' | 'pointer' | 'virtual';
type HandlerEvent = PointerEvent | MouseEvent | KeyboardEvent | FocusEvent | null;
type Handler = (modality: Modality, e: HandlerEvent) => void;
export type FocusVisibleHandler = (isFocusVisible: boolean) => void;
export interface FocusVisibleProps {
    /** Whether the element is a text input. */
    isTextInput?: boolean;
    /** Whether the element will be auto focused. */
    autoFocus?: boolean;
}
export interface FocusVisibleResult {
    /** Whether keyboard focus is visible globally. */
    isFocusVisible: boolean;
}
export declare const changeHandlers: Set<Handler>;
interface GlobalListenerData {
    focus: () => void;
}
export declare let hasSetupGlobalListeners: Map<Window, GlobalListenerData>;
/**
 * EXPERIMENTAL
 * Adds a window (i.e. iframe) to the list of windows that are being tracked for focus visible.
 *
 * Sometimes apps render portions of their tree into an iframe. In this case, we cannot accurately
 * track if the focus is visible because we cannot see interactions inside the iframe. If you have
 * this in your application's architecture, then this function will attach event listeners inside
 * the iframe. You should call `addWindowFocusTracking` with an element from inside the window you
 * wish to add. We'll retrieve the relevant elements based on that. Note, you do not need to call
 * this for the default window, as we call it for you.
 *
 * When you are ready to stop listening, but you do not wish to unmount the iframe, you may call the
 * cleanup function returned by `addWindowFocusTracking`. Otherwise, when you unmount the iframe,
 * all listeners and state will be cleaned up automatically for you.
 *
 * @param element @default document.body - The element provided will be used to get the window to
 *   add.
 * @returns A function to remove the event listeners and cleanup the state.
 */
export declare function addWindowFocusTracking(element?: HTMLElement | null): () => void;
/**
 * If true, keyboard focus is visible.
 */
export declare function isFocusVisible(): boolean;
export declare function getInteractionModality(): Modality | null;
export declare function setInteractionModality(modality: Modality): void;
/** @private */
export declare function getPointerType(): PointerType;
/**
 * Keeps state of the current modality.
 */
export declare function useInteractionModality(): Modality | null;
/**
 * Manages focus visible state for the page, and subscribes individual components for updates.
 */
export declare function useFocusVisible(props?: FocusVisibleProps): FocusVisibleResult;
/**
 * Listens for trigger change and reports if focus is visible (i.e., modality is not pointer).
 */
export declare function useFocusVisibleListener(fn: FocusVisibleHandler, deps: ReadonlyArray<any>, opts?: {
    enabled?: boolean;
    isTextInput?: boolean;
}): void;
export {};
