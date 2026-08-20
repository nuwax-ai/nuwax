import {getRowLabelledBy as $cf56c58f505db99a$export$85069b70317f543} from "./utils.mjs";
import {useGridRow as $6b16276e8bbdaf8e$export$96357d5a73f686fa} from "../grid/useGridRow.mjs";
import $eezcW$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useSyntheticLinkProps as $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6} from "../utils/openLink.mjs";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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







const $d5954d038bf91c37$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $d5954d038bf91c37$export$7f2f6ae19e707aa5(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized } = props;
    let { rowProps: rowProps, ...states } = (0, $6b16276e8bbdaf8e$export$96357d5a73f686fa)(props, state, ref);
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    if (isVirtualized && state.treeColumn == null) rowProps['aria-rowindex'] = node.index + 1 + state.collection.headerRows.length; // aria-rowindex is 1 based
    else delete rowProps['aria-rowindex'];
    let isExpanded = state.treeColumn != null && (state.expandedKeys === 'all' || state.expandedKeys.has(node.key));
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($eezcW$intlStringsmjs))), '@react-aria/table');
    let labelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        'aria-label': isExpanded ? stringFormatter.format('collapse') : stringFormatter.format('expand'),
        'aria-labelledby': (0, $cf56c58f505db99a$export$85069b70317f543)(state, node.key)
    });
    let treeGridRowProps = {};
    let expandButtonProps = {};
    if (state.treeColumn != null) {
        let treeNode = state.collection.getItem(node.key);
        if (treeNode != null) {
            let lastChild = $d5954d038bf91c37$var$getLastChild(state.collection, node);
            let hasChildRows = treeNode.props?.hasChildRows || treeNode.props?.UNSTABLE_childItems || lastChild?.type !== 'cell';
            let parent = state.collection.getItem(node.parentKey);
            let isParentBody = parent.type === 'tablebody' || parent.type === 'body';
            let lastSibling = $d5954d038bf91c37$var$getLastChild(state.collection, parent);
            while(lastSibling && lastSibling.type !== 'item' && lastSibling.prevKey != null)lastSibling = state.collection.getItem(lastSibling.prevKey);
            treeGridRowProps = {
                onKeyDown: (e)=>{
                    if (e.key === $d5954d038bf91c37$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === treeNode.key && hasChildRows && state.expandedKeys !== 'all' && !state.expandedKeys.has(treeNode.key)) {
                        state.toggleKey(treeNode.key);
                        e.stopPropagation();
                    } else if (e.key === $d5954d038bf91c37$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === treeNode.key) {
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
    let syntheticLinkProps = (0, $caaf0dd3060ed57c$export$bdc77b0c0a3a85d6)(node.props);
    let linkProps = states.hasAction ? syntheticLinkProps : {};
    return {
        rowProps: {
            ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(rowProps, treeGridRowProps, linkProps),
            'aria-labelledby': (0, $cf56c58f505db99a$export$85069b70317f543)(state, node.key)
        },
        expandButtonProps: expandButtonProps,
        ...states
    };
}
function $d5954d038bf91c37$var$getLastChild(collection, node) {
    if ('lastChildKey' in node) return node.lastChildKey != null ? collection.getItem(node.lastChildKey) : null;
    else return Array.from(node.childNodes).findLast((item)=>item.parentKey === node.key);
}


export {$d5954d038bf91c37$export$7f2f6ae19e707aa5 as useTableRow};
//# sourceMappingURL=useTableRow.mjs.map
