import React, { JSX, ReactNode } from 'react';
export interface PortalProviderProps {
    /** Should return the element where we should portal to. Can clear the context by passing null. */
    getContainer?: (() => HTMLElement | null) | null;
    /**
     * The content of the PortalProvider. Should contain all children that want to portal their
     * overlays to the element returned by the provided `getContainer()`.
     */
    children: ReactNode;
}
export interface PortalProviderContextValue extends Omit<PortalProviderProps, 'children'> {
}
export declare const PortalContext: React.Context<PortalProviderContextValue>;
/**
 * Sets the portal container for all overlay elements rendered by its children.
 */
export declare function UNSAFE_PortalProvider(props: PortalProviderProps): JSX.Element;
export declare function useUNSAFE_PortalContext(): PortalProviderContextValue;
