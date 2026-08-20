import {getRowLabelledBy as $5519a0a73876c3da$export$85069b70317f543} from "./utils.js";
import $dC184$intlStringsjs from "./intlStrings.js";
import {useGridSelectionCheckbox as $ba59c92b3d4c78e7$export$70e2eed1a92976ad} from "../grid/useGridSelectionCheckbox.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";


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



function $35c53aa4935a5c1d$export$16ea7f650bd7c1bb(props, state) {
    let { key: key } = props;
    const { checkboxProps: checkboxProps } = (0, $ba59c92b3d4c78e7$export$70e2eed1a92976ad)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            'aria-labelledby': `${checkboxProps.id} ${(0, $5519a0a73876c3da$export$85069b70317f543)(state, key)}`
        }
    };
}
function $35c53aa4935a5c1d$export$1003db6a7e384b99(state) {
    let { isEmpty: isEmpty, isSelectAll: isSelectAll, selectionMode: selectionMode } = state.selectionManager;
    const stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($dC184$intlStringsjs))), '@react-aria/table');
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


export {$35c53aa4935a5c1d$export$16ea7f650bd7c1bb as useTableSelectionCheckbox, $35c53aa4935a5c1d$export$1003db6a7e384b99 as useTableSelectAllCheckbox};
//# sourceMappingURL=useTableSelectionCheckbox.js.map
