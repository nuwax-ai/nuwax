import { PartialNode } from './types';
import { JSX, ReactElement } from 'react';
import { SectionProps } from '@react-types/shared';
declare function Section<T>(props: SectionProps<T>): ReactElement | null;
declare namespace Section {
    var getCollectionNode: <T>(props: SectionProps<T>) => Generator<PartialNode<T>, any, any>;
}
declare let _Section: <T>(props: SectionProps<T>) => JSX.Element;
export { _Section as Section };
