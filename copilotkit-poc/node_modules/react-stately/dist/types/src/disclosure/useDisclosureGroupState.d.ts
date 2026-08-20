import { Key } from '@react-types/shared';
export interface DisclosureGroupProps {
    /** Whether multiple items can be expanded at the same time. */
    allowsMultipleExpanded?: boolean;
    /** Whether all items are disabled. */
    isDisabled?: boolean;
    /** The currently expanded keys in the group (controlled). */
    expandedKeys?: Iterable<Key>;
    /** The initial expanded keys in the group (uncontrolled). */
    defaultExpandedKeys?: Iterable<Key>;
    /** Handler that is called when items are expanded or collapsed. */
    onExpandedChange?: (keys: Set<Key>) => any;
}
export interface DisclosureGroupState {
    /** Whether multiple items can be expanded at the same time. */
    readonly allowsMultipleExpanded: boolean;
    /** Whether all items are disabled. */
    readonly isDisabled: boolean;
    /** A set of keys for items that are expanded. */
    readonly expandedKeys: Set<Key>;
    /** Toggles the expanded state for an item by its key. */
    toggleKey(key: Key): void;
    /** Replaces the set of expanded keys. */
    setExpandedKeys(keys: Set<Key>): void;
}
/**
 * Manages state for a group of disclosures, e.g. an accordion.
 * It supports both single and multiple expanded items.
 */
export declare function useDisclosureGroupState(props: DisclosureGroupProps): DisclosureGroupState;
