
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableHeaderRow", function () { return $93b395a0a8d531d0$export$1b95a7d2d517b841; });
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
 */ function $93b395a0a8d531d0$export$1b95a7d2d517b841(props, state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { node: node, isVirtualized: isVirtualized } = props;
    let rowProps = {
        role: 'row'
    };
    if (isVirtualized && state.treeColumn == null) rowProps['aria-rowindex'] = node.index + 1; // aria-rowindex is 1 based
    return {
        rowProps: rowProps
    };
}


//# sourceMappingURL=useTableHeaderRow.cjs.map
