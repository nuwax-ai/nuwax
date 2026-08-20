var $7394b2797bc2343d$exports = require("./DragManager.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $b0c8843205a339ea$exports = require("./useVirtualDrop.cjs");
var $lWgGG$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDroppableItem", function () { return $1e739f154fc7e030$export$f7b0c5d28b66b6a5; });
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



function $1e739f154fc7e030$export$f7b0c5d28b66b6a5(options, state, ref) {
    let { dropProps: dropProps } = (0, $b0c8843205a339ea$exports.useVirtualDrop)();
    let droppableCollectionRef = (0, $c67ff3d36836a1c1$exports.getDroppableCollectionRef)(state);
    (0, $lWgGG$react.useEffect)(()=>{
        if (ref.current) return $7394b2797bc2343d$exports.registerDropItem({
            element: ref.current,
            target: options.target,
            getDropOperation (types, allowedOperations) {
                let { draggingKeys: draggingKeys } = (0, $c67ff3d36836a1c1$exports.globalDndState);
                let isInternal = (0, $c67ff3d36836a1c1$exports.isInternalDropOperation)(droppableCollectionRef);
                return state.getDropOperation({
                    target: options.target,
                    types: types,
                    allowedOperations: allowedOperations,
                    isInternal: isInternal,
                    draggingKeys: draggingKeys
                });
            },
            activateButtonRef: options.activateButtonRef
        });
    }, [
        ref,
        options.target,
        state,
        droppableCollectionRef,
        options.activateButtonRef
    ]);
    let dragSession = $7394b2797bc2343d$exports.useDragSession();
    let { draggingKeys: draggingKeys } = (0, $c67ff3d36836a1c1$exports.globalDndState);
    let isInternal = (0, $c67ff3d36836a1c1$exports.isInternalDropOperation)(droppableCollectionRef);
    let isValidDropTarget = dragSession && state.getDropOperation({
        target: options.target,
        types: (0, $c67ff3d36836a1c1$exports.getTypes)(dragSession.dragTarget.items),
        allowedOperations: dragSession.dragTarget.allowedDropOperations,
        isInternal: isInternal,
        draggingKeys: draggingKeys
    }) !== 'cancel';
    let isDropTarget = state.isDropTarget(options.target);
    (0, $lWgGG$react.useEffect)(()=>{
        if (dragSession && isDropTarget && ref.current) ref.current.focus();
    }, [
        isDropTarget,
        dragSession,
        ref
    ]);
    return {
        dropProps: {
            ...dropProps,
            'aria-hidden': !dragSession || isValidDropTarget ? undefined : 'true'
        },
        isDropTarget: isDropTarget
    };
}


//# sourceMappingURL=useDroppableItem.cjs.map
