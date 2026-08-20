import { HTMLAttributes } from 'react';
import { Key, RefObject } from '@react-types/shared';
import { StepListState } from 'react-stately/private/steplist/useStepListState';
export interface AriaStepListItemProps {
    key: Key;
}
export interface StepListItemAria {
    /** Props for the step link element. */
    stepProps: HTMLAttributes<HTMLElement>;
    /** Props for the visually hidden element indicating the step state. */
    stepStateProps?: HTMLAttributes<HTMLElement>;
    /** Text content for the visually hidden message indicating the status of the step state. */
    stepStateText?: String;
}
export declare function useStepListItem<T>(props: AriaStepListItemProps, state: StepListState<T>, ref: RefObject<HTMLElement | null>): StepListItemAria;
