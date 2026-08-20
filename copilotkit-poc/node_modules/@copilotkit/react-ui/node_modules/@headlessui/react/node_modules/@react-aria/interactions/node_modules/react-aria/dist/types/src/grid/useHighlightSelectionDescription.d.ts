import { AriaLabelingProps } from '@react-types/shared';
import { MultipleSelectionManager } from 'react-stately/useMultipleSelectionState';
export interface HighlightSelectionDescriptionProps {
    selectionManager: MultipleSelectionManager;
    hasItemActions?: boolean;
}
/**
 * Computes the description for a grid selectable collection.
 *
 * @param props
 */
export declare function useHighlightSelectionDescription(props: HighlightSelectionDescriptionProps): AriaLabelingProps;
