var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $ef6ed03a6401f944$exports = require("../grid/useGrid.cjs");
var $589a6443185dab0f$exports = require("./utils.cjs");
var $526eef38cac7f2b8$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $48a48f66ad648db1$exports = require("./TableKeyboardDelegate.cjs");
var $74751389dd0da9fc$exports = require("../i18n/useCollator.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $c4703f4a6fffa1e7$exports = require("../utils/useUpdateEffect.cjs");
var $lEFs5$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTable", function () { return $1a0d47f756563b0c$export$25bceaac3c7e4dc7; });
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












function $1a0d47f756563b0c$export$25bceaac3c7e4dc7(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isVirtualized: isVirtualized, layoutDelegate: layoutDelegate, layout: layout } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $74751389dd0da9fc$exports.useCollator)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $lEFs5$react.useMemo)(()=>keyboardDelegate || new (0, $48a48f66ad648db1$exports.TableKeyboardDelegate)({
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
    let id = (0, $7ac82d1fee77eb8a$exports.useId)(props.id);
    (0, $589a6443185dab0f$exports.gridIds).set(state, id);
    let { gridProps: gridProps } = (0, $ef6ed03a6401f944$exports.useGrid)({
        ...props,
        id: id,
        keyboardDelegate: delegate
    }, state, ref);
    // Override to include header rows
    if (isVirtualized) gridProps['aria-rowcount'] = state.collection.size + state.collection.headerRows.length;
    if (state.treeColumn != null) gridProps.role = 'treegrid';
    let { column: column, direction: sortDirection } = state.sortDescriptor || {};
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($526eef38cac7f2b8$exports))), '@react-aria/table');
    let sortDescription = (0, $lEFs5$react.useMemo)(()=>{
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
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(sortDescription);
    // Only announce after initial render, tabbing to the table will tell you the initial sort info already
    (0, $c4703f4a6fffa1e7$exports.useUpdateEffect)(()=>{
        if (sortDescription) (0, $74b2c5b1e7ea9589$exports.announce)(sortDescription, 'assertive', 500);
    }, [
        sortDescription
    ]);
    return {
        gridProps: (0, $89b39774f3b79dbb$exports.mergeProps)(gridProps, descriptionProps, {
            // merge sort description with long press information
            'aria-describedby': [
                descriptionProps['aria-describedby'],
                gridProps['aria-describedby']
            ].filter(Boolean).join(' ')
        })
    };
}


//# sourceMappingURL=useTable.cjs.map
