var $589a6443185dab0f$exports = require("./utils.cjs");
var $526eef38cac7f2b8$exports = require("./intlStrings.cjs");
var $6f0f3cb792714c98$exports = require("../grid/useGridSelectionCheckbox.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableSelectionCheckbox", function () { return $c1b6103f13d7e998$export$16ea7f650bd7c1bb; });
$parcel$export(module.exports, "useTableSelectAllCheckbox", function () { return $c1b6103f13d7e998$export$1003db6a7e384b99; });
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



function $c1b6103f13d7e998$export$16ea7f650bd7c1bb(props, state) {
    let { key: key } = props;
    const { checkboxProps: checkboxProps } = (0, $6f0f3cb792714c98$exports.useGridSelectionCheckbox)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            'aria-labelledby': `${checkboxProps.id} ${(0, $589a6443185dab0f$exports.getRowLabelledBy)(state, key)}`
        }
    };
}
function $c1b6103f13d7e998$export$1003db6a7e384b99(state) {
    let { isEmpty: isEmpty, isSelectAll: isSelectAll, selectionMode: selectionMode } = state.selectionManager;
    const stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($526eef38cac7f2b8$exports))), '@react-aria/table');
    return {
        checkboxProps: {
            'aria-label': stringFormatter.format(selectionMode === 'single' ? 'select' : 'selectAll'),
            isSelected: isSelectAll,
            isDisabled: selectionMode !== 'multiple' || state.collection.size === 0 || state.collection.rows.length === 1 && state.collection.rows[0].type === 'loader',
            isIndeterminate: !isEmpty && !isSelectAll,
            onChange: ()=>state.selectionManager.toggleSelectAll()
        }
    };
}


//# sourceMappingURL=useTableSelectionCheckbox.cjs.map
