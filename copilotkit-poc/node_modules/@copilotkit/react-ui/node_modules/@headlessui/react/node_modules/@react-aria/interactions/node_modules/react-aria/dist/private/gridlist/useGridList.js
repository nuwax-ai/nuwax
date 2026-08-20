import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {listMap as $781ed2e01df48c52$export$5b9bb410392e3991} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useGridSelectionAnnouncement as $c799300bff6b6e06$export$137e594ef3218a10} from "../grid/useGridSelectionAnnouncement.js";
import {useHasTabbableChild as $644c3c0e7ea96f5b$export$eac1895992b9f3d6} from "../focus/useHasTabbableChild.js";
import {useHighlightSelectionDescription as $344ec8680cac6ab0$export$be42ebdab07ae4c2} from "../grid/useHighlightSelectionDescription.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useSelectableList as $1bd41fe243048d1b$export$b95089534ab7c1fd} from "../selection/useSelectableList.js";

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







function $386a4c16c0702f9d$export$664f9155035607eb(props, state, ref) {
    let { isVirtualized: isVirtualized, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, onAction: onAction, disallowTypeAhead: disallowTypeAhead, linkBehavior: linkBehavior = 'action', keyboardNavigationBehavior: keyboardNavigationBehavior = 'arrow', escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', shouldSelectOnPressUp: shouldSelectOnPressUp } = props;
    if (!props['aria-label'] && !props['aria-labelledby']) console.warn('An aria-label or aria-labelledby prop is required for accessibility.');
    let { listProps: listProps } = (0, $1bd41fe243048d1b$export$b95089534ab7c1fd)({
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
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)(props.id);
    (0, $781ed2e01df48c52$export$5b9bb410392e3991).set(state, {
        id: id,
        onAction: onAction,
        linkBehavior: linkBehavior,
        keyboardNavigationBehavior: keyboardNavigationBehavior,
        shouldSelectOnPressUp: shouldSelectOnPressUp
    });
    let descriptionProps = (0, $344ec8680cac6ab0$export$be42ebdab07ae4c2)({
        selectionManager: state.selectionManager,
        hasItemActions: !!onAction
    });
    let hasTabbableChild = (0, $644c3c0e7ea96f5b$export$eac1895992b9f3d6)(ref, {
        isDisabled: state.collection.size !== 0
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let gridProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
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
    (0, $c799300bff6b6e06$export$137e594ef3218a10)({}, state);
    return {
        gridProps: gridProps
    };
}


export {$386a4c16c0702f9d$export$664f9155035607eb as useGridList};
//# sourceMappingURL=useGridList.js.map
