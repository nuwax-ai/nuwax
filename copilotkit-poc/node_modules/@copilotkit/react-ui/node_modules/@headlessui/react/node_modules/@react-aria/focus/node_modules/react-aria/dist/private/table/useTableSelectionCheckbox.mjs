import {getRowLabelledBy as $cf56c58f505db99a$export$85069b70317f543} from "./utils.mjs";
import $f3C2Q$intlStringsmjs from "./intlStrings.mjs";
import {useGridSelectionCheckbox as $575d7acf5e0b35f6$export$70e2eed1a92976ad} from "../grid/useGridSelectionCheckbox.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


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



function $9f1626ae989538fb$export$16ea7f650bd7c1bb(props, state) {
    let { key: key } = props;
    const { checkboxProps: checkboxProps } = (0, $575d7acf5e0b35f6$export$70e2eed1a92976ad)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            'aria-labelledby': `${checkboxProps.id} ${(0, $cf56c58f505db99a$export$85069b70317f543)(state, key)}`
        }
    };
}
function $9f1626ae989538fb$export$1003db6a7e384b99(state) {
    let { isEmpty: isEmpty, isSelectAll: isSelectAll, selectionMode: selectionMode } = state.selectionManager;
    const stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($f3C2Q$intlStringsmjs))), '@react-aria/table');
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


export {$9f1626ae989538fb$export$16ea7f650bd7c1bb as useTableSelectionCheckbox, $9f1626ae989538fb$export$1003db6a7e384b99 as useTableSelectAllCheckbox};
//# sourceMappingURL=useTableSelectionCheckbox.mjs.map
