import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {getItemId as $cd088b5c0d7b27b4$export$9145995848b05025, listData as $cd088b5c0d7b27b4$export$3585ede4d035bf14} from "./utils.mjs";
import {isFocusVisible as $8f5a2122b0992be3$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";
import {useHover as $e969f22b6713ca4a$export$ae780daf29e6d456} from "../interactions/useHover.mjs";
import {useLinkProps as $caaf0dd3060ed57c$export$7e924b3091a3bd18} from "../utils/openLink.mjs";
import {useSlotId as $390e54f620492c70$export$b4cc09c592e8fdb8} from "../utils/useId.mjs";
import {getItemCount as $i8Bql$getItemCount} from "react-stately/private/collections/getItemCount";

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









function $dae966e193913d1b$export$497855f14858aa34(props, state, ref) {
    let { key: key } = props;
    let data = (0, $cd088b5c0d7b27b4$export$3585ede4d035bf14).get(state);
    let isDisabled = props.isDisabled ?? state.selectionManager.isDisabled(key);
    let isSelected = props.isSelected ?? state.selectionManager.isSelected(key);
    let shouldSelectOnPressUp = props.shouldSelectOnPressUp ?? data?.shouldSelectOnPressUp;
    let shouldFocusOnHover = props.shouldFocusOnHover ?? data?.shouldFocusOnHover;
    let shouldUseVirtualFocus = props.shouldUseVirtualFocus ?? data?.shouldUseVirtualFocus;
    let isVirtualized = props.isVirtualized ?? data?.isVirtualized;
    let labelId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)();
    let descriptionId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)();
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
        let index = Number(item?.index);
        optionProps['aria-posinset'] = Number.isNaN(index) ? undefined : index + 1;
        optionProps['aria-setsize'] = (0, $i8Bql$getItemCount)(state.collection);
    }
    let onAction = data?.onAction ? ()=>data?.onAction?.(key) : undefined;
    let id = (0, $cd088b5c0d7b27b4$export$9145995848b05025)(state, key);
    let { itemProps: itemProps, isPressed: isPressed, isFocused: isFocused, hasAction: hasAction, allowsSelection: allowsSelection } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: key,
        ref: ref,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        allowsDifferentPressOrigin: shouldSelectOnPressUp && shouldFocusOnHover,
        isVirtualized: isVirtualized,
        shouldUseVirtualFocus: shouldUseVirtualFocus,
        isDisabled: isDisabled,
        onAction: onAction || item?.props?.onAction ? (0, $a4e76a5424781910$export$e08e3b67e392101e)(item?.props?.onAction, onAction) : undefined,
        linkBehavior: data?.linkBehavior,
        // @ts-ignore
        UNSTABLE_itemBehavior: data?.['UNSTABLE_itemBehavior'],
        id: id
    });
    let { hoverProps: hoverProps } = (0, $e969f22b6713ca4a$export$ae780daf29e6d456)({
        isDisabled: isDisabled || !shouldFocusOnHover,
        onHoverStart () {
            if (!(0, $8f5a2122b0992be3$export$b9b3dfddab17db27)()) {
                state.selectionManager.setFocused(true);
                state.selectionManager.setFocusedKey(key);
            }
        }
    });
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(item?.props);
    delete domProps.id;
    let linkProps = (0, $caaf0dd3060ed57c$export$7e924b3091a3bd18)(item?.props);
    return {
        optionProps: {
            ...optionProps,
            ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, itemProps, hoverProps, linkProps),
            id: id
        },
        labelProps: {
            id: labelId
        },
        descriptionProps: {
            id: descriptionId
        },
        isFocused: isFocused,
        isFocusVisible: isFocused && state.selectionManager.isFocused && (0, $8f5a2122b0992be3$export$b9b3dfddab17db27)(),
        isSelected: isSelected,
        isDisabled: isDisabled,
        isPressed: isPressed,
        allowsSelection: allowsSelection,
        hasAction: hasAction
    };
}


export {$dae966e193913d1b$export$497855f14858aa34 as useOption};
//# sourceMappingURL=useOption.mjs.map
