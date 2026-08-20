import {useGridState as $5f05a272399e60e1$export$4007ac09ff9c68ed} from "../grid/useGridState.js";
import {TableCollection as $6b47ca591182ac8d$export$596e1b2e2cf93690} from "./TableCollection.js";
import {useCollection as $70601b00a8062b25$export$6cd28814d92fa9c9} from "../collections/useCollection.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $btXzv$useState, useMemo as $btXzv$useMemo, useCallback as $btXzv$useCallback} from "react";

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




const $d5cc3b32ccfc476f$var$OPPOSITE_SORT_DIRECTION = {
    ascending: 'descending',
    descending: 'ascending'
};
function $d5cc3b32ccfc476f$export$907bcc6c48325fd6(props) {
    let [isKeyboardNavigationDisabled, setKeyboardNavigationDisabled] = (0, $btXzv$useState)(false);
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, treeColumn: treeColumn = null } = props;
    let context = (0, $btXzv$useMemo)(()=>({
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
    let collection = (0, $70601b00a8062b25$export$6cd28814d92fa9c9)(props, (0, $btXzv$useCallback)((nodes)=>new (0, $6b47ca591182ac8d$export$596e1b2e2cf93690)(nodes, null, context), [
        context
    ]), context);
    let { disabledKeys: disabledKeys, selectionManager: selectionManager } = (0, $5f05a272399e60e1$export$4007ac09ff9c68ed)({
        ...props,
        collection: collection,
        disabledBehavior: props.disabledBehavior || 'selection'
    });
    let [expandedKeys, setExpandedKeys] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), props.onExpandedChange);
    var _props_sortDescriptor;
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        selectionManager: selectionManager,
        showSelectionCheckboxes: props.showSelectionCheckboxes || false,
        sortDescriptor: (_props_sortDescriptor = props.sortDescriptor) !== null && _props_sortDescriptor !== void 0 ? _props_sortDescriptor : null,
        isKeyboardNavigationDisabled: collection.size === 0 || isKeyboardNavigationDisabled,
        setKeyboardNavigationDisabled: setKeyboardNavigationDisabled,
        sort (columnKey, direction) {
            var _props_sortDescriptor, _props_onSortChange;
            (_props_onSortChange = props.onSortChange) === null || _props_onSortChange === void 0 ? void 0 : _props_onSortChange.call(props, {
                column: columnKey,
                direction: direction !== null && direction !== void 0 ? direction : ((_props_sortDescriptor = props.sortDescriptor) === null || _props_sortDescriptor === void 0 ? void 0 : _props_sortDescriptor.column) === columnKey ? $d5cc3b32ccfc476f$var$OPPOSITE_SORT_DIRECTION[props.sortDescriptor.direction] : 'ascending'
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
function $d5cc3b32ccfc476f$export$31447e17397b15c2(state, filterFn) {
    let collection = (0, $btXzv$useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
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


export {$d5cc3b32ccfc476f$export$907bcc6c48325fd6 as useTableState, $d5cc3b32ccfc476f$export$31447e17397b15c2 as UNSTABLE_useFilteredTableState};
//# sourceMappingURL=useTableState.js.map
