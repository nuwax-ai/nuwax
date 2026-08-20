var $589a6443185dab0f$exports = require("./utils.cjs");
var $83fb058f79cd147c$exports = require("../grid/useGridCell.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableCell", function () { return $9d6b5486e0585f8a$export$49571c903d73624c; });
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

function $9d6b5486e0585f8a$export$49571c903d73624c(props, state, ref) {
    let { gridCellProps: gridCellProps, isPressed: isPressed } = (0, $83fb058f79cd147c$exports.useGridCell)(props, state, ref);
    let columnKey = props.node.column?.key;
    if (columnKey != null && state.collection.rowHeaderColumnKeys.has(columnKey)) {
        gridCellProps.role = 'rowheader';
        gridCellProps.id = (0, $589a6443185dab0f$exports.getCellId)(state, props.node.parentKey, columnKey);
    }
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
    };
}


//# sourceMappingURL=useTableCell.cjs.map
