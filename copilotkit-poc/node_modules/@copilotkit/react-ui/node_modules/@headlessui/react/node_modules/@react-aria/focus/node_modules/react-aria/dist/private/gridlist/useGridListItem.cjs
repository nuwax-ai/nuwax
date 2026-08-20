var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $4a053a4bf25e52fb$exports = require("../interactions/focusSafely.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $daad9bac4699131f$exports = require("./utils.cjs");
var $d865e4ff74ef4a73$exports = require("../utils/getScrollParent.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $9a1324d6ffd8bbb0$exports = require("../utils/scrollIntoView.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $aj3Ek$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridListItem", function () { return $d07dc266c3dc14c0$export$9610e69494fadfd2; });
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













const $d07dc266c3dc14c0$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $d07dc266c3dc14c0$export$9610e69494fadfd2(props, state, ref) {
    // Copied from useGridCell + some modifications to make it not so grid specific
    let { node: node, isVirtualized: isVirtualized } = props;
    // let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-aria/gridlist');
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let { onAction: onAction, linkBehavior: linkBehavior, keyboardNavigationBehavior: keyboardNavigationBehavior, shouldSelectOnPressUp: shouldSelectOnPressUp } = (0, $daad9bac4699131f$exports.listMap).get(state);
    let descriptionId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    // We need to track the key of the item at the time it was last focused so that we force
    // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
    let keyWhenFocused = (0, $aj3Ek$react.useRef)(null);
    let focus = ()=>{
        // Don't shift focus to the row if the active element is a element within the row already
        // (e.g. clicking on a row button)
        if (ref.current !== null && (keyWhenFocused.current != null && node.key !== keyWhenFocused.current || !(0, $da02ee888921bc9e$exports.isFocusWithin)(ref.current))) (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
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
                let siblings = $d07dc266c3dc14c0$var$getDirectChildren(parent, state.collection);
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
    let { itemProps: itemProps, ...itemStates } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        shouldSelectOnPressUp: props.shouldSelectOnPressUp || shouldSelectOnPressUp,
        onAction: onAction || node.props?.onAction ? (0, $2f95486cfdaa743c$exports.chain)(node.props?.onAction, onAction ? ()=>onAction(node.key) : undefined) : undefined,
        focus: focus,
        linkBehavior: linkBehavior
    });
    let onKeyDownCapture = (e)=>{
        let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)();
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) || !ref.current || !activeElement) return;
        let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(ref.current);
        walker.currentNode = activeElement;
        if ('expandedKeys' in state && activeElement === ref.current) {
            if (e.key === $d07dc266c3dc14c0$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === node.key && hasChildRows && !state.expandedKeys.has(node.key)) {
                state.toggleKey(node.key);
                e.stopPropagation();
                return;
            } else if (e.key === $d07dc266c3dc14c0$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === node.key) {
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
                        (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                        (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                            containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then return focus back to the row
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'rtl') {
                            (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
                            (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $d07dc266c3dc14c0$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $4a053a4bf25e52fb$exports.focusSafely)(lastElement);
                                (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(lastElement, {
                                    containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                        (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                        (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                            containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                        });
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        if (direction === 'ltr') {
                            (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
                            (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            let lastElement = $d07dc266c3dc14c0$var$last(walker);
                            // oxlint-disable-next-line max-depth
                            if (lastElement) {
                                (0, $4a053a4bf25e52fb$exports.focusSafely)(lastElement);
                                (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(lastElement, {
                                    containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                if (!e.altKey && (0, $da02ee888921bc9e$exports.nodeContains)(ref.current, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
                    e.stopPropagation();
                    e.preventDefault();
                    ref.current.parentElement?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    let onFocus = (e)=>{
        keyWhenFocused.current = node.key;
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the row itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row
            // in that case since the list should act like a single tab stop.
            if (!(0, $d0df89f3abe2c2ca$exports.isFocusVisible)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
    };
    let onKeyDown = (e)=>{
        let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)();
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) || !ref.current || !activeElement) return;
        switch(e.key){
            case 'Tab':
                if (keyboardNavigationBehavior === 'tab') {
                    // If there is another focusable element within this item, stop propagation so the tab key
                    // is handled by the browser and not by useSelectableCollection (which would take us out of the list).
                    let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(ref.current, {
                        tabbable: true
                    });
                    walker.currentNode = activeElement;
                    let next = e.shiftKey ? walker.previousNode() : walker.nextNode();
                    if (next) e.stopPropagation();
                }
        }
    };
    let syntheticLinkProps = (0, $75bd88aab025820b$exports.useSyntheticLinkProps)(node.props);
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
    let rowProps = (0, $89b39774f3b79dbb$exports.mergeProps)(itemProps, linkProps, {
        role: 'row',
        onKeyDownCapture: onKeyDownCapture,
        onKeyDown: onKeyDown,
        onFocus: onFocus,
        // 'aria-label': [(node.textValue || undefined), rowAnnouncement].filter(Boolean).join(', '),
        'aria-label': node['aria-label'] || node.textValue || undefined,
        'aria-selected': state.selectionManager.canSelectItem(node.key) ? state.selectionManager.isSelected(node.key) : undefined,
        'aria-disabled': state.selectionManager.isDisabled(node.key) || undefined,
        'aria-labelledby': descriptionId && (node['aria-label'] || node.textValue) ? `${(0, $daad9bac4699131f$exports.getRowId)(state, node.key)} ${descriptionId}` : undefined,
        id: (0, $daad9bac4699131f$exports.getRowId)(state, node.key)
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
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(rowProps, treeGridRowProps)
        },
        gridCellProps: gridCellProps,
        descriptionProps: {
            id: descriptionId
        },
        ...itemStates
    };
}
function $d07dc266c3dc14c0$var$last(walker) {
    let next = null;
    let last = null;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
function $d07dc266c3dc14c0$var$getDirectChildren(parent, collection) {
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


//# sourceMappingURL=useGridListItem.cjs.map
