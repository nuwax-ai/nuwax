var $589a6443185dab0f$exports = require("./utils.cjs");
var $2e39d55f4397f5df$exports = require("../grid/useGridRow.cjs");
var $526eef38cac7f2b8$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableRow", function () { return $068ae3d49ce17647$export$7f2f6ae19e707aa5; });
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







const $068ae3d49ce17647$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $068ae3d49ce17647$export$7f2f6ae19e707aa5(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized } = props;
    let { rowProps: rowProps, ...states } = (0, $2e39d55f4397f5df$exports.useGridRow)(props, state, ref);
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    if (isVirtualized && state.treeColumn == null) rowProps['aria-rowindex'] = node.index + 1 + state.collection.headerRows.length; // aria-rowindex is 1 based
    else delete rowProps['aria-rowindex'];
    let isExpanded = state.treeColumn != null && (state.expandedKeys === 'all' || state.expandedKeys.has(node.key));
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($526eef38cac7f2b8$exports))), '@react-aria/table');
    let labelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        'aria-label': isExpanded ? stringFormatter.format('collapse') : stringFormatter.format('expand'),
        'aria-labelledby': (0, $589a6443185dab0f$exports.getRowLabelledBy)(state, node.key)
    });
    let treeGridRowProps = {};
    let expandButtonProps = {};
    if (state.treeColumn != null) {
        let treeNode = state.collection.getItem(node.key);
        if (treeNode != null) {
            let lastChild = $068ae3d49ce17647$var$getLastChild(state.collection, node);
            let hasChildRows = treeNode.props?.hasChildRows || treeNode.props?.UNSTABLE_childItems || lastChild?.type !== 'cell';
            let parent = state.collection.getItem(node.parentKey);
            let isParentBody = parent.type === 'tablebody' || parent.type === 'body';
            let lastSibling = $068ae3d49ce17647$var$getLastChild(state.collection, parent);
            while(lastSibling && lastSibling.type !== 'item' && lastSibling.prevKey != null)lastSibling = state.collection.getItem(lastSibling.prevKey);
            treeGridRowProps = {
                onKeyDown: (e)=>{
                    if (e.key === $068ae3d49ce17647$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === treeNode.key && hasChildRows && state.expandedKeys !== 'all' && !state.expandedKeys.has(treeNode.key)) {
                        state.toggleKey(treeNode.key);
                        e.stopPropagation();
                    } else if (e.key === $068ae3d49ce17647$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === treeNode.key) {
                        if (state.expandedKeys !== 'all') {
                            if (hasChildRows && state.expandedKeys.has(treeNode.key)) {
                                state.toggleKey(treeNode.key);
                                e.stopPropagation();
                            } else if (!state.expandedKeys.has(treeNode.key) && treeNode.parentKey != null && treeNode.level > 0) {
                                // Item is a leaf or already collapsed, move focus to parent
                                state.selectionManager.setFocusedKey(treeNode.parentKey);
                                e.stopPropagation();
                            }
                        } else if (state.expandedKeys === 'all') {
                            state.toggleKey(treeNode.key);
                            e.stopPropagation();
                        }
                    }
                },
                'aria-expanded': hasChildRows ? state.expandedKeys === 'all' || state.expandedKeys.has(node.key) : undefined,
                'aria-level': treeNode.level + 1,
                'aria-posinset': treeNode.index - (isParentBody ? 0 : state.collection.columnCount) + 1,
                'aria-setsize': lastSibling.index - (isParentBody ? 0 : state.collection.columnCount) + 1
            };
            expandButtonProps = {
                isDisabled: states.isDisabled,
                onPress: ()=>{
                    if (!states.isDisabled) {
                        state.toggleKey(node.key);
                        state.selectionManager.setFocused(true);
                        state.selectionManager.setFocusedKey(node.key);
                    }
                },
                excludeFromTabOrder: true,
                preventFocusOnPress: true,
                // @ts-ignore
                'data-react-aria-prevent-focus': true,
                ...labelProps
            };
        }
    }
    let syntheticLinkProps = (0, $75bd88aab025820b$exports.useSyntheticLinkProps)(node.props);
    let linkProps = states.hasAction ? syntheticLinkProps : {};
    return {
        rowProps: {
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(rowProps, treeGridRowProps, linkProps),
            'aria-labelledby': (0, $589a6443185dab0f$exports.getRowLabelledBy)(state, node.key)
        },
        expandButtonProps: expandButtonProps,
        ...states
    };
}
function $068ae3d49ce17647$var$getLastChild(collection, node) {
    if ('lastChildKey' in node) return node.lastChildKey != null ? collection.getItem(node.lastChildKey) : null;
    else return Array.from(node.childNodes).findLast((item)=>item.parentKey === node.key);
}


//# sourceMappingURL=useTableRow.cjs.map
