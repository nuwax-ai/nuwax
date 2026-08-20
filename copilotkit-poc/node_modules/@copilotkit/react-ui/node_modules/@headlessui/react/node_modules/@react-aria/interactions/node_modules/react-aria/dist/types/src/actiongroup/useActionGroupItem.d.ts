import { DOMAttributes, FocusableElement, Key, RefObject } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
import { PressProps } from '../interactions/usePress';
export interface AriaActionGroupItemProps {
    key: Key;
}
export interface ActionGroupItemAria {
    buttonProps: DOMAttributes & PressProps;
}
export declare function useActionGroupItem<T>(props: AriaActionGroupItemProps, state: ListState<T>, ref?: RefObject<FocusableElement | null>): ActionGroupItemAria;
