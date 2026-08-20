import { Key } from '@react-types/shared';
import { TreeState } from 'react-stately/useTreeState';
interface MenuData {
    onClose?: () => void;
    onAction?: (key: Key) => void;
    shouldUseVirtualFocus?: boolean;
}
export declare const menuData: WeakMap<TreeState<unknown>, MenuData>;
export {};
