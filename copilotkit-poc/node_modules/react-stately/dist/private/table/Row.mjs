import $hGOrh$react from "react";

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function $6d3258838ae978da$var$Row(props) {
    return null;
}
$6d3258838ae978da$var$Row.getCollectionNode = function* getCollectionNode(props, context) {
    let { children: children, textValue: textValue, UNSTABLE_childItems: UNSTABLE_childItems } = props;
    yield {
        type: 'item',
        props: props,
        textValue: textValue,
        'aria-label': props['aria-label'],
        hasChildNodes: true,
        *childNodes () {
            // Process cells first
            if (context.showDragButtons) yield {
                type: 'cell',
                key: 'header-drag',
                props: {
                    isDragButtonCell: true
                }
            };
            if (context.showSelectionCheckboxes && context.selectionMode !== 'none') yield {
                type: 'cell',
                key: 'header',
                props: {
                    isSelectionCell: true
                }
            };
            if (typeof children === 'function') {
                for (let column of context.columns)yield {
                    type: 'cell',
                    element: children(column.key),
                    key: column.key // this is combined with the row key by CollectionBuilder
                };
                if (UNSTABLE_childItems) for (let child of UNSTABLE_childItems)// Note: in order to reuse the render function of TableBody for our child rows, we just need to yield a type and a value here. CollectionBuilder will then look up
                // the parent renderer and use that to build the full node of this child row, using the value provided here to generate the cells
                yield {
                    type: 'item',
                    value: child
                };
            } else {
                let cells = [];
                let childRows = [];
                let columnCount = 0;
                (0, $hGOrh$react).Children.forEach(children, (node)=>{
                    if (node.type === $6d3258838ae978da$var$Row) {
                        if (cells.length < context.columns.length) throw new Error("All of a Row's child Cells must be positioned before any child Rows.");
                        childRows.push({
                            type: 'item',
                            element: node
                        });
                    } else {
                        cells.push({
                            type: 'cell',
                            element: node
                        });
                        columnCount += node.props.colSpan ?? 1;
                    }
                });
                if (columnCount !== context.columns.length) throw new Error(`Cell count must match column count. Found ${columnCount} cells and ${context.columns.length} columns.`);
                yield* cells;
                yield* childRows;
            }
        },
        shouldInvalidate (newContext) {
            // Invalidate all rows if the columns changed.
            return newContext.columns.length !== context.columns.length || newContext.columns.some((c, i)=>c.key !== context.columns[i].key) || newContext.showSelectionCheckboxes !== context.showSelectionCheckboxes || newContext.showDragButtons !== context.showDragButtons || newContext.selectionMode !== context.selectionMode;
        }
    };
};
/**
 * A Row represents a single item in a Table and contains Cell elements for each column.
 * Cells can be statically defined as children, or generated dynamically using a function
 * based on the columns defined in the TableHeader.
 */ // We don't want getCollectionNode to show up in the type definition
let $6d3258838ae978da$export$b59bdbef9ce70de2 = $6d3258838ae978da$var$Row;


export {$6d3258838ae978da$export$b59bdbef9ce70de2 as Row};
//# sourceMappingURL=Row.mjs.map
