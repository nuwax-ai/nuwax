import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {hookData as $59dfe17bbf61b558$export$653eddfc964b0f8a} from "./useTagGroup.js";
import $ecwFx$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useGridListItem as $7d08662b45460e3b$export$9610e69494fadfd2} from "../gridlist/useGridListItem.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useInteractionModality as $b50b1cc8a843ace7$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useSyntheticLinkProps as $044d3c97ce5d6621$export$bdc77b0c0a3a85d6} from "../utils/openLink.js";


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










function $b13ee33d16055494$export$3f568fff7dff2f03(props, state, ref) {
    let { item: item } = props;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($ecwFx$intlStringsjs))), '@react-aria/tag');
    let buttonId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let { onRemove: onRemove } = (0, $59dfe17bbf61b558$export$653eddfc964b0f8a).get(state) || {};
    let { rowProps: rowProps, gridCellProps: gridCellProps, ...states } = (0, $7d08662b45460e3b$export$9610e69494fadfd2)({
        node: item
    }, state, ref);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { descriptionProps: _, ...stateWithoutDescription } = states;
    let isDisabled = state.disabledKeys.has(item.key) || item.props.isDisabled;
    let onKeyDown = (e)=>{
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (isDisabled) return;
            e.preventDefault();
            if (state.selectionManager.isSelected(item.key)) onRemove === null || onRemove === void 0 ? void 0 : onRemove(new Set(state.selectionManager.selectedKeys));
            else onRemove === null || onRemove === void 0 ? void 0 : onRemove(new Set([
                item.key
            ]));
        }
    };
    let modality = (0, $b50b1cc8a843ace7$export$98e20ec92f614cfe)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'pointer';
    let description = onRemove && (modality === 'keyboard' || modality === 'virtual') ? stringFormatter.format('removeDescription') : '';
    let descProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    let isItemFocused = item.key === state.selectionManager.focusedKey;
    let isFocused = state.selectionManager.focusedKey != null;
    let tabIndex = -1;
    if (!isDisabled && (isItemFocused || !isFocused)) tabIndex = 0;
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(item.props);
    let linkProps = (0, $044d3c97ce5d6621$export$bdc77b0c0a3a85d6)(item.props);
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)({
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
        rowProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, rowProps, domProps, linkProps, {
            tabIndex: tabIndex,
            onKeyDown: onRemove ? onKeyDown : undefined,
            'aria-describedby': descProps['aria-describedby']
        }),
        gridCellProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(gridCellProps, {
            'aria-errormessage': props['aria-errormessage'],
            'aria-label': props['aria-label']
        }),
        ...stateWithoutDescription,
        allowsRemoving: !!onRemove
    };
}


export {$b13ee33d16055494$export$3f568fff7dff2f03 as useTag};
//# sourceMappingURL=useTag.js.map
