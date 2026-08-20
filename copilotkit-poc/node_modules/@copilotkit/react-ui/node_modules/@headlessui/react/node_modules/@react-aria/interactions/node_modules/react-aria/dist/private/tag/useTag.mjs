import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {hookData as $223860f9cb8a07a2$export$653eddfc964b0f8a} from "./useTagGroup.mjs";
import $Egwke$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useGridListItem as $be7bed9611dd7497$export$9610e69494fadfd2} from "../gridlist/useGridListItem.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useInteractionModality as $8f5a2122b0992be3$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useSyntheticLinkProps as $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6} from "../utils/openLink.mjs";


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










function $8b763916586fd6a6$export$3f568fff7dff2f03(props, state, ref) {
    let { item: item } = props;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($Egwke$intlStringsmjs))), '@react-aria/tag');
    let buttonId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let { onRemove: onRemove } = (0, $223860f9cb8a07a2$export$653eddfc964b0f8a).get(state) || {};
    let { rowProps: rowProps, gridCellProps: gridCellProps, ...states } = (0, $be7bed9611dd7497$export$9610e69494fadfd2)({
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
    let modality = (0, $8f5a2122b0992be3$export$98e20ec92f614cfe)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'pointer';
    let description = onRemove && (modality === 'keyboard' || modality === 'virtual') ? stringFormatter.format('removeDescription') : '';
    let descProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(description);
    let isItemFocused = item.key === state.selectionManager.focusedKey;
    let isFocused = state.selectionManager.focusedKey != null;
    let tabIndex = -1;
    if (!isDisabled && (isItemFocused || !isFocused)) tabIndex = 0;
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(item.props);
    let linkProps = (0, $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6)(item.props);
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)({
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
        rowProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, rowProps, domProps, linkProps, {
            tabIndex: tabIndex,
            onKeyDown: onRemove ? onKeyDown : undefined,
            'aria-describedby': descProps['aria-describedby']
        }),
        gridCellProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(gridCellProps, {
            'aria-errormessage': props['aria-errormessage'],
            'aria-label': props['aria-label']
        }),
        ...stateWithoutDescription,
        allowsRemoving: !!onRemove
    };
}


export {$8b763916586fd6a6$export$3f568fff7dff2f03 as useTag};
//# sourceMappingURL=useTag.mjs.map
