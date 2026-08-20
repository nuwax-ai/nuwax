import {getCellId as $cf56c58f505db99a$export$19baff3266315d44} from "./utils.mjs";
import {useGridCell as $a4d729ad50b8576a$export$c7e10bfc0c59f67c} from "../grid/useGridCell.mjs";

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

function $059e6e023d86289a$export$49571c903d73624c(props, state, ref) {
    let { gridCellProps: gridCellProps, isPressed: isPressed } = (0, $a4d729ad50b8576a$export$c7e10bfc0c59f67c)(props, state, ref);
    let columnKey = props.node.column?.key;
    if (columnKey != null && state.collection.rowHeaderColumnKeys.has(columnKey)) {
        gridCellProps.role = 'rowheader';
        gridCellProps.id = (0, $cf56c58f505db99a$export$19baff3266315d44)(state, props.node.parentKey, columnKey);
    }
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
    };
}


export {$059e6e023d86289a$export$49571c903d73624c as useTableCell};
//# sourceMappingURL=useTableCell.mjs.map
