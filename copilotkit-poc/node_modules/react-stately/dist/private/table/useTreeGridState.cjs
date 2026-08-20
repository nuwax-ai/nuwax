var $6caebf02f33d362d$exports = require("../collections/CollectionBuilder.cjs");
var $685d31b0941c7944$exports = require("./TableCollection.cjs");
var $f85d47e8d0aa7735$exports = require("../flags/flags.cjs");
var $7e461d6cedc2cde6$exports = require("./useTableState.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $2v1PN$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "UNSTABLE_useTreeGridState", function () { return $1060e28c68d8ec75$export$34dfa8a1622185a4; });
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





function $1060e28c68d8ec75$export$34dfa8a1622185a4(props) {
    let { selectionMode: selectionMode = 'none', showSelectionCheckboxes: showSelectionCheckboxes, showDragButtons: showDragButtons, UNSTABLE_expandedKeys: propExpandedKeys, UNSTABLE_defaultExpandedKeys: propDefaultExpandedKeys, UNSTABLE_onExpandedChange: UNSTABLE_onExpandedChange, children: children } = props;
    if (!(0, $f85d47e8d0aa7735$exports.tableNestedRows)()) throw new Error('Feature flag for table nested rows must be enabled to use useTreeGridState.');
    let [expandedKeys, setExpandedKeys] = (0, $14cedf286405cc4b$exports.useControlledState)(propExpandedKeys ? $1060e28c68d8ec75$var$convertExpanded(propExpandedKeys) : undefined, propDefaultExpandedKeys ? $1060e28c68d8ec75$var$convertExpanded(propDefaultExpandedKeys) : new Set(), UNSTABLE_onExpandedChange);
    let context = (0, $2v1PN$react.useMemo)(()=>({
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
    let builder = (0, $2v1PN$react.useMemo)(()=>new (0, $6caebf02f33d362d$exports.CollectionBuilder)(), []);
    let nodes = (0, $2v1PN$react.useMemo)(()=>builder.build({
            children: children
        }, context), [
        builder,
        children,
        context
    ]);
    let treeGridCollection = (0, $2v1PN$react.useMemo)(()=>{
        return $1060e28c68d8ec75$var$generateTreeGridCollection(nodes, {
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
        setExpandedKeys($1060e28c68d8ec75$var$toggleKey(expandedKeys, key, treeGridCollection));
    };
    let collection = (0, $2v1PN$react.useMemo)(()=>{
        return new (0, $685d31b0941c7944$exports.TableCollection)(treeGridCollection.tableNodes, null, context);
    }, [
        context,
        treeGridCollection.tableNodes
    ]);
    let tableState = (0, $7e461d6cedc2cde6$exports.useTableState)({
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
function $1060e28c68d8ec75$var$toggleKey(currentExpandedKeys, key, collection) {
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
function $1060e28c68d8ec75$var$convertExpanded(expanded) {
    if (!expanded) return new Set();
    return expanded === 'all' ? 'all' : new Set(expanded);
}
function $1060e28c68d8ec75$var$generateTreeGridCollection(nodes, opts) {
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


//# sourceMappingURL=useTreeGridState.cjs.map
