import { Href, LinkDOMProps, RouterOptions } from '@react-types/shared';
import { DOMAttributes, JSX, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
interface Router {
    isNative: boolean;
    open: (target: Element, modifiers: Modifiers, href: Href, routerOptions: RouterOptions | undefined) => void;
    useHref: (href: Href) => string;
}
interface RouterProviderProps {
    navigate: (path: Href, routerOptions: RouterOptions | undefined) => void;
    useHref?: (href: Href) => string;
    children: ReactNode;
}
/**
 * A RouterProvider accepts a `navigate` function from a framework or client side router,
 * and provides it to all nested React Aria links to enable client side navigation.
 */
export declare function RouterProvider(props: RouterProviderProps): JSX.Element;
export declare function useRouter(): Router;
interface Modifiers {
    metaKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
}
export declare function shouldClientNavigate(link: HTMLAnchorElement, modifiers: Modifiers): boolean;
export declare function openLink(target: HTMLAnchorElement, modifiers: Modifiers, setOpening?: boolean): void;
export declare function useSyntheticLinkProps(props: LinkDOMProps): DOMAttributes<HTMLElement>;
/** @deprecated - For backward compatibility. */
export declare function getSyntheticLinkProps(props: LinkDOMProps): DOMAttributes<HTMLElement>;
export declare function useLinkProps(props?: LinkDOMProps): LinkDOMProps;
export declare function handleLinkClick(e: ReactMouseEvent, router: Router, href: Href | undefined, routerOptions: RouterOptions | undefined): void;
export {};
