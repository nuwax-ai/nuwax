import {getColumnHeaderId as $5519a0a73876c3da$export$37cd4213f2ad742e} from "./utils.js";
import $9tO5T$intlStringsjs from "./intlStrings.js";
import {isAndroid as $d5a2be505488529f$export$a11b0059900ceec8} from "../utils/platform.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useGridCell as $9b19f290bcf2fee1$export$c7e10bfc0c59f67c} from "../grid/useGridCell.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useEffect as $9tO5T$useEffect} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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









function $a7064ebacf1aff0b$export$9514819a8c81e960(props, state, ref) {
    var _state_sortDescriptor, _state_sortDescriptor1;
    let { node: node } = props;
    let allowsSorting = node.props.allowsSorting;
    // if there are no focusable children, the column header will focus the cell
    let { gridCellProps: gridCellProps } = (0, $9b19f290bcf2fee1$export$c7e10bfc0c59f67c)({
        ...props,
        focusMode: 'child'
    }, state, ref);
    let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === 'single';
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        isDisabled: !allowsSorting || isSelectionCellDisabled,
        onPress () {
            state.sort(node.key);
        },
        ref: ref
    });
    // Needed to pick up the focusable context, enabling things like Tooltips for example
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)({}, ref);
    let ariaSort = undefined;
    let isSortedColumn = ((_state_sortDescriptor = state.sortDescriptor) === null || _state_sortDescriptor === void 0 ? void 0 : _state_sortDescriptor.column) === node.key;
    let sortDirection = (_state_sortDescriptor1 = state.sortDescriptor) === null || _state_sortDescriptor1 === void 0 ? void 0 : _state_sortDescriptor1.direction;
    // aria-sort not supported in Android Talkback
    if (node.props.allowsSorting && !(0, $d5a2be505488529f$export$a11b0059900ceec8)()) ariaSort = isSortedColumn ? sortDirection : 'none';
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($9tO5T$intlStringsjs))), '@react-aria/table');
    let sortDescription;
    if (allowsSorting) {
        sortDescription = `${stringFormatter.format('sortable')}`;
        // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
        if (isSortedColumn && sortDirection && (0, $d5a2be505488529f$export$a11b0059900ceec8)()) sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(sortDescription);
    let shouldDisableFocus = state.collection.size === 0;
    (0, $9tO5T$useEffect)(()=>{
        if (shouldDisableFocus && state.selectionManager.focusedKey === node.key) state.selectionManager.setFocusedKey(null);
    }, [
        shouldDisableFocus,
        state.selectionManager,
        node.key
    ]);
    return {
        columnHeaderProps: {
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, gridCellProps, pressProps, descriptionProps, // If the table is empty, make all column headers untabbable
            shouldDisableFocus ? {
                tabIndex: -1
            } : null),
            role: 'columnheader',
            id: (0, $5519a0a73876c3da$export$37cd4213f2ad742e)(state, node.key),
            'aria-colspan': node.colSpan && node.colSpan > 1 ? node.colSpan : undefined,
            'aria-sort': ariaSort
        },
        isPressed: isPressed
    };
}


export {$a7064ebacf1aff0b$export$9514819a8c81e960 as useTableColumnHeader};
//# sourceMappingURL=useTableColumnHeader.js.map
