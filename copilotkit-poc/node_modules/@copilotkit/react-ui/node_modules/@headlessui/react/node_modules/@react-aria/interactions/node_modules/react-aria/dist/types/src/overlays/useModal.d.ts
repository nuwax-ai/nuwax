import { DOMAttributes } from '@react-types/shared';
import React, { AriaAttributes, JSX, ReactNode } from 'react';
export interface ModalProviderProps extends DOMAttributes {
    children: ReactNode;
}
/**
 * Each ModalProvider tracks how many modals are open in its subtree. On mount, the modals trigger
 * `addModal` to increment the count, and trigger `removeModal` on unmount to decrement it. This is
 * done recursively so that all parent providers are incremented and decremented. If the modal count
 * is greater than zero, we add `aria-hidden` to this provider to hide its subtree from screen
 * readers. This is done using React context in order to account for things like portals, which can
 * cause the React tree and the DOM tree to differ significantly in structure.
 */
export declare function ModalProvider(props: ModalProviderProps): JSX.Element;
export interface ModalProviderAria {
    /**
     * Props to be spread on the container element.
     */
    modalProviderProps: AriaAttributes;
}
/**
 * Used to determine if the tree should be aria-hidden based on how many
 * modals are open.
 */
export declare function useModalProvider(): ModalProviderAria;
/**
 * An OverlayProvider acts as a container for the top-level application.
 * Any application that uses modal dialogs or other overlays should
 * be wrapped in a `<OverlayProvider>`. This is used to ensure that
 * the main content of the application is hidden from screen readers
 * if a modal or other overlay is opened. Only the top-most modal or
 * overlay should be accessible at once.
 */
export declare function OverlayProvider(props: ModalProviderProps): JSX.Element;
export interface OverlayContainerProps extends ModalProviderProps {
    /**
     * The container element in which the overlay portal will be placed.
     *
     * @deprecated - Use a parent UNSAFE_PortalProvider to set your portal container instead.
     * @default document.body
     */
    portalContainer?: Element;
}
/**
 * A container for overlays like modals and popovers. Renders the overlay
 * into a Portal which is placed at the end of the document body.
 * Also ensures that the overlay is hidden from screen readers if a
 * nested modal is opened. Only the top-most modal or overlay should
 * be accessible at once.
 */
export declare function OverlayContainer(props: OverlayContainerProps): React.ReactPortal | null;
interface ModalAriaProps extends DOMAttributes {
    /** Data attribute marks the dom node as a modal for the aria-modal-polyfill. */
    'data-ismodal': boolean;
}
export interface AriaModalOptions {
    isDisabled?: boolean;
}
export interface ModalAria {
    /** Props for the modal content element. */
    modalProps: ModalAriaProps;
}
/**
 * Hides content outside the current `<OverlayContainer>` from screen readers
 * on mount and restores it on unmount. Typically used by modal dialogs and
 * other types of overlays to ensure that only the top-most modal is
 * accessible at once.
 */
export declare function useModal(options?: AriaModalOptions): ModalAria;
export {};
