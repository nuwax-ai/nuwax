import { AriaLabelingProps, DOMProps, RefObject } from '@react-types/shared';
import { HTMLAttributes } from 'react';
import { StepListProps, StepListState } from 'react-stately/private/steplist/useStepListState';
export interface AriaStepListProps<T> extends StepListProps<T>, AriaLabelingProps, DOMProps {
}
export interface StepListAria {
    listProps: HTMLAttributes<HTMLElement>;
}
export declare function useStepList<T>(props: AriaStepListProps<T>, state: StepListState<T>, ref: RefObject<HTMLOListElement | null>): StepListAria;
