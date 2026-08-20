import React, { ReactNode } from 'react';
export interface OverlayProps {
    /**
     * The container element in which the overlay portal will be placed.
     *
     * @default document.body
     */
    portalContainer?: Element;
    /** The overlay to render in the portal. */
    children: ReactNode;
    /**
     * Disables default focus management for the overlay, including containment and restoration.
     * This option should be used very carefully. When focus management is disabled, you must
     * implement focus containment and restoration to ensure the overlay is keyboard accessible.
     */
    disableFocusManagement?: boolean;
    /**
     * Whether to contain focus within the overlay.
     */
    shouldContainFocus?: boolean;
    /**
     * Whether the overlay is currently performing an exit animation. When true,
     * focus is allowed to move outside.
     */
    isExiting?: boolean;
}
export declare const OverlayContext: React.Context<{
    contain: boolean;
    setContain: React.Dispatch<React.SetStateAction<boolean>>;
} | null>;
/**
 * A container which renders an overlay such as a popover or modal in a portal,
 * and provides a focus scope for the child elements.
 */
export declare function Overlay(props: OverlayProps): React.ReactPortal | null;
/** @private */
export declare function useOverlayFocusContain(): void;
