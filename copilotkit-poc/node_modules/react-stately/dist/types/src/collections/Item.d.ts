import { ItemProps } from '@react-types/shared';
import { PartialNode } from './types';
import { JSX, ReactElement } from 'react';
declare function Item<T>(props: ItemProps<T>): ReactElement | null;
declare namespace Item {
    var getCollectionNode: <T>(props: ItemProps<T>, context: any) => Generator<PartialNode<T>, any, any>;
}
declare let _Item: <T>(props: ItemProps<T>) => JSX.Element;
export { _Item as Item };
