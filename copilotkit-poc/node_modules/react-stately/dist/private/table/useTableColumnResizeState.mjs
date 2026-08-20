import {TableColumnLayout as $245263de035f5da5$export$7ff77a162970b30e} from "./TableColumnLayout.mjs";
import {useState as $iePE6$useState, useMemo as $iePE6$useMemo, useCallback as $iePE6$useCallback} from "react";

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

function $f6cebac1c03d2516$export$cb895dcf85db1319(props, state) {
    let { getDefaultWidth: getDefaultWidth, getDefaultMinWidth: getDefaultMinWidth, tableWidth: tableWidth = 0 } = props;
    let [resizingColumn, setResizingColumn] = (0, $iePE6$useState)(null);
    let columnLayout = (0, $iePE6$useMemo)(()=>new (0, $245263de035f5da5$export$7ff77a162970b30e)({
            getDefaultWidth: getDefaultWidth,
            getDefaultMinWidth: getDefaultMinWidth
        }), [
        getDefaultWidth,
        getDefaultMinWidth
    ]);
    let [controlledColumns, uncontrolledColumns] = (0, $iePE6$useMemo)(()=>columnLayout.splitColumnsIntoControlledAndUncontrolled(state.collection.columns), [
        state.collection.columns,
        columnLayout
    ]);
    // uncontrolled column widths
    let [uncontrolledWidths, setUncontrolledWidths] = (0, $iePE6$useState)(()=>columnLayout.getInitialUncontrolledWidths(uncontrolledColumns));
    // Update uncontrolled widths if the columns changed.
    let [lastColumns, setLastColumns] = (0, $iePE6$useState)(state.collection.columns);
    if (state.collection.columns !== lastColumns) {
        if (state.collection.columns.length !== lastColumns.length || state.collection.columns.some((c, i)=>c.key !== lastColumns[i].key)) {
            let newUncontrolledWidths = columnLayout.getInitialUncontrolledWidths(uncontrolledColumns);
            setUncontrolledWidths(newUncontrolledWidths);
        }
        setLastColumns(state.collection.columns);
    }
    // combine columns back into one map that maintains same order as the columns
    let colWidths = (0, $iePE6$useMemo)(()=>columnLayout.recombineColumns(state.collection.columns, uncontrolledWidths, uncontrolledColumns, controlledColumns), [
        state.collection.columns,
        uncontrolledWidths,
        uncontrolledColumns,
        controlledColumns,
        columnLayout
    ]);
    let startResize = (0, $iePE6$useCallback)((key)=>{
        setResizingColumn(key);
    }, [
        setResizingColumn
    ]);
    let updateResizedColumns = (0, $iePE6$useCallback)((key, width)=>{
        let newSizes = columnLayout.resizeColumnWidth(state.collection, uncontrolledWidths, key, width);
        let map = new Map(Array.from(uncontrolledColumns).map(([key])=>[
                key,
                newSizes.get(key)
            ]));
        map.set(key, width);
        setUncontrolledWidths(map);
        return newSizes;
    }, [
        uncontrolledColumns,
        setUncontrolledWidths,
        columnLayout,
        state.collection,
        uncontrolledWidths
    ]);
    let endResize = (0, $iePE6$useCallback)(()=>{
        setResizingColumn(null);
    }, [
        setResizingColumn
    ]);
    let columnWidths = (0, $iePE6$useMemo)(()=>columnLayout.buildColumnWidths(tableWidth, state.collection, colWidths), [
        tableWidth,
        state.collection,
        colWidths,
        columnLayout
    ]);
    return (0, $iePE6$useMemo)(()=>({
            resizingColumn: resizingColumn,
            updateResizedColumns: updateResizedColumns,
            startResize: startResize,
            endResize: endResize,
            getColumnWidth: (key)=>columnLayout.getColumnWidth(key),
            getColumnMinWidth: (key)=>columnLayout.getColumnMinWidth(key),
            getColumnMaxWidth: (key)=>columnLayout.getColumnMaxWidth(key),
            tableState: state,
            columnWidths: columnWidths
        }), [
        columnLayout,
        columnWidths,
        resizingColumn,
        updateResizedColumns,
        startResize,
        endResize,
        state
    ]);
}


export {$f6cebac1c03d2516$export$cb895dcf85db1319 as useTableColumnResizeState};
//# sourceMappingURL=useTableColumnResizeState.mjs.map
