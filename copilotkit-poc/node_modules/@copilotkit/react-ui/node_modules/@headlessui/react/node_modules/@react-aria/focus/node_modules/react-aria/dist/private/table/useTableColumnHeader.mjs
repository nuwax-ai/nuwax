import {getColumnHeaderId as $cf56c58f505db99a$export$37cd4213f2ad742e} from "./utils.mjs";
import $cBFAV$intlStringsmjs from "./intlStrings.mjs";
import {isAndroid as $2add3ce32c6007eb$export$a11b0059900ceec8} from "../utils/platform.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useGridCell as $a4d729ad50b8576a$export$c7e10bfc0c59f67c} from "../grid/useGridCell.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";
import {useEffect as $cBFAV$useEffect} from "react";


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









function $7354db473d14c864$export$9514819a8c81e960(props, state, ref) {
    let { node: node } = props;
    let allowsSorting = node.props.allowsSorting;
    // if there are no focusable children, the column header will focus the cell
    let { gridCellProps: gridCellProps } = (0, $a4d729ad50b8576a$export$c7e10bfc0c59f67c)({
        ...props,
        focusMode: 'child'
    }, state, ref);
    let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === 'single';
    let { pressProps: pressProps, isPressed: isPressed } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
        isDisabled: !allowsSorting || isSelectionCellDisabled,
        onPress () {
            state.sort(node.key);
        },
        ref: ref
    });
    // Needed to pick up the focusable context, enabling things like Tooltips for example
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)({}, ref);
    let ariaSort = undefined;
    let isSortedColumn = state.sortDescriptor?.column === node.key;
    let sortDirection = state.sortDescriptor?.direction;
    // aria-sort not supported in Android Talkback
    if (node.props.allowsSorting && !(0, $2add3ce32c6007eb$export$a11b0059900ceec8)()) ariaSort = isSortedColumn ? sortDirection : 'none';
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($cBFAV$intlStringsmjs))), '@react-aria/table');
    let sortDescription;
    if (allowsSorting) {
        sortDescription = `${stringFormatter.format('sortable')}`;
        // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
        if (isSortedColumn && sortDirection && (0, $2add3ce32c6007eb$export$a11b0059900ceec8)()) sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(sortDescription);
    let shouldDisableFocus = state.collection.size === 0;
    (0, $cBFAV$useEffect)(()=>{
        if (shouldDisableFocus && state.selectionManager.focusedKey === node.key) state.selectionManager.setFocusedKey(null);
    }, [
        shouldDisableFocus,
        state.selectionManager,
        node.key
    ]);
    return {
        columnHeaderProps: {
            ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, gridCellProps, pressProps, descriptionProps, // If the table is empty, make all column headers untabbable
            shouldDisableFocus ? {
                tabIndex: -1
            } : null),
            role: 'columnheader',
            id: (0, $cf56c58f505db99a$export$37cd4213f2ad742e)(state, node.key),
            'aria-colspan': node.colSpan && node.colSpan > 1 ? node.colSpan : undefined,
            'aria-sort': ariaSort
        },
        isPressed: isPressed
    };
}


export {$7354db473d14c864$export$9514819a8c81e960 as useTableColumnHeader};
//# sourceMappingURL=useTableColumnHeader.mjs.map
