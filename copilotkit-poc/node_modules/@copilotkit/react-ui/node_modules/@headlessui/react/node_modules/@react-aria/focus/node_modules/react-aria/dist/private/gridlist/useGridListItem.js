import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {focusSafely as $56c81cdebdc6a696$export$80f3e147d781571c} from "../interactions/focusSafely.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, isFocusWithin as $d8ac7ed472840322$export$b4f377a2b6254582, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getFocusableTreeWalker as $903814aeb7d53b38$export$2d6ec8fc375ceafa} from "../focus/FocusScope.js";
import {getRowId as $781ed2e01df48c52$export$f45c25170b9a99c2, listMap as $781ed2e01df48c52$export$5b9bb410392e3991} from "./utils.js";
import {getScrollParent as $5b46e0a1626c2890$export$cfa2225e87938781} from "../utils/getScrollParent.js";
import {isFocusVisible as $b50b1cc8a843ace7$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {scrollIntoViewport as $6507765bd7f5ad94$export$c826860796309d1b} from "../utils/scrollIntoView.js";
import {useSelectableItem as $0d8cf6a15fe85601$export$ecf600387e221c37} from "../selection/useSelectableItem.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";
import {useSyntheticLinkProps as $044d3c97ce5d6621$export$bdc77b0c0a3a85d6} from "../utils/openLink.js";
import {useRef as $45hvd$useRef} from "react";

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













const $7d08662b45460e3b$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $7d08662b45460e3b$export$9610e69494fadfd2(props, state, ref) {
    var _node_props, _node_props1;
    // Copied from useGridCell + some modifications to make it not so grid specific
    let { node: node, isVirtualized: isVirtualized } = props;
    // let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/gridlist');
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let { onAction: onAction, linkBehavior: linkBehavior, keyboardNavigationBehavior: keyboardNavigationBehavior, shouldSelectOnPressUp: shouldSelectOnPressUp } = (0, $781ed2e01df48c52$export$5b9bb410392e3991).get(state);
    let descriptionId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    // We need to track the key of the item at the time it was last focused so that we force
    // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
    let keyWhenFocused = (0, $45hvd$useRef)(null);
    let focus = ()=>{
        // Don't shift focus to the row if the active element is a element within the row already
        // (e.g. clicking on a row button)
        if (ref.current !== null && (keyWhenFocused.current != null && node.key !== keyWhenFocused.current || !(0, $d8ac7ed472840322$export$b4f377a2b6254582)(ref.current))) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
    };
    let treeGridRowProps = {};
    let hasChildRows = props.hasChildItems;
    let hasLink = state.selectionManager.isLink(node.key);
    if (node != null && 'expandedKeys' in state) {
        var _state_collection_getChildren, _state_collection;
        // TODO: ideally node.hasChildNodes would be a way to tell if a row has child nodes, but the row's contents make it so that value is always
        // true...
        let children = (_state_collection_getChildren = (_state_collection = state.collection).getChildren) === null || _state_collection_getChildren === void 0 ? void 0 : _state_collection_getChildren.call(_state_collection, node.key);
        hasChildRows = hasChildRows || [
            ...children !== null && children !== void 0 ? children : []
        ].length > 1;
        if (onAction == null && !hasLink && state.selectionManager.selectionMode === 'none' && hasChildRows) onAction = ()=>state.toggleKey(node.key);
        let isExpanded = hasChildRows ? state.expandedKeys.has(node.key) : undefined;
        let setSize = 1;
        let index = node.index;
        if (node.level >= 0 && (node === null || node === void 0 ? void 0 : node.parentKey) != null) {
            let parent = state.collection.getItem(node.parentKey);
            if (parent) {
                // siblings must exist because our original node exists
                let siblings = $7d08662b45460e3b$var$getDirectChildren(parent, state.collection);
                setSize = [
                    ...siblings
                ].filter((row)=>row.type === 'item').length;
                if (index > 0 && siblings[0].type !== 'item') index -= 1; // subtract one for the parent item's content node
            }
        } else setSize = [
            ...state.collection
        ].filter((row)=>row.level === 0 && row.type === 'item').length;
        treeGridRowProps = {
            'aria-expanded': isExpanded,
            'aria-level': node.level + 1,
            'aria-posinset': index + 1,
            'aria-setsize': setSize
        };
    }
    let { itemProps: itemProps, ...itemStates } = (0, $0d8cf6a15fe85601$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: props.shouldSelectOnPressUp || shouldSelectOnPressUp,
        onAction: onAction || ((_node_props = node.props) === null || _node_props === void 0 ? void 0 : _node_props.onAction) ? (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)((_node_props1 = node.props) === null || _node_props1 === void 0 ? void 0 : _node_props1.onAction, onAction ? ()=>onAction(node.key) : undefined) : undefined,
        focus: focus,
        linkBehavior: linkBehavior
    });
    let onKeyDownCapture = (e)=>{
        let activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)();
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) || !ref.current || !activeElement) return;
        let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(ref.current);
        walker.currentNode = activeElement;
        if ('expandedKeys' in state && activeElement === ref.current) {
            if (e.key === $7d08662b45460e3b$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === node.key && hasChildRows && !state.expandedKeys.has(node.key)) {
                state.toggleKey(node.key);
                e.stopPropagation();
                return;
            } else if (e.key === $7d08662b45460e3b$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === node.key) {
                var _state_collection_getItem;
                // If item is collapsible, collapse it; else move to parent
                if (hasChildRows && state.expandedKeys.has(node.key)) {
                    state.toggleKey(node.key);
                    e.stopPropagation();
                    return;
                } else if (!state.expandedKeys.has(node.key) && node.parentKey && ((_state_collection_getItem = state.collection.getItem(node.parentKey)) === null || _state_collection_getItem === void 0 ? void 0 : _state_collection_getItem.type) === 'item') {
                    // Item is a leaf or already collapsed, move focus to parent
                    state.selectionManager.setFocusedKey(node.parentKey);
                    e.stopPropagation();
                    return;
                }
            }
        }
        switch(e.key){
            case 'ArrowLeft':
                if (keyboardNavigationBehavior === 'arrow') {
                    // Find the next focusable element within the row.
                    let focusable = direction === 'rtl' ? walker.nextNode() : walker.previousNode();
                    if (focusable) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $56c81cdebdc6a696$export$80f3e147d781571c)(focusable);
                        (0, $6507765bd7f5ad94$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then return focus back to the row
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'rtl') {
                            (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
                            (0, $6507765bd7f5ad94$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $7d08662b45460e3b$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $56c81cdebdc6a696$export$80f3e147d781571c)(lastElement);
                                (0, $6507765bd7f5ad94$export$c826860796309d1b)(lastElement, {
                                    containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                                });
                            }
                        }
                    }
                }
                break;
            case 'ArrowRight':
                if (keyboardNavigationBehavior === 'arrow') {
                    let focusable = direction === 'rtl' ? walker.previousNode() : walker.nextNode();
                    if (focusable) {
                        e.preventDefault();
                        e.stopPropagation();
                        (0, $56c81cdebdc6a696$export$80f3e147d781571c)(focusable);
                        (0, $6507765bd7f5ad94$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'ltr') {
                            (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
                            (0, $6507765bd7f5ad94$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $7d08662b45460e3b$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $56c81cdebdc6a696$export$80f3e147d781571c)(lastElement);
                                (0, $6507765bd7f5ad94$export$c826860796309d1b)(lastElement, {
                                    containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
                                });
                            }
                        }
                    }
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                // Prevent this event from reaching row children, e.g. menu buttons. We want arrow keys to navigate
                // to the row above/below instead. We need to re-dispatch the event from a higher parent so it still
                // bubbles and gets handled by useSelectableCollection.
                if (!e.altKey && (0, $d8ac7ed472840322$export$4282f70798064fe0)(ref.current, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                    var _ref_current_parentElement;
                    e.stopPropagation();
                    e.preventDefault();
                    (_ref_current_parentElement = ref.current.parentElement) === null || _ref_current_parentElement === void 0 ? void 0 : _ref_current_parentElement.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    let onFocus = (e)=>{
        keyWhenFocused.current = node.key;
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the row itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row
            // in that case since the list should act like a single tab stop.
            if (!(0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
    };
    let onKeyDown = (e)=>{
        let activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)();
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) || !ref.current || !activeElement) return;
        switch(e.key){
            case 'Tab':
                if (keyboardNavigationBehavior === 'tab') {
                    // If there is another focusable element within this item, stop propagation so the tab key
                    // is handled by the browser and not by useSelectableCollection (which would take us out of the list).
                    let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(ref.current, {
                        tabbable: true
                    });
                    walker.currentNode = activeElement;
                    let next = e.shiftKey ? walker.previousNode() : walker.nextNode();
                    if (next) e.stopPropagation();
                }
        }
    };
    let syntheticLinkProps = (0, $044d3c97ce5d6621$export$bdc77b0c0a3a85d6)(node.props);
    let linkProps = itemStates.hasAction ? syntheticLinkProps : {};
    // TODO: re-add when we get translations and fix this for iOS VO
    // let rowAnnouncement;
    // if (onAction) {
    //   rowAnnouncement = stringFormatter.format('hasActionAnnouncement');
    // } else if (hasLink) {
    //   rowAnnouncement = stringFormatter.format('hasLinkAnnouncement', {
    //     link: node.props.href
    //   });
    // }
    let rowProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(itemProps, linkProps, {
        role: 'row',
        onKeyDownCapture: onKeyDownCapture,
        onKeyDown: onKeyDown,
        onFocus: onFocus,
        // 'aria-label': [(node.textValue || undefined), rowAnnouncement].filter(Boolean).join(', '),
        'aria-label': node['aria-label'] || node.textValue || undefined,
        'aria-selected': state.selectionManager.canSelectItem(node.key) ? state.selectionManager.isSelected(node.key) : undefined,
        'aria-disabled': state.selectionManager.isDisabled(node.key) || undefined,
        'aria-labelledby': descriptionId && (node['aria-label'] || node.textValue) ? `${(0, $781ed2e01df48c52$export$f45c25170b9a99c2)(state, node.key)} ${descriptionId}` : undefined,
        id: (0, $781ed2e01df48c52$export$f45c25170b9a99c2)(state, node.key)
    });
    if (isVirtualized) {
        let { collection: collection } = state;
        let nodes = [
            ...collection
        ];
        // TODO: refactor ListCollection to store an absolute index of a node's position?
        rowProps['aria-rowindex'] = nodes.find((node)=>node.type === 'section') ? [
            ...collection.getKeys()
        ].filter((key)=>{
            var _collection_getItem;
            return ((_collection_getItem = collection.getItem(key)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.type) !== 'section';
        }).findIndex((key)=>key === node.key) + 1 : node.index + 1;
    }
    let gridCellProps = {
        role: 'gridcell',
        'aria-colindex': 1
    };
    // TODO: should isExpanded and hasChildRows be a item state that gets returned by the hook?
    return {
        rowProps: {
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(rowProps, treeGridRowProps)
        },
        gridCellProps: gridCellProps,
        descriptionProps: {
            id: descriptionId
        },
        ...itemStates
    };
}
function $7d08662b45460e3b$var$last(walker) {
    let next = null;
    let last = null;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
function $7d08662b45460e3b$var$getDirectChildren(parent, collection) {
    var _collection_getChildren;
    // We can't assume that we can use firstChildKey because if a person builds a tree using hooks, they would not have access to that property (using type Node vs CollectionNode)
    // Instead, get all children and start at the first node (rather than just using firstChildKey) and only look at its siblings
    let children = (_collection_getChildren = collection.getChildren) === null || _collection_getChildren === void 0 ? void 0 : _collection_getChildren.call(collection, parent.key);
    let childArray = children ? Array.from(children) : [];
    let node = childArray.length > 0 ? childArray[0] : null;
    let siblings = [];
    while(node){
        siblings.push(node);
        node = node.nextKey != null ? collection.getItem(node.nextKey) : null;
    }
    return siblings;
}


export {$7d08662b45460e3b$export$9610e69494fadfd2 as useGridListItem};
//# sourceMappingURL=useGridListItem.js.map
