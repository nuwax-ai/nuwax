import {CollectionBuilder as $bda7a7e55e1ff206$export$bf788dd355e3a401} from "../collections/CollectionBuilder.mjs";
import {TableCollection as $3b14a8cc70843920$export$596e1b2e2cf93690} from "./TableCollection.mjs";
import {tableNestedRows as $6a20a7989e6c817a$export$1b00cb14a96194e6} from "../flags/flags.mjs";
import {useTableState as $178a7f94e1b4b497$export$907bcc6c48325fd6} from "./useTableState.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useMemo as $8GADe$useMemo} from "react";

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





function $bf8c7a8ecaa85394$export$34dfa8a1622185a4(props) {
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, UNSTABLE_expandedKeys: propExpandedKeys, UNSTABLE_defaultExpandedKeys: propDefaultExpandedKeys, UNSTABLE_onExpandedChange: UNSTABLE_onExpandedChange, children: children } = props;
    if (!(0, $6a20a7989e6c817a$export$1b00cb14a96194e6)()) throw new Error('Feature flag for table nested rows must be enabled to use useTreeGridState.');
    let [expandedKeys, setExpandedKeys] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(propExpandedKeys ? $bf8c7a8ecaa85394$var$convertExpanded(propExpandedKeys) : undefined, propDefaultExpandedKeys ? $bf8c7a8ecaa85394$var$convertExpanded(propDefaultExpandedKeys) : new Set(), UNSTABLE_onExpandedChange);
    let context = (0, $8GADe$useMemo)(()=>({
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
    let builder = (0, $8GADe$useMemo)(()=>new (0, $bda7a7e55e1ff206$export$bf788dd355e3a401)(), []);
    let nodes = (0, $8GADe$useMemo)(()=>builder.build({
            children: children
        }, context), [
        builder,
        children,
        context
    ]);
    let treeGridCollection = (0, $8GADe$useMemo)(()=>{
        return $bf8c7a8ecaa85394$var$generateTreeGridCollection(nodes, {
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
        setExpandedKeys($bf8c7a8ecaa85394$var$toggleKey(expandedKeys, key, treeGridCollection));
    };
    let collection = (0, $8GADe$useMemo)(()=>{
        return new (0, $3b14a8cc70843920$export$596e1b2e2cf93690)(treeGridCollection.tableNodes, null, context);
    }, [
        context,
        treeGridCollection.tableNodes
    ]);
    let tableState = (0, $178a7f94e1b4b497$export$907bcc6c48325fd6)({
        ...props,
        collection: collection
    });
    return {
        ...tableState,
        keyMap: treeGridCollection.keyMap,
        userColumnCount: treeGridCollection.userColumnCount,
        expandedKeys: expandedKeys,
        toggleKey: onToggle,
        treeColumn: tableState.treeColumn ?? collection.rowHeaderColumnKeys.keys().next().value ?? null
    };
}
function $bf8c7a8ecaa85394$var$toggleKey(currentExpandedKeys, key, collection) {
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
function $bf8c7a8ecaa85394$var$convertExpanded(expanded) {
    if (!expanded) return new Set();
    return expanded === 'all' ? 'all' : new Set(expanded);
}
function $bf8c7a8ecaa85394$var$generateTreeGridCollection(nodes, opts) {
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


export {$bf8c7a8ecaa85394$export$34dfa8a1622185a4 as UNSTABLE_useTreeGridState};
//# sourceMappingURL=useTreeGridState.mjs.map
