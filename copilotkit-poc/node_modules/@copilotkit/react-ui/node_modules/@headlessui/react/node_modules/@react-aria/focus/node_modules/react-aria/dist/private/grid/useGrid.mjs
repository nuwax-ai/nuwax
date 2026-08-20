import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {GridKeyboardDelegate as $c7bb87e55e1ab755$export$de9feff04fda126e} from "./GridKeyboardDelegate.mjs";
import {gridMap as $90a81c508a5c0de1$export$e6235c0d09b995d0} from "./utils.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useCollator as $673d46fce3e5717d$export$a16aca283550c30d} from "../i18n/useCollator.mjs";
import {useGridSelectionAnnouncement as $2b2556a8276954c1$export$137e594ef3218a10} from "./useGridSelectionAnnouncement.mjs";
import {useHasTabbableChild as $bf14c9739fda2eb3$export$eac1895992b9f3d6} from "../focus/useHasTabbableChild.mjs";
import {useHighlightSelectionDescription as $40ae3c60ef0e2e61$export$be42ebdab07ae4c2} from "./useHighlightSelectionDescription.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useSelectableCollection as $d667c2af82d35a98$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.mjs";
import {useMemo as $1jEUe$useMemo, useCallback as $1jEUe$useCallback} from "react";

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












function $e9c0503d101e30f9$export$f6b86a04e5d66d90(props, state, ref) {
    let { isVirtualized: isVirtualized, disallowTypeAhead: disallowTypeAhead, keyboardDelegate: keyboardDelegate, focusMode: focusMode, scrollRef: scrollRef, getRowText: getRowText, onRowAction: onRowAction, onCellAction: onCellAction, escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    let { selectionManager: manager } = state;
    if (!props['aria-label'] && !props['aria-labelledby']) console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $673d46fce3e5717d$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let disabledBehavior = state.selectionManager.disabledBehavior;
    let delegate = (0, $1jEUe$useMemo)(()=>keyboardDelegate || new (0, $c7bb87e55e1ab755$export$de9feff04fda126e)({
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
    let { collectionProps: collectionProps } = (0, $d667c2af82d35a98$export$d6daf82dcd84e87c)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        isVirtualized: isVirtualized,
        scrollRef: scrollRef,
        disallowTypeAhead: disallowTypeAhead,
        escapeKeyBehavior: escapeKeyBehavior
    });
    let id = (0, $390e54f620492c70$export$f680877a34711e37)(props.id);
    (0, $90a81c508a5c0de1$export$e6235c0d09b995d0).set(state, {
        keyboardDelegate: delegate,
        actions: {
            onRowAction: onRowAction,
            onCellAction: onCellAction
        },
        shouldSelectOnPressUp: shouldSelectOnPressUp
    });
    let descriptionProps = (0, $40ae3c60ef0e2e61$export$be42ebdab07ae4c2)({
        selectionManager: manager,
        hasItemActions: !!(onRowAction || onCellAction)
    });
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let onFocus = (0, $1jEUe$useCallback)((e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
        manager.setFocused(true);
    }, [
        manager
    ]);
    // Continue to track collection focused state even if keyboard navigation is disabled
    let navDisabledHandlers = (0, $1jEUe$useMemo)(()=>({
            onBlur: collectionProps.onBlur,
            onFocus: onFocus
        }), [
        onFocus,
        collectionProps.onBlur
    ]);
    let hasTabbableChild = (0, $bf14c9739fda2eb3$export$eac1895992b9f3d6)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let gridProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, {
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
    (0, $2b2556a8276954c1$export$137e594ef3218a10)({
        getRowText: getRowText
    }, state);
    return {
        gridProps: gridProps
    };
}


export {$e9c0503d101e30f9$export$f6b86a04e5d66d90 as useGrid};
//# sourceMappingURL=useGrid.mjs.map
