var $589a6443185dab0f$exports = require("./utils.cjs");
var $526eef38cac7f2b8$exports = require("./intlStrings.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $83fb058f79cd147c$exports = require("../grid/useGridCell.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $cCWDR$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableColumnHeader", function () { return $b4d2163e258b7829$export$9514819a8c81e960; });
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









function $b4d2163e258b7829$export$9514819a8c81e960(props, state, ref) {
    let { node: node } = props;
    let allowsSorting = node.props.allowsSorting;
    // if there are no focusable children, the column header will focus the cell
    let { gridCellProps: gridCellProps } = (0, $83fb058f79cd147c$exports.useGridCell)({
        ...props,
        focusMode: 'child'
    }, state, ref);
    let isSelectionCellDisabled = node.props.isSelectionCell && state.selectionManager.selectionMode === 'single';
    let { pressProps: pressProps, isPressed: isPressed } = (0, $1d003dcb6308cd89$exports.usePress)({
        isDisabled: !allowsSorting || isSelectionCellDisabled,
        onPress () {
            state.sort(node.key);
        },
        ref: ref
    });
    // Needed to pick up the focusable context, enabling things like Tooltips for example
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)({}, ref);
    let ariaSort = undefined;
    let isSortedColumn = state.sortDescriptor?.column === node.key;
    let sortDirection = state.sortDescriptor?.direction;
    // aria-sort not supported in Android Talkback
    if (node.props.allowsSorting && !(0, $d0b4a781cf26e80b$exports.isAndroid)()) ariaSort = isSortedColumn ? sortDirection : 'none';
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($526eef38cac7f2b8$exports))), '@react-aria/table');
    let sortDescription;
    if (allowsSorting) {
        sortDescription = `${stringFormatter.format('sortable')}`;
        // Android Talkback doesn't support aria-sort so we add sort order details to the aria-described by here
        if (isSortedColumn && sortDirection && (0, $d0b4a781cf26e80b$exports.isAndroid)()) sortDescription = `${sortDescription}, ${stringFormatter.format(sortDirection)}`;
    }
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(sortDescription);
    let shouldDisableFocus = state.collection.size === 0;
    (0, $cCWDR$react.useEffect)(()=>{
        if (shouldDisableFocus && state.selectionManager.focusedKey === node.key) state.selectionManager.setFocusedKey(null);
    }, [
        shouldDisableFocus,
        state.selectionManager,
        node.key
    ]);
    return {
        columnHeaderProps: {
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, gridCellProps, pressProps, descriptionProps, // If the table is empty, make all column headers untabbable
            shouldDisableFocus ? {
                tabIndex: -1
            } : null),
            role: 'columnheader',
            id: (0, $589a6443185dab0f$exports.getColumnHeaderId)(state, node.key),
            'aria-colspan': node.colSpan && node.colSpan > 1 ? node.colSpan : undefined,
            'aria-sort': ariaSort
        },
        isPressed: isPressed
    };
}


//# sourceMappingURL=useTableColumnHeader.cjs.map
