var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $d558273e57410528$exports = require("./utils.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridRow", function () { return $2e39d55f4397f5df$export$96357d5a73f686fa; });
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


function $2e39d55f4397f5df$export$96357d5a73f686fa(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized, shouldSelectOnPressUp: shouldSelectOnPressUp, onAction: onAction } = props;
    let { actions: actions, shouldSelectOnPressUp: gridShouldSelectOnPressUp } = (0, $d558273e57410528$exports.gridMap).get(state);
    let onRowAction = actions.onRowAction ? ()=>actions.onRowAction?.(node.key) : onAction;
    let { itemProps: itemProps, ...states } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: gridShouldSelectOnPressUp || shouldSelectOnPressUp,
        onAction: onRowAction || node?.props?.onAction ? (0, $2f95486cfdaa743c$exports.chain)(node?.props?.onAction, onRowAction) : undefined,
        isDisabled: state.collection.size === 0
    });
    let isSelected = state.selectionManager.isSelected(node.key);
    let rowProps = {
        role: 'row',
        'aria-selected': state.selectionManager.selectionMode !== 'none' ? isSelected : undefined,
        'aria-disabled': states.isDisabled || undefined,
        ...itemProps
    };
    if (isVirtualized) rowProps['aria-rowindex'] = node.index + 1; // aria-rowindex is 1 based
    return {
        rowProps: rowProps,
        ...states
    };
}


//# sourceMappingURL=useGridRow.cjs.map
