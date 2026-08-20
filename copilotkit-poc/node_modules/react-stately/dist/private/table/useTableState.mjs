import {useGridState as $183b79a1dd6664c1$export$4007ac09ff9c68ed} from "../grid/useGridState.mjs";
import {TableCollection as $3b14a8cc70843920$export$596e1b2e2cf93690} from "./TableCollection.mjs";
import {useCollection as $d03379b88399b8c5$export$6cd28814d92fa9c9} from "../collections/useCollection.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $5on2X$useState, useMemo as $5on2X$useMemo, useCallback as $5on2X$useCallback} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




const $178a7f94e1b4b497$var$OPPOSITE_SORT_DIRECTION = {
    ascending: 'descending',
    descending: 'ascending'
};
function $178a7f94e1b4b497$export$907bcc6c48325fd6(props) {
    let [isKeyboardNavigationDisabled, setKeyboardNavigationDisabled] = (0, $5on2X$useState)(false);
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, treeColumn: treeColumn = null } = props;
    let context = (0, $5on2X$useMemo)(()=>({
            showSelectionCheckboxes: showSelectionCheckboxes && selectionMode !== 'none',
            showDragButtons: showDragButtons,
            selectionMode: selectionMode,
            columns: []
        }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        props.children,
        showSelectionCheckboxes,
        selectionMode,
        showDragButtons
    ]);
    let collection = (0, $d03379b88399b8c5$export$6cd28814d92fa9c9)(props, (0, $5on2X$useCallback)((nodes)=>new (0, $3b14a8cc70843920$export$596e1b2e2cf93690)(nodes, null, context), [
        context
    ]), context);
    let { disabledKeys: disabledKeys, selectionManager: selectionManager } = (0, $183b79a1dd6664c1$export$4007ac09ff9c68ed)({
        ...props,
        collection: collection,
        disabledBehavior: props.disabledBehavior || 'selection'
    });
    let [expandedKeys, setExpandedKeys] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), props.onExpandedChange);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager,
        showSelectionCheckboxes: props.showSelectionCheckboxes || false,
        sortDescriptor: props.sortDescriptor ?? null,
        isKeyboardNavigationDisabled: collection.size === 0 || isKeyboardNavigationDisabled,
        setKeyboardNavigationDisabled: setKeyboardNavigationDisabled,
        sort (columnKey, direction) {
            props.onSortChange?.({
                column: columnKey,
                direction: direction ?? (props.sortDescriptor?.column === columnKey ? $178a7f94e1b4b497$var$OPPOSITE_SORT_DIRECTION[props.sortDescriptor.direction] : 'ascending')
            });
        },
        expandedKeys: expandedKeys,
        toggleKey (key) {
            setExpandedKeys((keys)=>{
                let newKeys = new Set(keys);
                if (newKeys.has(key)) newKeys.delete(key);
                else newKeys.add(key);
                return newKeys;
            });
        },
        treeColumn: treeColumn
    };
}
function $178a7f94e1b4b497$export$31447e17397b15c2(state, filterFn) {
    let collection = (0, $5on2X$useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
        state.collection,
        filterFn
    ]);
    let selectionManager = state.selectionManager.withCollection(collection);
    // TODO: handle focus key reset? That logic is in useGridState
    return {
        ...state,
        collection: collection,
        selectionManager: selectionManager
    };
}


export {$178a7f94e1b4b497$export$907bcc6c48325fd6 as useTableState, $178a7f94e1b4b497$export$31447e17397b15c2 as UNSTABLE_useFilteredTableState};
//# sourceMappingURL=useTableState.mjs.map
