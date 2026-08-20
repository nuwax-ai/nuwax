import { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, HTMLAttributes, InputHTMLAttributes } from 'react';
import { AriaLabelingProps, DOMAttributes, Key, Orientation, RefObject } from '@react-types/shared';
import { AriaToggleButtonProps, ToggleButtonAria } from './useToggleButton';
import { ToggleGroupProps, ToggleGroupState } from 'react-stately/useToggleGroupState';
export interface AriaToggleButtonGroupProps extends ToggleGroupProps, AriaLabelingProps {
    /**
     * The orientation of the the toggle button group.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
}
export interface ToggleButtonGroupAria {
    /**
     * Props for the toggle button group container.
     */
    groupProps: DOMAttributes;
}
export declare function useToggleButtonGroup(props: AriaToggleButtonGroupProps, state: ToggleGroupState, ref: RefObject<HTMLElement | null>): ToggleButtonGroupAria;
export interface AriaToggleButtonGroupItemProps<E extends ElementType = 'button'> extends Omit<AriaToggleButtonProps<E>, 'id' | 'isSelected' | 'defaultSelected' | 'onChange'> {
    /** An identifier for the item in the `selectedKeys` of a ToggleButtonGroup. */
    id: Key;
}
export interface AriaToggleButtonGroupItemOptions<E extends ElementType> extends Omit<AriaToggleButtonGroupItemProps<E>, 'children'> {
}
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<'button'>, state: ToggleGroupState, ref: RefObject<HTMLButtonElement | null>): ToggleButtonAria<ButtonHTMLAttributes<HTMLButtonElement>>;
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<'a'>, state: ToggleGroupState, ref: RefObject<HTMLAnchorElement | null>): ToggleButtonAria<AnchorHTMLAttributes<HTMLAnchorElement>>;
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<'div'>, state: ToggleGroupState, ref: RefObject<HTMLDivElement | null>): ToggleButtonAria<HTMLAttributes<HTMLDivElement>>;
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<'input'>, state: ToggleGroupState, ref: RefObject<HTMLInputElement | null>): ToggleButtonAria<InputHTMLAttributes<HTMLInputElement>>;
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<'span'>, state: ToggleGroupState, ref: RefObject<HTMLSpanElement | null>): ToggleButtonAria<HTMLAttributes<HTMLSpanElement>>;
export declare function useToggleButtonGroupItem(props: AriaToggleButtonGroupItemOptions<ElementType>, state: ToggleGroupState, ref: RefObject<Element | null>): ToggleButtonAria<DOMAttributes>;
