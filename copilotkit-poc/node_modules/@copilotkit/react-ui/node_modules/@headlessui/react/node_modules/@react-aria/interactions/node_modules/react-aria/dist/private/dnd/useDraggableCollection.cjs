var $c67ff3d36836a1c1$exports = require("./utils.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDraggableCollection", function () { return $484f8680df3d5e38$export$2962a7984b2f0a80; });
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
function $484f8680df3d5e38$export$2962a7984b2f0a80(props, state, ref) {
    // Update global DnD state if this keys within this collection are dragged
    let { draggingCollectionRef: draggingCollectionRef } = (0, $c67ff3d36836a1c1$exports.globalDndState);
    if (state.draggingKeys.size > 0 && draggingCollectionRef?.current !== ref.current) (0, $c67ff3d36836a1c1$exports.setDraggingCollectionRef)(ref);
}


//# sourceMappingURL=useDraggableCollection.cjs.map
