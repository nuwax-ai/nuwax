import {getRowLabelledBy as $5519a0a73876c3da$export$85069b70317f543} from "./utils.js";
import {useGridRow as $2c62d09fc068cb16$export$96357d5a73f686fa} from "../grid/useGridRow.js";
import $4QDRk$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useSyntheticLinkProps as $044d3c97ce5d6621$export$bdc77b0c0a3a85d6} from "../utils/openLink.js";


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







const $e2f10f6b84ce4b1d$var$EXPANSION_KEYS = {
    expand: {
        ltr: 'ArrowRight',
        rtl: 'ArrowLeft'
    },
    collapse: {
        ltr: 'ArrowLeft',
        rtl: 'ArrowRight'
    }
};
function $e2f10f6b84ce4b1d$export$7f2f6ae19e707aa5(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized } = props;
    let { rowProps: rowProps, ...states } = (0, $2c62d09fc068cb16$export$96357d5a73f686fa)(props, state, ref);
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    if (isVirtualized && state.treeColumn == null) rowProps['aria-rowindex'] = node.index + 1 + state.collection.headerRows.length; // aria-rowindex is 1 based
    else delete rowProps['aria-rowindex'];
    let isExpanded = state.treeColumn != null && (state.expandedKeys === 'all' || state.expandedKeys.has(node.key));
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($4QDRk$intlStringsjs))), '@react-aria/table');
    let labelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        'aria-label': isExpanded ? stringFormatter.format('collapse') : stringFormatter.format('expand'),
        'aria-labelledby': (0, $5519a0a73876c3da$export$85069b70317f543)(state, node.key)
    });
    let treeGridRowProps = {};
    let expandButtonProps = {};
    if (state.treeColumn != null) {
        let treeNode = state.collection.getItem(node.key);
        if (treeNode != null) {
            var _treeNode_props, _treeNode_props1;
            let lastChild = $e2f10f6b84ce4b1d$var$getLastChild(state.collection, node);
            let hasChildRows = ((_treeNode_props = treeNode.props) === null || _treeNode_props === void 0 ? void 0 : _treeNode_props.hasChildRows) || ((_treeNode_props1 = treeNode.props) === null || _treeNode_props1 === void 0 ? void 0 : _treeNode_props1.UNSTABLE_childItems) || (lastChild === null || lastChild === void 0 ? void 0 : lastChild.type) !== 'cell';
            let parent = state.collection.getItem(node.parentKey);
            let isParentBody = parent.type === 'tablebody' || parent.type === 'body';
            let lastSibling = $e2f10f6b84ce4b1d$var$getLastChild(state.collection, parent);
            while(lastSibling && lastSibling.type !== 'item' && lastSibling.prevKey != null)lastSibling = state.collection.getItem(lastSibling.prevKey);
            treeGridRowProps = {
                onKeyDown: (e)=>{
                    if (e.key === $e2f10f6b84ce4b1d$var$EXPANSION_KEYS['expand'][direction] && state.selectionManager.focusedKey === treeNode.key && hasChildRows && state.expandedKeys !== 'all' && !state.expandedKeys.has(treeNode.key)) {
                        state.toggleKey(treeNode.key);
                        e.stopPropagation();
                    } else if (e.key === $e2f10f6b84ce4b1d$var$EXPANSION_KEYS['collapse'][direction] && state.selectionManager.focusedKey === treeNode.key) {
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
    let syntheticLinkProps = (0, $044d3c97ce5d6621$export$bdc77b0c0a3a85d6)(node.props);
    let linkProps = states.hasAction ? syntheticLinkProps : {};
    return {
        rowProps: {
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(rowProps, treeGridRowProps, linkProps),
            'aria-labelledby': (0, $5519a0a73876c3da$export$85069b70317f543)(state, node.key)
        },
        expandButtonProps: expandButtonProps,
        ...states
    };
}
function $e2f10f6b84ce4b1d$var$getLastChild(collection, node) {
    if ('lastChildKey' in node) return node.lastChildKey != null ? collection.getItem(node.lastChildKey) : null;
    else return Array.from(node.childNodes).findLast((item)=>item.parentKey === node.key);
}


export {$e2f10f6b84ce4b1d$export$7f2f6ae19e707aa5 as useTableRow};
//# sourceMappingURL=useTableRow.js.map
