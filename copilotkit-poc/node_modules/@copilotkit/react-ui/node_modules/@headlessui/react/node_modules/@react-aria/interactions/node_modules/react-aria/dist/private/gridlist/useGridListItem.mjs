import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {focusSafely as $f192c2f16961cbe0$export$80f3e147d781571c} from "../interactions/focusSafely.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, isFocusWithin as $23f2114a1b82827e$export$b4f377a2b6254582, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getFocusableTreeWalker as $535772f9d2c1f38d$export$2d6ec8fc375ceafa} from "../focus/FocusScope.mjs";
import {getRowId as $c1c90317e8bffe4d$export$f45c25170b9a99c2, listMap as $c1c90317e8bffe4d$export$5b9bb410392e3991} from "./utils.mjs";
import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import {isFocusVisible as $8f5a2122b0992be3$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {scrollIntoViewport as $51a3e22a5186a962$export$c826860796309d1b} from "../utils/scrollIntoView.mjs";
import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useSlotId as $390e54f620492c70$export$b4cc09c592e8fdb8} from "../utils/useId.mjs";
import {useSyntheticLinkProps as $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6} from "../utils/openLink.mjs";
import {useRef as $2igou$useRef} from "react";

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













const $be7bed9611dd7497$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $be7bed9611dd7497$export$9610e69494fadfd2(props, state, ref) {
    // Copied from useGridCell + some modifications to make it not so grid specific
    let { node: node, isVirtualized: isVirtualized } = props;
    // let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/gridlist');
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let { onAction: onAction, linkBehavior: linkBehavior, keyboardNavigationBehavior: keyboardNavigationBehavior, shouldSelectOnPressUp: shouldSelectOnPressUp } = (0, $c1c90317e8bffe4d$export$5b9bb410392e3991).get(state);
    let descriptionId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)();
    // We need to track the key of the item at the time it was last focused so that we force
    // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
    let keyWhenFocused = (0, $2igou$useRef)(null);
    let focus = ()=>{
        // Don't shift focus to the row if the active element is a element within the row already
        // (e.g. clicking on a row button)
        if (ref.current !== null && (keyWhenFocused.current != null && node.key !== keyWhenFocused.current || !(0, $23f2114a1b82827e$export$b4f377a2b6254582)(ref.current))) (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
    };
    let treeGridRowProps = {};
    let hasChildRows = props.hasChildItems;
    let hasLink = state.selectionManager.isLink(node.key);
    if (node != null && 'expandedKeys' in state) {
        // TODO: ideally node.hasChildNodes would be a way to tell if a row has child nodes, but the row's contents make it so that value is always
        // true...
        let children = state.collection.getChildren?.(node.key);
        hasChildRows = hasChildRows || [
            ...children ?? []
        ].length > 1;
        if (onAction == null && !hasLink && state.selectionManager.selectionMode === 'none' && hasChildRows) onAction = ()=>state.toggleKey(node.key);
        let isExpanded = hasChildRows ? state.expandedKeys.has(node.key) : undefined;
        let setSize = 1;
        let index = node.index;
        if (node.level >= 0 && node?.parentKey != null) {
            let parent = state.collection.getItem(node.parentKey);
            if (parent) {
                // siblings must exist because our original node exists
                let siblings = $be7bed9611dd7497$var$getDirectChildren(parent, state.collection);
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
    let { itemProps: itemProps, ...itemStates } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: props.shouldSelectOnPressUp || shouldSelectOnPressUp,
        onAction: onAction || node.props?.onAction ? (0, $a4e76a5424781910$export$e08e3b67e392101e)(node.props?.onAction, onAction ? ()=>onAction(node.key) : undefined) : undefined,
        focus: focus,
        linkBehavior: linkBehavior
    });
    let onKeyDownCapture = (e)=>{
        let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) || !ref.current || !activeElement) return;
        let walker = (0, $535772f9d2c1f38d$export$2d6ec8fc375ceafa)(ref.current);
        walker.currentNode = activeElement;
        if ('expandedKeys' in state && activeElement === ref.current) {
            if (e.key === $be7bed9611dd7497$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === node.key && hasChildRows && !state.expandedKeys.has(node.key)) {
                state.toggleKey(node.key);
                e.stopPropagation();
                return;
            } else if (e.key === $be7bed9611dd7497$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === node.key) {
                // If item is collapsible, collapse it; else move to parent
                if (hasChildRows && state.expandedKeys.has(node.key)) {
                    state.toggleKey(node.key);
                    e.stopPropagation();
                    return;
                } else if (!state.expandedKeys.has(node.key) && node.parentKey && state.collection.getItem(node.parentKey)?.type === 'item') {
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
                        (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                        (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then return focus back to the row
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'rtl') {
                            (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
                            (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $be7bed9611dd7497$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $f192c2f16961cbe0$export$80f3e147d781571c)(lastElement);
                                (0, $51a3e22a5186a962$export$c826860796309d1b)(lastElement, {
                                    containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
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
                        (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                        (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'ltr') {
                            (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
                            (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $be7bed9611dd7497$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $f192c2f16961cbe0$export$80f3e147d781571c)(lastElement);
                                (0, $51a3e22a5186a962$export$c826860796309d1b)(lastElement, {
                                    containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
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
                if (!e.altKey && (0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
                    e.stopPropagation();
                    e.preventDefault();
                    ref.current.parentElement?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    let onFocus = (e)=>{
        keyWhenFocused.current = node.key;
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the row itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row
            // in that case since the list should act like a single tab stop.
            if (!(0, $8f5a2122b0992be3$export$b9b3dfddab17db27)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
    };
    let onKeyDown = (e)=>{
        let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) || !ref.current || !activeElement) return;
        switch(e.key){
            case 'Tab':
                if (keyboardNavigationBehavior === 'tab') {
                    // If there is another focusable element within this item, stop propagation so the tab key
                    // is handled by the browser and not by useSelectableCollection (which would take us out of the list).
                    let walker = (0, $535772f9d2c1f38d$export$2d6ec8fc375ceafa)(ref.current, {
                        tabbable: true
                    });
                    walker.currentNode = activeElement;
                    let next = e.shiftKey ? walker.previousNode() : walker.nextNode();
                    if (next) e.stopPropagation();
                }
        }
    };
    let syntheticLinkProps = (0, $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6)(node.props);
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
    let rowProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(itemProps, linkProps, {
        role: 'row',
        onKeyDownCapture: onKeyDownCapture,
        onKeyDown: onKeyDown,
        onFocus: onFocus,
        // 'aria-label': [(node.textValue || undefined), rowAnnouncement].filter(Boolean).join(', '),
        'aria-label': node['aria-label'] || node.textValue || undefined,
        'aria-selected': state.selectionManager.canSelectItem(node.key) ? state.selectionManager.isSelected(node.key) : undefined,
        'aria-disabled': state.selectionManager.isDisabled(node.key) || undefined,
        'aria-labelledby': descriptionId && (node['aria-label'] || node.textValue) ? `${(0, $c1c90317e8bffe4d$export$f45c25170b9a99c2)(state, node.key)} ${descriptionId}` : undefined,
        id: (0, $c1c90317e8bffe4d$export$f45c25170b9a99c2)(state, node.key)
    });
    if (isVirtualized) {
        let { collection: collection } = state;
        let nodes = [
            ...collection
        ];
        // TODO: refactor ListCollection to store an absolute index of a node's position?
        rowProps['aria-rowindex'] = nodes.find((node)=>node.type === 'section') ? [
            ...collection.getKeys()
        ].filter((key)=>collection.getItem(key)?.type !== 'section').findIndex((key)=>key === node.key) + 1 : node.index + 1;
    }
    let gridCellProps = {
        role: 'gridcell',
        'aria-colindex': 1
    };
    // TODO: should isExpanded and hasChildRows be a item state that gets returned by the hook?
    return {
        rowProps: {
            ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(rowProps, treeGridRowProps)
        },
        gridCellProps: gridCellProps,
        descriptionProps: {
            id: descriptionId
        },
        ...itemStates
    };
}
function $be7bed9611dd7497$var$last(walker) {
    let next = null;
    let last = null;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
function $be7bed9611dd7497$var$getDirectChildren(parent, collection) {
    // We can't assume that we can use firstChildKey because if a person builds a tree using hooks, they would not have access to that property (using type Node vs CollectionNode)
    // Instead, get all children and start at the first node (rather than just using firstChildKey) and only look at its siblings
    let children = collection.getChildren?.(parent.key);
    let childArray = children ? Array.from(children) : [];
    let node = childArray.length > 0 ? childArray[0] : null;
    let siblings = [];
    while(node){
        siblings.push(node);
        node = node.nextKey != null ? collection.getItem(node.nextKey) : null;
    }
    return siblings;
}


export {$be7bed9611dd7497$export$9610e69494fadfd2 as useGridListItem};
//# sourceMappingURL=useGridListItem.mjs.map
