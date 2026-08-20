var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $daad9bac4699131f$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $35a82e8f7ac1674d$exports = require("../grid/useGridSelectionAnnouncement.cjs");
var $4a38c0a29bd84510$exports = require("../focus/useHasTabbableChild.cjs");
var $50ae4f70f9b3767e$exports = require("../grid/useHighlightSelectionDescription.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $6c3cc4646da74e51$exports = require("../selection/useSelectableList.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridList", function () { return $9a37293f310f6644$export$664f9155035607eb; });
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 







function $9a37293f310f6644$export$664f9155035607eb(props, state, ref) {
    let { isVirtualized: isVirtualized, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, onAction: onAction, disallowTypeAhead: disallowTypeAhead, linkBehavior: linkBehavior = 'action', keyboardNavigationBehavior: keyboardNavigationBehavior = 'arrow', escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    if (!props['aria-label'] && !props['aria-labelledby']) console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    let { listProps: listProps } = (0, $6c3cc4646da74e51$exports.useSelectableList)({
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        ref: ref,
        keyboardDelegate: keyboardDelegate,
        layoutDelegate: layoutDelegate,
        isVirtualized: isVirtualized,
        selectOnFocus: state.selectionManager.selectionBehavior === 'replace',
        shouldFocusWrap: props.shouldFocusWrap,
        linkBehavior: linkBehavior,
        disallowTypeAhead: disallowTypeAhead,
        autoFocus: props.autoFocus,
        escapeKeyBehavior: escapeKeyBehavior
    });
    let id = (0, $7ac82d1fee77eb8a$exports.useId)(props.id);
    (0, $daad9bac4699131f$exports.listMap).set(state, {
        id: id,
        onAction: onAction,
        linkBehavior: linkBehavior,
        keyboardNavigationBehavior: keyboardNavigationBehavior,
        shouldSelectOnPressUp: shouldSelectOnPressUp
    });
    let descriptionProps = (0, $50ae4f70f9b3767e$exports.useHighlightSelectionDescription)({
        selectionManager: state.selectionManager,
        hasItemActions: !!onAction
    });
    let hasTabbableChild = (0, $4a38c0a29bd84510$exports.useHasTabbableChild)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let gridProps = (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
        role: 'grid',
        id: id,
        'aria-multiselectable': state.selectionManager.selectionMode === 'multiple' ? 'true' : undefined
    }, // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    state.collection.size === 0 ? {
        tabIndex: hasTabbableChild ? -1 : 0
    } : listProps, descriptionProps);
    if (isVirtualized) {
        gridProps['aria-rowcount'] = state.collection.size;
        gridProps['aria-colcount'] = 1;
    }
    (0, $35a82e8f7ac1674d$exports.useGridSelectionAnnouncement)({}, state);
    return {
        gridProps: gridProps
    };
}


//# sourceMappingURL=useGridList.cjs.map
