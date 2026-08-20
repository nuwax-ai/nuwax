import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {gridMap as $90a81c508a5c0de1$export$e6235c0d09b995d0} from "./utils.mjs";
import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";

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


function $6b16276e8bbdaf8e$export$96357d5a73f686fa(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized, shouldSelectOnPressUp: shouldSelectOnPressUp, onAction: onAction } = props;
    let { actions: actions, shouldSelectOnPressUp: gridShouldSelectOnPressUp } = (0, $90a81c508a5c0de1$export$e6235c0d09b995d0).get(state);
    let onRowAction = actions.onRowAction ? ()=>actions.onRowAction?.(node.key) : onAction;
    let { itemProps: itemProps, ...states } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: gridShouldSelectOnPressUp || shouldSelectOnPressUp,
        onAction: onRowAction || node?.props?.onAction ? (0, $a4e76a5424781910$export$e08e3b67e392101e)(node?.props?.onAction, onRowAction) : undefined,
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


export {$6b16276e8bbdaf8e$export$96357d5a73f686fa as useGridRow};
//# sourceMappingURL=useGridRow.mjs.map
