import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import {useGrid as $4b54785d6bd5a561$export$f6b86a04e5d66d90} from "../grid/useGrid.js";
import {gridIds as $5519a0a73876c3da$export$552312adfd451dab} from "./utils.js";
import $ao8JR$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {TableKeyboardDelegate as $a2b612fa9883d53c$export$da43f8f5cb04028d} from "./TableKeyboardDelegate.js";
import {useCollator as $14a307baf19f0c4b$export$a16aca283550c30d} from "../i18n/useCollator.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useUpdateEffect as $b444858e8a82ccea$export$496315a1608d9602} from "../utils/useUpdateEffect.js";
import {useMemo as $ao8JR$useMemo} from "react";


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












function $281590cdb2660db0$export$25bceaac3c7e4dc7(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isVirtualized: isVirtualized, layoutDelegate: layoutDelegate, layout: layout } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $14a307baf19f0c4b$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $ao8JR$useMemo)(()=>keyboardDelegate || new (0, $a2b612fa9883d53c$export$da43f8f5cb04028d)({
            collection: state.collection,
            disabledKeys: state.disabledKeys,
            disabledBehavior: disabledBehavior,
            ref: ref,
            direction: direction,
            collator: collator,
            layoutDelegate: layoutDelegate,
            layout: layout
        }), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        disabledBehavior,
        ref,
        direction,
        collator,
        layoutDelegate,
        layout
    ]);
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)(props.id);
    (0, $5519a0a73876c3da$export$552312adfd451dab).set(state, id);
    let { gridProps: gridProps } = (0, $4b54785d6bd5a561$export$f6b86a04e5d66d90)({
        ...props,
        id: id,
        keyboardDelegate: delegate
    }, state, ref);
    // Override to include header rows
    if (isVirtualized) gridProps['aria-rowcount'] = state.collection.size + state.collection.headerRows.length;
    if (state.treeColumn != null) gridProps.role = 'treegrid';
    let { column: column, direction: sortDirection } = state.sortDescriptor || {};
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($ao8JR$intlStringsjs))), '@react-aria/table');
    let sortDescription = (0, $ao8JR$useMemo)(()=>{
        var _state_collection_columns_find;
        var _state_collection_columns_find_textValue;
        let columnName = (_state_collection_columns_find_textValue = (_state_collection_columns_find = state.collection.columns.find((c)=>c.key === column)) === null || _state_collection_columns_find === void 0 ? void 0 : _state_collection_columns_find.textValue) !== null && _state_collection_columns_find_textValue !== void 0 ? _state_collection_columns_find_textValue : '';
        return sortDirection && column ? stringFormatter.format(`${sortDirection}Sort`, {
            columnName: columnName
        }) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sortDirection,
        column,
        state.collection.columns
    ]);
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(sortDescription);
    // Only announce after initial render, tabbing to the table will tell you the initial sort info already
    (0, $b444858e8a82ccea$export$496315a1608d9602)(()=>{
        if (sortDescription) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(sortDescription, 'assertive', 500);
    }, [
        sortDescription
    ]);
    return {
        gridProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(gridProps, descriptionProps, {
            // merge sort description with long press information
            'aria-describedby': [
                descriptionProps['aria-describedby'],
                gridProps['aria-describedby']
            ].filter(Boolean).join(' ')
        })
    };
}


export {$281590cdb2660db0$export$25bceaac3c7e4dc7 as useTable};
//# sourceMappingURL=useTable.js.map
