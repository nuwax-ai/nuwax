import {getCellId as $5519a0a73876c3da$export$19baff3266315d44} from "./utils.js";
import {useGridCell as $9b19f290bcf2fee1$export$c7e10bfc0c59f67c} from "../grid/useGridCell.js";

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

function $019dcf7b6e339921$export$49571c903d73624c(props, state, ref) {
    var _props_node_column;
    let { gridCellProps: gridCellProps, isPressed: isPressed } = (0, $9b19f290bcf2fee1$export$c7e10bfc0c59f67c)(props, state, ref);
    let columnKey = (_props_node_column = props.node.column) === null || _props_node_column === void 0 ? void 0 : _props_node_column.key;
    if (columnKey != null && state.collection.rowHeaderColumnKeys.has(columnKey)) {
        gridCellProps.role = 'rowheader';
        gridCellProps.id = (0, $5519a0a73876c3da$export$19baff3266315d44)(state, props.node.parentKey, columnKey);
    }
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
    };
}


export {$019dcf7b6e339921$export$49571c903d73624c as useTableCell};
//# sourceMappingURL=useTableCell.js.map
