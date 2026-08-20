import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import {useGrid as $e9c0503d101e30f9$export$f6b86a04e5d66d90} from "../grid/useGrid.mjs";
import {gridIds as $cf56c58f505db99a$export$552312adfd451dab} from "./utils.mjs";
import $djswP$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {TableKeyboardDelegate as $0048eb146240e3fa$export$da43f8f5cb04028d} from "./TableKeyboardDelegate.mjs";
import {useCollator as $673d46fce3e5717d$export$a16aca283550c30d} from "../i18n/useCollator.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useUpdateEffect as $3c71b1595a147f24$export$496315a1608d9602} from "../utils/useUpdateEffect.mjs";
import {useMemo as $djswP$useMemo} from "react";


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












function $fb95af427cd4e876$export$25bceaac3c7e4dc7(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isVirtualized: isVirtualized, layoutDelegate: layoutDelegate, layout: layout } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $673d46fce3e5717d$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $djswP$useMemo)(()=>keyboardDelegate || new (0, $0048eb146240e3fa$export$da43f8f5cb04028d)({
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
    let id = (0, $390e54f620492c70$export$f680877a34711e37)(props.id);
    (0, $cf56c58f505db99a$export$552312adfd451dab).set(state, id);
    let { gridProps: gridProps } = (0, $e9c0503d101e30f9$export$f6b86a04e5d66d90)({
        ...props,
        id: id,
        keyboardDelegate: delegate
    }, state, ref);
    // Override to include header rows
    if (isVirtualized) gridProps['aria-rowcount'] = state.collection.size + state.collection.headerRows.length;
    if (state.treeColumn != null) gridProps.role = 'treegrid';
    let { column: column, direction: sortDirection } = state.sortDescriptor || {};
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($djswP$intlStringsmjs))), '@react-aria/table');
    let sortDescription = (0, $djswP$useMemo)(()=>{
        let columnName = state.collection.columns.find((c)=>c.key === column)?.textValue ?? '';
        return sortDirection && column ? stringFormatter.format(`${sortDirection}Sort`, {
            columnName: columnName
        }) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sortDirection,
        column,
        state.collection.columns
    ]);
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(sortDescription);
    // Only announce after initial render, tabbing to the table will tell you the initial sort info already
    (0, $3c71b1595a147f24$export$496315a1608d9602)(()=>{
        if (sortDescription) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(sortDescription, 'assertive', 500);
    }, [
        sortDescription
    ]);
    return {
        gridProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(gridProps, descriptionProps, {
            // merge sort description with long press information
            'aria-describedby': [
                descriptionProps['aria-describedby'],
                gridProps['aria-describedby']
            ].filter(Boolean).join(' ')
        })
    };
}


export {$fb95af427cd4e876$export$25bceaac3c7e4dc7 as useTable};
//# sourceMappingURL=useTable.mjs.map
