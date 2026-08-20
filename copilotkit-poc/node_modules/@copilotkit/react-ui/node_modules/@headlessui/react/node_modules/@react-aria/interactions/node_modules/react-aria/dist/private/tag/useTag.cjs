var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $8b7a8c87b9acc046$exports = require("./useTagGroup.cjs");
var $a3175550c11b26b5$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $d07dc266c3dc14c0$exports = require("../gridlist/useGridListItem.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTag", function () { return $e6145a72dc2af01a$export$3f568fff7dff2f03; });
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










function $e6145a72dc2af01a$export$3f568fff7dff2f03(props, state, ref) {
    let { item: item } = props;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($a3175550c11b26b5$exports))), '@react-aria/tag');
    let buttonId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let { onRemove: onRemove } = (0, $8b7a8c87b9acc046$exports.hookData).get(state) || {};
    let { rowProps: rowProps, gridCellProps: gridCellProps, ...states } = (0, $d07dc266c3dc14c0$exports.useGridListItem)({
        node: item
    }, state, ref);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { descriptionProps: _, ...stateWithoutDescription } = states;
    let isDisabled = state.disabledKeys.has(item.key) || item.props.isDisabled;
    let onKeyDown = (e)=>{
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (isDisabled) return;
            e.preventDefault();
            if (state.selectionManager.isSelected(item.key)) onRemove?.(new Set(state.selectionManager.selectedKeys));
            else onRemove?.(new Set([
                item.key
            ]));
        }
    };
    let modality = (0, $d0df89f3abe2c2ca$exports.useInteractionModality)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'pointer';
    let description = onRemove && (modality === 'keyboard' || modality === 'virtual') ? stringFormatter.format('removeDescription') : '';
    let descProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(description);
    let isItemFocused = item.key === state.selectionManager.focusedKey;
    let isFocused = state.selectionManager.focusedKey != null;
    let tabIndex = -1;
    if (!isDisabled && (isItemFocused || !isFocused)) tabIndex = 0;
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(item.props);
    let linkProps = (0, $75bd88aab025820b$exports.useSyntheticLinkProps)(item.props);
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)({
        ...item.props,
        isDisabled: isDisabled
    }, ref);
    return {
        removeButtonProps: {
            'aria-label': stringFormatter.format('removeButtonLabel'),
            'aria-labelledby': `${buttonId} ${rowProps.id}`,
            isDisabled: isDisabled,
            id: buttonId,
            onPress: ()=>onRemove ? onRemove(new Set([
                    item.key
                ])) : null
        },
        rowProps: (0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, rowProps, domProps, linkProps, {
            tabIndex: tabIndex,
            onKeyDown: onRemove ? onKeyDown : undefined,
            'aria-describedby': descProps['aria-describedby']
        }),
        gridCellProps: (0, $89b39774f3b79dbb$exports.mergeProps)(gridCellProps, {
            'aria-errormessage': props['aria-errormessage'],
            'aria-label': props['aria-label']
        }),
        ...stateWithoutDescription,
        allowsRemoving: !!onRemove
    };
}


//# sourceMappingURL=useTag.cjs.map
