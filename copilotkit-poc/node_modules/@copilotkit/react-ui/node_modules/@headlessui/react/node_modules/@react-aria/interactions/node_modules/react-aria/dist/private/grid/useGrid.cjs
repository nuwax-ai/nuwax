var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d1b3c33fb98eea6a$exports = require("./GridKeyboardDelegate.cjs");
var $d558273e57410528$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $74751389dd0da9fc$exports = require("../i18n/useCollator.cjs");
var $35a82e8f7ac1674d$exports = require("./useGridSelectionAnnouncement.cjs");
var $4a38c0a29bd84510$exports = require("../focus/useHasTabbableChild.cjs");
var $50ae4f70f9b3767e$exports = require("./useHighlightSelectionDescription.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $df9ba3e9a7210056$exports = require("../selection/useSelectableCollection.cjs");
var $kzE0x$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGrid", function () { return $ef6ed03a6401f944$export$f6b86a04e5d66d90; });
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












function $ef6ed03a6401f944$export$f6b86a04e5d66d90(props, state, ref) {
    let { isVirtualized: isVirtualized, disallowTypeAhead: disallowTypeAhead, keyboardDelegate: keyboardDelegate, focusMode: focusMode, scrollRef: scrollRef, getRowText: getRowText, onRowAction: onRowAction, onCellAction: onCellAction, escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager } = state;
    if (!props['aria-label'] && !props['aria-labelledby']) console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $74751389dd0da9fc$exports.useCollator)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $kzE0x$react.useMemo)(()=>keyboardDelegate || new (0, $d1b3c33fb98eea6a$exports.GridKeyboardDelegate)({
            collection: state.collection,
            disabledKeys: state.disabledKeys,
            disabledBehavior: disabledBehavior,
            ref: ref,
            direction: direction,
            collator: collator,
            focusMode: focusMode
        }), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        disabledBehavior,
        ref,
        direction,
        collator,
        focusMode
    ]);
    let { collectionProps: collectionProps } = (0, $df9ba3e9a7210056$exports.useSelectableCollection)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        isVirtualized: isVirtualized,
        scrollRef: scrollRef,
        disallowTypeAhead: disallowTypeAhead,
        escapeKeyBehavior: escapeKeyBehavior
    });
    let id = (0, $7ac82d1fee77eb8a$exports.useId)(props.id);
    (0, $d558273e57410528$exports.gridMap).set(state, {
        keyboardDelegate: delegate,
        actions: {
            onRowAction: onRowAction,
            onCellAction: onCellAction
        },
        shouldSelectOnPressUp: shouldSelectOnPressUp
    });
    let descriptionProps = (0, $50ae4f70f9b3767e$exports.useHighlightSelectionDescription)({
        selectionManager: manager,
        hasItemActions: !!(onRowAction || onCellAction)
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let onFocus = (0, $kzE0x$react.useCallback)((e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) return;
        manager.setFocused(true);
    }, [
        manager
    ]);
    // Continue to track collection focused state even if keyboard navigation is disabled
    let navDisabledHandlers = (0, $kzE0x$react.useMemo)(()=>({
            onBlur: collectionProps.onBlur,
            onFocus: onFocus
        }), [
        onFocus,
        collectionProps.onBlur
    ]);
    let hasTabbableChild = (0, $4a38c0a29bd84510$exports.useHasTabbableChild)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let gridProps = (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
        role: 'grid',
        id: id,
        'aria-multiselectable': manager.selectionMode === 'multiple' ? 'true' : undefined
    }, state.isKeyboardNavigationDisabled ? navDisabledHandlers : collectionProps, // If collection is empty, make sure the grid is tabbable unless there is a child tabbable element.
    state.collection.size === 0 && {
        tabIndex: hasTabbableChild ? -1 : 0
    } || undefined, descriptionProps);
    if (isVirtualized) {
        gridProps['aria-rowcount'] = state.collection.size;
        gridProps['aria-colcount'] = state.collection.columnCount;
    }
    (0, $35a82e8f7ac1674d$exports.useGridSelectionAnnouncement)({
        getRowText: getRowText
    }, state);
    return {
        gridProps: gridProps
    };
}


//# sourceMappingURL=useGrid.cjs.map
