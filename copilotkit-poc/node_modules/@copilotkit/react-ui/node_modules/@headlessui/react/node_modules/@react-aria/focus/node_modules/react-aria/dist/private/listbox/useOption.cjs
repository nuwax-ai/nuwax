var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $63bd36c8d873711d$exports = require("./utils.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $lpSW1$reactstatelyprivatecollectionsgetItemCount = require("react-stately/private/collections/getItemCount");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useOption", function () { return $b13e27d4a2a0223b$export$497855f14858aa34; });
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









function $b13e27d4a2a0223b$export$497855f14858aa34(props, state, ref) {
    let { key: key } = props;
    let data = (0, $63bd36c8d873711d$exports.listData).get(state);
    let isDisabled = props.isDisabled ?? state.selectionManager.isDisabled(key);
    let isSelected = props.isSelected ?? state.selectionManager.isSelected(key);
    let shouldSelectOnPressUp = props.shouldSelectOnPressUp ?? data?.shouldSelectOnPressUp;
    let shouldFocusOnHover = props.shouldFocusOnHover ?? data?.shouldFocusOnHover;
    let shouldUseVirtualFocus = props.shouldUseVirtualFocus ?? data?.shouldUseVirtualFocus;
    let isVirtualized = props.isVirtualized ?? data?.isVirtualized;
    let labelId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    let descriptionId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
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
        optionProps['aria-setsize'] = (0, $lpSW1$reactstatelyprivatecollectionsgetItemCount.getItemCount)(state.collection);
    }
    let onAction = data?.onAction ? ()=>data?.onAction?.(key) : undefined;
    let id = (0, $63bd36c8d873711d$exports.getItemId)(state, key);
    let { itemProps: itemProps, isPressed: isPressed, isFocused: isFocused, hasAction: hasAction, allowsSelection: allowsSelection } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: key,
        ref: ref,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        allowsDifferentPressOrigin: shouldSelectOnPressUp && shouldFocusOnHover,
        isVirtualized: isVirtualized,
        shouldUseVirtualFocus: shouldUseVirtualFocus,
        isDisabled: isDisabled,
        onAction: onAction || item?.props?.onAction ? (0, $2f95486cfdaa743c$exports.chain)(item?.props?.onAction, onAction) : undefined,
        linkBehavior: data?.linkBehavior,
        // @ts-ignore
        UNSTABLE_itemBehavior: data?.['UNSTABLE_itemBehavior'],
        id: id
    });
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
        isDisabled: isDisabled || !shouldFocusOnHover,
        onHoverStart () {
            if (!(0, $d0df89f3abe2c2ca$exports.isFocusVisible)()) {
                state.selectionManager.setFocused(true);
                state.selectionManager.setFocusedKey(key);
            }
        }
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(item?.props);
    delete domProps.id;
    let linkProps = (0, $75bd88aab025820b$exports.useLinkProps)(item?.props);
    return {
        optionProps: {
            ...optionProps,
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(domProps, itemProps, hoverProps, linkProps),
            id: id
        },
        labelProps: {
            id: labelId
        },
        descriptionProps: {
            id: descriptionId
        },
        isFocused: isFocused,
        isFocusVisible: isFocused && state.selectionManager.isFocused && (0, $d0df89f3abe2c2ca$exports.isFocusVisible)(),
        isSelected: isSelected,
        isDisabled: isDisabled,
        isPressed: isPressed,
        allowsSelection: allowsSelection,
        hasAction: hasAction
    };
}


//# sourceMappingURL=useOption.cjs.map
