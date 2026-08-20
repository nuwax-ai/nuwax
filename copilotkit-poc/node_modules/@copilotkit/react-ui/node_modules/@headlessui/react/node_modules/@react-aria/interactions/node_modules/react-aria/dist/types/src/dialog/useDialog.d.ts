import { AriaLabelingProps, DOMAttributes, DOMProps, FocusableElement, RefObject } from '@react-types/shared';
export interface AriaDialogProps extends DOMProps, AriaLabelingProps {
    /**
     * The accessibility role for the dialog.
     *
     * @default 'dialog'
     */
    role?: 'dialog' | 'alertdialog';
}
export interface DialogAria {
    /** Props for the dialog container element. */
    dialogProps: DOMAttributes;
    /** Props for the dialog title element. */
    titleProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a dialog component.
 * A dialog is an overlay shown above other content in an application.
 */
export declare function useDialog(props: AriaDialogProps, ref: RefObject<FocusableElement | null>): DialogAria;
