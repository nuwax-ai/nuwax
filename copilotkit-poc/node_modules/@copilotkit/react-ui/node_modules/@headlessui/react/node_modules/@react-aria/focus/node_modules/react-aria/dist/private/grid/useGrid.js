import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {GridKeyboardDelegate as $bd737065d28db63c$export$de9feff04fda126e} from "./GridKeyboardDelegate.js";
import {gridMap as $799c476c47e4a90b$export$e6235c0d09b995d0} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useCollator as $14a307baf19f0c4b$export$a16aca283550c30d} from "../i18n/useCollator.js";
import {useGridSelectionAnnouncement as $c799300bff6b6e06$export$137e594ef3218a10} from "./useGridSelectionAnnouncement.js";
import {useHasTabbableChild as $644c3c0e7ea96f5b$export$eac1895992b9f3d6} from "../focus/useHasTabbableChild.js";
import {useHighlightSelectionDescription as $344ec8680cac6ab0$export$be42ebdab07ae4c2} from "./useHighlightSelectionDescription.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSelectableCollection as $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.js";
import {useMemo as $mdvea$useMemo, useCallback as $mdvea$useCallback} from "react";

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












function $4b54785d6bd5a561$export$f6b86a04e5d66d90(props, state, ref) {
    let { isVirtualized: isVirtualized, disallowTypeAhead: disallowTypeAhead, keyboardDelegate: keyboardDelegate, focusMode: focusMode, scrollRef: scrollRef, getRowText: getRowText, onRowAction: onRowAction, onCellAction: onCellAction, escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager } = state;
    if (!props['aria-label'] && !props['aria-labelledby']) console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $14a307baf19f0c4b$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $mdvea$useMemo)(()=>keyboardDelegate || new (0, $bd737065d28db63c$export$de9feff04fda126e)({
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
    let { collectionProps: collectionProps } = (0, $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        isVirtualized: isVirtualized,
        scrollRef: scrollRef,
        disallowTypeAhead: disallowTypeAhead,
        escapeKeyBehavior: escapeKeyBehavior
    });
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)(props.id);
    (0, $799c476c47e4a90b$export$e6235c0d09b995d0).set(state, {
        keyboardDelegate: delegate,
        actions: {
            onRowAction: onRowAction,
            onCellAction: onCellAction
        },
        shouldSelectOnPressUp: shouldSelectOnPressUp
    });
    let descriptionProps = (0, $344ec8680cac6ab0$export$be42ebdab07ae4c2)({
        selectionManager: manager,
        hasItemActions: !!(onRowAction || onCellAction)
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let onFocus = (0, $mdvea$useCallback)((e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        manager.setFocused(true);
    }, [
        manager
    ]);
    // Continue to track collection focused state even if keyboard navigation is disabled
    let navDisabledHandlers = (0, $mdvea$useMemo)(()=>({
            onBlur: collectionProps.onBlur,
            onFocus: onFocus
        }), [
        onFocus,
        collectionProps.onBlur
    ]);
    let hasTabbableChild = (0, $644c3c0e7ea96f5b$export$eac1895992b9f3d6)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let gridProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
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
    (0, $c799300bff6b6e06$export$137e594ef3218a10)({
        getRowText: getRowText
    }, state);
    return {
        gridProps: gridProps
    };
}


export {$4b54785d6bd5a561$export$f6b86a04e5d66d90 as useGrid};
//# sourceMappingURL=useGrid.js.map
