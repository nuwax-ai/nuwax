import * as React from 'react';

declare module 'react' {
    interface ReactElement {
        $$typeof?: symbol | string;
    }
}
interface SlotProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
}
declare function createSlot(ownerName: string): React.ForwardRefExoticComponent<SlotProps & React.RefAttributes<HTMLElement>>;
declare const Slot: React.ForwardRefExoticComponent<SlotProps & React.RefAttributes<HTMLElement>>;
type SlottableChildrenProps = {
    children: React.ReactNode;
};
type SlottableRenderFnProps = {
    child: React.ReactNode;
    children: (slottable: React.ReactNode) => React.ReactNode;
};
type SlottableProps = SlottableRenderFnProps | SlottableChildrenProps;
interface SlottableComponent extends React.FC<SlottableProps> {
    __radixId: symbol;
}
declare function createSlottable(ownerName: string): SlottableComponent;
declare const Slottable: SlottableComponent;

export { Slot as Root, Slot, type SlotProps, Slottable, createSlot, createSlottable };
