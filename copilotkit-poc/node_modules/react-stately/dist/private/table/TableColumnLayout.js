import {calculateColumnSizes as $2f907784468a29c9$export$55d50dc687385491, getMaxWidth as $2f907784468a29c9$export$59185c62a7544aa0, getMinWidth as $2f907784468a29c9$export$f556054ce4358701} from "./TableUtils.js";

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
class $d8d90d87f6c1ba2c$export$7ff77a162970b30e {
    /**
   * Takes an array of columns and splits it into 2 maps of columns with controlled and columns with
   * uncontrolled widths.
   */ splitColumnsIntoControlledAndUncontrolled(columns) {
        return columns.reduce((acc, col)=>{
            if (col.props.width != null) acc[0].set(col.key, col);
            else acc[1].set(col.key, col);
            return acc;
        }, [
            new Map(),
            new Map()
        ]);
    }
    /** Takes uncontrolled and controlled widths and joins them into a single Map. */ recombineColumns(columns, uncontrolledWidths, uncontrolledColumns, controlledColumns) {
        return new Map(columns.map((col)=>{
            if (uncontrolledColumns.has(col.key)) return [
                col.key,
                uncontrolledWidths.get(col.key)
            ];
            else return [
                col.key,
                controlledColumns.get(col.key).props.width
            ];
        }));
    }
    /** Used to make an initial Map of the uncontrolled widths based on default widths. */ getInitialUncontrolledWidths(uncontrolledColumns) {
        return new Map(Array.from(uncontrolledColumns).map(([key, col])=>{
            var _this_getDefaultWidth, _this;
            var _col_props_defaultWidth, _ref;
            return [
                key,
                (_ref = (_col_props_defaultWidth = col.props.defaultWidth) !== null && _col_props_defaultWidth !== void 0 ? _col_props_defaultWidth : (_this_getDefaultWidth = (_this = this).getDefaultWidth) === null || _this_getDefaultWidth === void 0 ? void 0 : _this_getDefaultWidth.call(_this, col)) !== null && _ref !== void 0 ? _ref : '1fr'
            ];
        }));
    }
    getColumnWidth(key) {
        var _this_columnWidths_get;
        return (_this_columnWidths_get = this.columnWidths.get(key)) !== null && _this_columnWidths_get !== void 0 ? _this_columnWidths_get : 0;
    }
    getColumnMinWidth(key) {
        var _this_columnMinWidths_get;
        return (_this_columnMinWidths_get = this.columnMinWidths.get(key)) !== null && _this_columnMinWidths_get !== void 0 ? _this_columnMinWidths_get : 0;
    }
    getColumnMaxWidth(key) {
        var _this_columnMaxWidths_get;
        return (_this_columnMaxWidths_get = this.columnMaxWidths.get(key)) !== null && _this_columnMaxWidths_get !== void 0 ? _this_columnMaxWidths_get : 0;
    }
    resizeColumnWidth(collection, uncontrolledWidths, col, width) {
        let prevColumnWidths = this.columnWidths;
        let freeze = true;
        let newWidths = new Map();
        width = Math.max(this.getColumnMinWidth(col), Math.min(this.getColumnMaxWidth(col), Math.floor(width)));
        collection.columns.forEach((column)=>{
            var _prevColumnWidths_get, _column_props_width;
            if (column.key === col) {
                newWidths.set(column.key, width);
                freeze = false;
            } else if (freeze) // freeze columns to the left to their previous pixel value
            newWidths.set(column.key, (_prevColumnWidths_get = prevColumnWidths.get(column.key)) !== null && _prevColumnWidths_get !== void 0 ? _prevColumnWidths_get : 0);
            else newWidths.set(column.key, (_column_props_width = column.props.width) !== null && _column_props_width !== void 0 ? _column_props_width : uncontrolledWidths.get(column.key));
        });
        return newWidths;
    }
    buildColumnWidths(tableWidth, collection, widths) {
        this.columnWidths = new Map();
        this.columnMinWidths = new Map();
        this.columnMaxWidths = new Map();
        // initial layout or table/window resizing
        let columnWidths = (0, $2f907784468a29c9$export$55d50dc687385491)(tableWidth, collection.columns.map((col)=>({
                ...col.props,
                key: col.key
            })), widths, (i)=>this.getDefaultWidth(collection.columns[i]), (i)=>this.getDefaultMinWidth(collection.columns[i]));
        // columns going in will be the same order as the columns coming out
        columnWidths.forEach((width, index)=>{
            let key = collection.columns[index].key;
            let column = collection.columns[index];
            this.columnWidths.set(key, width);
            var _column_props_minWidth;
            this.columnMinWidths.set(key, (0, $2f907784468a29c9$export$f556054ce4358701)((_column_props_minWidth = column.props.minWidth) !== null && _column_props_minWidth !== void 0 ? _column_props_minWidth : this.getDefaultMinWidth(column), tableWidth));
            this.columnMaxWidths.set(key, (0, $2f907784468a29c9$export$59185c62a7544aa0)(column.props.maxWidth, tableWidth));
        });
        return this.columnWidths;
    }
    constructor(options){
        this.columnWidths = new Map();
        this.columnMinWidths = new Map();
        this.columnMaxWidths = new Map();
        var _options_getDefaultWidth;
        this.getDefaultWidth = (_options_getDefaultWidth = options === null || options === void 0 ? void 0 : options.getDefaultWidth) !== null && _options_getDefaultWidth !== void 0 ? _options_getDefaultWidth : ()=>'1fr';
        var _options_getDefaultMinWidth;
        this.getDefaultMinWidth = (_options_getDefaultMinWidth = options === null || options === void 0 ? void 0 : options.getDefaultMinWidth) !== null && _options_getDefaultMinWidth !== void 0 ? _options_getDefaultMinWidth : ()=>75;
    }
}


export {$d8d90d87f6c1ba2c$export$7ff77a162970b30e as TableColumnLayout};
//# sourceMappingURL=TableColumnLayout.js.map
