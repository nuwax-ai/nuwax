import { AriaButtonProps } from '../button/useButton';
import { DOMAttributes } from 'react';
interface VirtualDropResult {
    dropProps: AriaButtonProps & DOMAttributes<HTMLDivElement>;
}
export declare function useVirtualDrop(): VirtualDropResult;
export {};
