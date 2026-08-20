import {CollectionBuilder as $43bac1ab0e94ec67$export$bf788dd355e3a401} from "../collections/CollectionBuilder.js";
import {TableCollection as $6b47ca591182ac8d$export$596e1b2e2cf93690} from "./TableCollection.js";
import {tableNestedRows as $ed892adb18214553$export$1b00cb14a96194e6} from "../flags/flags.js";
import {useTableState as $d5cc3b32ccfc476f$export$907bcc6c48325fd6} from "./useTableState.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useMemo as $8frb5$useMemo} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 





function $2aff27f0c0f8339d$export$34dfa8a1622185a4(props) {
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, UNSTABLE_expandedKeys: propExpandedKeys, UNSTABLE_defaultExpandedKeys: propDefaultExpandedKeys, UNSTABLE_onExpandedChange: UNSTABLE_onExpandedChange, children: children } = props;
    if (!(0, $ed892adb18214553$export$1b00cb14a96194e6)()) throw new Error('Feature flag for table nested rows must be enabled to use useTreeGridState.');
    let [expandedKeys, setExpandedKeys] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(propExpandedKeys ? $2aff27f0c0f8339d$var$convertExpanded(propExpandedKeys) : undefined, propDefaultExpandedKeys ? $2aff27f0c0f8339d$var$convertExpanded(propDefaultExpandedKeys) : new Set(), UNSTABLE_onExpandedChange);
    let context = (0, $8frb5$useMemo)(()=>({
            showSelectionCheckboxes: showSelectionCheckboxes && selectionMode !== 'none',
            showDragButtons: showDragButtons,
            selectionMode: selectionMode,
            columns: []
        }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        children,
        showSelectionCheckboxes,
        selectionMode,
        showDragButtons
    ]);
    let builder = (0, $8frb5$useMemo)(()=>new (0, $43bac1ab0e94ec67$export$bf788dd355e3a401)(), []);
    let nodes = (0, $8frb5$useMemo)(()=>builder.build({
            children: children
        }, context), [
        builder,
        children,
        context
    ]);
    let treeGridCollection = (0, $8frb5$useMemo)(()=>{
        return $2aff27f0c0f8339d$var$generateTreeGridCollection(nodes, {
            showSelectionCheckboxes: showSelectionCheckboxes,
            showDragButtons: showDragButtons,
            expandedKeys: expandedKeys
        });
    }, [
        nodes,
        showSelectionCheckboxes,
        showDragButtons,
        expandedKeys
    ]);
    let onToggle = (key)=>{
        setExpandedKeys($2aff27f0c0f8339d$var$toggleKey(expandedKeys, key, treeGridCollection));
    };
    let collection = (0, $8frb5$useMemo)(()=>{
        return new (0, $6b47ca591182ac8d$export$596e1b2e2cf93690)(treeGridCollection.tableNodes, null, context);
    }, [
        context,
        treeGridCollection.tableNodes
    ]);
    let tableState = (0, $d5cc3b32ccfc476f$export$907bcc6c48325fd6)({
        ...props,
        collection: collection
    });
    var _tableState_treeColumn, _ref;
    return {
        ...tableState,
        keyMap: treeGridCollection.keyMap,
        userColumnCount: treeGridCollection.userColumnCount,
        expandedKeys: expandedKeys,
        toggleKey: onToggle,
        treeColumn: (_ref = (_tableState_treeColumn = tableState.treeColumn) !== null && _tableState_treeColumn !== void 0 ? _tableState_treeColumn : collection.rowHeaderColumnKeys.keys().next().value) !== null && _ref !== void 0 ? _ref : null
    };
}
function $2aff27f0c0f8339d$var$toggleKey(currentExpandedKeys, key, collection) {
    let updatedExpandedKeys;
    if (currentExpandedKeys === 'all') {
        updatedExpandedKeys = new Set(collection.flattenedRows.filter((row)=>row.props.UNSTABLE_childItems || row.props.children.length > collection.userColumnCount).map((row)=>row.key));
        updatedExpandedKeys.delete(key);
    } else {
        updatedExpandedKeys = new Set(currentExpandedKeys);
        if (updatedExpandedKeys.has(key)) updatedExpandedKeys.delete(key);
        else updatedExpandedKeys.add(key);
    }
    return updatedExpandedKeys;
}
function $2aff27f0c0f8339d$var$convertExpanded(expanded) {
    if (!expanded) return new Set();
    return expanded === 'all' ? 'all' : new Set(expanded);
}
function $2aff27f0c0f8339d$var$generateTreeGridCollection(nodes, opts) {
    let { expandedKeys: expandedKeys = new Set() } = opts;
    let body = null;
    let flattenedRows = [];
    let userColumnCount = 0;
    let originalColumns = [];
    let keyMap = new Map();
    let topLevelRows = [];
    let visit = (node)=>{
        switch(node.type){
            case 'body':
                body = node;
                keyMap.set(body.key, body);
                break;
            case 'column':
                if (!node.hasChildNodes) userColumnCount++;
                break;
            case 'item':
                topLevelRows.push(node);
                return;
        }
        for (let child of node.childNodes)visit(child);
    };
    for (let node of nodes){
        if (node.type === 'column') originalColumns.push(node);
        visit(node);
    }
    // Update each grid node in the treegrid table with values specific to a treegrid structure. Also store a set of flattened row nodes for TableCollection to consume
    let visitNode = (node)=>{
        if (node.type === 'item') flattenedRows.push(node);
        keyMap.set(node.key, node);
        for (let child of node.childNodes)if (!(child.type === 'item' && expandedKeys !== 'all' && !expandedKeys.has(node.key))) {
            if (child.type === 'item') visitNode(child);
            else // We enforce that the cells come before rows so can just reuse cell index
            visitNode(child);
        }
    };
    for (let node of topLevelRows)visitNode(node);
    return {
        keyMap: keyMap,
        userColumnCount: userColumnCount,
        flattenedRows: flattenedRows,
        tableNodes: [
            ...originalColumns,
            {
                ...body,
                childNodes: flattenedRows
            }
        ]
    };
}


export {$2aff27f0c0f8339d$export$34dfa8a1622185a4 as UNSTABLE_useTreeGridState};
//# sourceMappingURL=useTreeGridState.js.map
