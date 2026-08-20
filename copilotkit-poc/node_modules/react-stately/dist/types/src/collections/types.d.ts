import { Key } from '@react-types/shared';
import { ReactElement, ReactNode } from 'react';
export interface PartialNode<T> {
    type?: string;
    key?: Key | null;
    value?: T;
    element?: ReactElement | null;
    wrapper?: (element: ReactElement) => ReactElement;
    rendered?: ReactNode;
    textValue?: string;
    'aria-label'?: string;
    index?: number;
    renderer?: (item: T) => ReactElement | null;
    hasChildNodes?: boolean;
    childNodes?: () => IterableIterator<PartialNode<T>>;
    props?: any;
    shouldInvalidate?: (context: any) => boolean;
}
