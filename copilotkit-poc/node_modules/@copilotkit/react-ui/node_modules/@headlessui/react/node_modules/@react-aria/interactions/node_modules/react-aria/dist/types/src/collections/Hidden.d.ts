import React, { Context, JSX, ReactElement, ReactNode } from 'react';
export declare const HiddenContext: Context<boolean>;
export declare function Hidden(props: {
    children: ReactNode;
}): JSX.Element;
/** Creates a component that forwards its ref and returns null if it is in a hidden subtree. */
export declare function createHideableComponent<T, P = {}>(fn: (props: P, ref: React.Ref<T>) => ReactElement | null): (props: P & React.RefAttributes<T>) => ReactElement | null;
/** Returns whether the component is in a hidden subtree. */
export declare function useIsHidden(): boolean;
