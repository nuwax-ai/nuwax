import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getItemId as $519a33be2aaefa45$export$9145995848b05025, listData as $519a33be2aaefa45$export$3585ede4d035bf14} from "./utils.js";
import {isFocusVisible as $b50b1cc8a843ace7$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useSelectableItem as $0d8cf6a15fe85601$export$ecf600387e221c37} from "../selection/useSelectableItem.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";
import {useLinkProps as $044d3c97ce5d6621$export$7e924b3091a3bd18} from "../utils/openLink.js";
import {useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";
import {getItemCount as $k7fwe$getItemCount} from "react-stately/private/collections/getItemCount";

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









function $314ae10407f59650$export$497855f14858aa34(props, state, ref) {
    var _item_props, _item_props1;
    let { key: key } = props;
    let data = (0, $519a33be2aaefa45$export$3585ede4d035bf14).get(state);
    var _props_isDisabled;
    let isDisabled = (_props_isDisabled = props.isDisabled) !== null && _props_isDisabled !== void 0 ? _props_isDisabled : state.selectionManager.isDisabled(key);
    var _props_isSelected;
    let isSelected = (_props_isSelected = props.isSelected) !== null && _props_isSelected !== void 0 ? _props_isSelected : state.selectionManager.isSelected(key);
    var _props_shouldSelectOnPressUp;
    let shouldSelectOnPressUp = (_props_shouldSelectOnPressUp = props.shouldSelectOnPressUp) !== null && _props_shouldSelectOnPressUp !== void 0 ? _props_shouldSelectOnPressUp : data === null || data === void 0 ? void 0 : data.shouldSelectOnPressUp;
    var _props_shouldFocusOnHover;
    let shouldFocusOnHover = (_props_shouldFocusOnHover = props.shouldFocusOnHover) !== null && _props_shouldFocusOnHover !== void 0 ? _props_shouldFocusOnHover : data === null || data === void 0 ? void 0 : data.shouldFocusOnHover;
    var _props_shouldUseVirtualFocus;
    let shouldUseVirtualFocus = (_props_shouldUseVirtualFocus = props.shouldUseVirtualFocus) !== null && _props_shouldUseVirtualFocus !== void 0 ? _props_shouldUseVirtualFocus : data === null || data === void 0 ? void 0 : data.shouldUseVirtualFocus;
    var _props_isVirtualized;
    let isVirtualized = (_props_isVirtualized = props.isVirtualized) !== null && _props_isVirtualized !== void 0 ? _props_isVirtualized : data === null || data === void 0 ? void 0 : data.isVirtualized;
    let labelId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let descriptionId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let optionProps = {
        role: 'option',
        'aria-disabled': isDisabled || undefined,
        'aria-selected': state.selectionManager.selectionMode !== 'none' ? isSelected : undefined,
        'aria-label': props['aria-label'],
        'aria-labelledby': labelId,
        'aria-describedby': descriptionId
    };
    let item = state.collection.getItem(key);
    if (isVirtualized) {
        let index = Number(item === null || item === void 0 ? void 0 : item.index);
        optionProps['aria-posinset'] = Number.isNaN(index) ? undefined : index + 1;
        optionProps['aria-setsize'] = (0, $k7fwe$getItemCount)(state.collection);
    }
    let onAction = (data === null || data === void 0 ? void 0 : data.onAction) ? ()=>{
        var _data_onAction;
        return data === null || data === void 0 ? void 0 : (_data_onAction = data.onAction) === null || _data_onAction === void 0 ? void 0 : _data_onAction.call(data, key);
    } : undefined;
    let id = (0, $519a33be2aaefa45$export$9145995848b05025)(state, key);
    let { itemProps: itemProps, isPressed: isPressed, isFocused: isFocused, hasAction: hasAction, allowsSelection: allowsSelection } = (0, $0d8cf6a15fe85601$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: key,
        ref: ref,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        allowsDifferentPressOrigin: shouldSelectOnPressUp && shouldFocusOnHover,
        isVirtualized: isVirtualized,
        shouldUseVirtualFocus: shouldUseVirtualFocus,
        isDisabled: isDisabled,
        onAction: onAction || (item === null || item === void 0 ? void 0 : (_item_props = item.props) === null || _item_props === void 0 ? void 0 : _item_props.onAction) ? (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(item === null || item === void 0 ? void 0 : (_item_props1 = item.props) === null || _item_props1 === void 0 ? void 0 : _item_props1.onAction, onAction) : undefined,
        linkBehavior: data === null || data === void 0 ? void 0 : data.linkBehavior,
        // @ts-ignore
        UNSTABLE_itemBehavior: data === null || data === void 0 ? void 0 : data['UNSTABLE_itemBehavior'],
        id: id
    });
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
        isDisabled: isDisabled || !shouldFocusOnHover,
        onHoverStart () {
            if (!(0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)()) {
                state.selectionManager.setFocused(true);
                state.selectionManager.setFocusedKey(key);
            }
        }
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(item === null || item === void 0 ? void 0 : item.props);
    delete domProps.id;
    let linkProps = (0, $044d3c97ce5d6621$export$7e924b3091a3bd18)(item === null || item === void 0 ? void 0 : item.props);
    return {
        optionProps: {
            ...optionProps,
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, itemProps, hoverProps, linkProps),
            id: id
        },
        labelProps: {
            id: labelId
        },
        descriptionProps: {
            id: descriptionId
        },
        isFocused: isFocused,
        isFocusVisible: isFocused && state.selectionManager.isFocused && (0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)(),
        isSelected: isSelected,
        isDisabled: isDisabled,
        isPressed: isPressed,
        allowsSelection: allowsSelection,
        hasAction: hasAction
    };
}


export {$314ae10407f59650$export$497855f14858aa34 as useOption};
//# sourceMappingURL=useOption.js.map
