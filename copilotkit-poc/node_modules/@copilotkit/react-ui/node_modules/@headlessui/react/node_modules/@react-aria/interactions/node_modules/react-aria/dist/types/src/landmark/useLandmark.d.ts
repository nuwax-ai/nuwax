import { AriaLabelingProps, DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
export type AriaLandmarkRole = 'main' | 'region' | 'search' | 'navigation' | 'form' | 'banner' | 'contentinfo' | 'complementary';
export interface AriaLandmarkProps extends AriaLabelingProps {
    role: AriaLandmarkRole;
    focus?: (direction: 'forward' | 'backward') => void;
}
export interface LandmarkAria {
    landmarkProps: DOMAttributes;
}
export interface LandmarkControllerOptions {
    /**
     * The element from which to start navigating.
     *
     * @default document.activeElement
     */
    from?: FocusableElement;
}
/** A LandmarkController allows programmatic navigation of landmarks. */
export interface LandmarkController {
    /** Moves focus to the next landmark. */
    focusNext(opts?: LandmarkControllerOptions): boolean;
    /** Moves focus to the previous landmark. */
    focusPrevious(opts?: LandmarkControllerOptions): boolean;
    /** Moves focus to the main landmark. */
    focusMain(): boolean;
    /** Moves focus either forward or backward in the landmark sequence. */
    navigate(direction: 'forward' | 'backward', opts?: LandmarkControllerOptions): boolean;
    /**
     * Disposes the landmark controller. When no landmarks are registered, and no
     * controllers are active, the landmark keyboard listeners are removed from the page.
     */
    dispose(): void;
}
/** Creates a LandmarkController, which allows programmatic navigation of landmarks. */
export declare function UNSTABLE_createLandmarkController(): LandmarkController;
/**
 * Provides landmark navigation in an application. Call this with a role and label to register a
 * landmark navigable with F6.
 *
 * @param props - Props for the landmark.
 * @param ref - Ref to the landmark.
 */
export declare function useLandmark(props: AriaLandmarkProps, ref: RefObject<FocusableElement | null>): LandmarkAria;
