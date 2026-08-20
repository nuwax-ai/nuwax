var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $63bd36c8d873711d$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $ec895d26f03379ea$exports = require("../label/useLabel.cjs");
var $6c3cc4646da74e51$exports = require("../selection/useSelectableList.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useListBox", function () { return $05d5b95f017c4bb5$export$50eacbbf140a3141; });
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






function $05d5b95f017c4bb5$export$50eacbbf140a3141(props, state, ref) {
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    // Use props instead of state here. We don't want this to change due to long press.
    let selectionBehavior = props.selectionBehavior || 'toggle';
    let orientation = props.orientation || 'vertical';
    let linkBehavior = props.linkBehavior || (selectionBehavior === 'replace' ? 'action' : 'override');
    if (selectionBehavior === 'toggle' && linkBehavior === 'action') // linkBehavior="action" does not work with selectionBehavior="toggle" because there is no way
    // to initiate selection (checkboxes are not allowed inside a listbox). Link items will not be
    // selectable in this configuration.
    linkBehavior = 'override';
    let { listProps: listProps } = (0, $6c3cc4646da74e51$exports.useSelectableList)({
        ...props,
        ref: ref,
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        linkBehavior: linkBehavior
    });
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        onFocusWithin: props.onFocus,
        onBlurWithin: props.onBlur,
        onFocusWithinChange: props.onFocusChange
    });
    // Share list id and some props with child options.
    let id = (0, $7ac82d1fee77eb8a$exports.useId)(props.id);
    (0, $63bd36c8d873711d$exports.listData).set(state, {
        id: id,
        shouldUseVirtualFocus: props.shouldUseVirtualFocus,
        shouldSelectOnPressUp: props.shouldSelectOnPressUp,
        shouldFocusOnHover: props.shouldFocusOnHover,
        isVirtualized: props.isVirtualized,
        onAction: props.onAction,
        linkBehavior: linkBehavior,
        // @ts-ignore
        UNSTABLE_itemBehavior: props['UNSTABLE_itemBehavior']
    });
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $ec895d26f03379ea$exports.useLabel)({
        ...props,
        id: id,
        // listbox is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span'
    });
    return {
        labelProps: labelProps,
        listBoxProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, focusWithinProps, state.selectionManager.selectionMode === 'multiple' ? {
            'aria-multiselectable': 'true'
        } : {}, {
            role: 'listbox',
            'aria-orientation': orientation,
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(fieldProps, listProps)
        })
    };
}


//# sourceMappingURL=useListBox.cjs.map
