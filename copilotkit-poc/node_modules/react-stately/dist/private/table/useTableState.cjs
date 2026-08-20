var $041063183149bf8f$exports = require("../grid/useGridState.cjs");
var $685d31b0941c7944$exports = require("./TableCollection.cjs");
var $346711202f17eab5$exports = require("../collections/useCollection.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $cxMns$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableState", function () { return $7e461d6cedc2cde6$export$907bcc6c48325fd6; });
$parcel$export(module.exports, "UNSTABLE_useFilteredTableState", function () { return $7e461d6cedc2cde6$export$31447e17397b15c2; });
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




const $7e461d6cedc2cde6$var$OPPOSITE_SORT_DIRECTION = {
    ascending: 'descending',
    descending: 'ascending'
};
function $7e461d6cedc2cde6$export$907bcc6c48325fd6(props) {
    let [isKeyboardNavigationDisabled, setKeyboardNavigationDisabled] = (0, $cxMns$react.useState)(false);
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, treeColumn: treeColumn = null } = props;
    let context = (0, $cxMns$react.useMemo)(()=>({
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
    let collection = (0, $346711202f17eab5$exports.useCollection)(props, (0, $cxMns$react.useCallback)((nodes)=>new (0, $685d31b0941c7944$exports.TableCollection)(nodes, null, context), [
        context
    ]), context);
    let { disabledKeys: disabledKeys, selectionManager: selectionManager } = (0, $041063183149bf8f$exports.useGridState)({
        ...props,
        collection: collection,
        disabledBehavior: props.disabledBehavior || 'selection'
    });
    let [expandedKeys, setExpandedKeys] = (0, $14cedf286405cc4b$exports.useControlledState)(props.expandedKeys ? new Set(props.expandedKeys) : undefined, props.defaultExpandedKeys ? new Set(props.defaultExpandedKeys) : new Set(), props.onExpandedChange);
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
                direction: direction ?? (props.sortDescriptor?.column === columnKey ? $7e461d6cedc2cde6$var$OPPOSITE_SORT_DIRECTION[props.sortDescriptor.direction] : 'ascending')
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
function $7e461d6cedc2cde6$export$31447e17397b15c2(state, filterFn) {
    let collection = (0, $cxMns$react.useMemo)(()=>filterFn ? state.collection.filter(filterFn) : state.collection, [
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


//# sourceMappingURL=useTableState.cjs.map
