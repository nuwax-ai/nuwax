import {globalDndState as $a279fa400589a731$export$6ca6700462636d0b, setDraggingCollectionRef as $a279fa400589a731$export$f2be18a910c0caa6} from "./utils.js";

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
function $c249c868bdb1a8e8$export$2962a7984b2f0a80(props, state, ref) {
    // Update global DnD state if this keys within this collection are dragged
    let { draggingCollectionRef: draggingCollectionRef } = (0, $a279fa400589a731$export$6ca6700462636d0b);
    if (state.draggingKeys.size > 0 && (draggingCollectionRef === null || draggingCollectionRef === void 0 ? void 0 : draggingCollectionRef.current) !== ref.current) (0, $a279fa400589a731$export$f2be18a910c0caa6)(ref);
}


export {$c249c868bdb1a8e8$export$2962a7984b2f0a80 as useDraggableCollection};
//# sourceMappingURL=useDraggableCollection.js.map
