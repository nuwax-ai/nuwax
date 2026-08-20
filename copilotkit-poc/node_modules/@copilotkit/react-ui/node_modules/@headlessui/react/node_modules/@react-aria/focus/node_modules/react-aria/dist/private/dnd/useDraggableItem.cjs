var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $89d6f7d3313f2c1d$exports = require("./intlStrings.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $bc8c67c7657c5f5a$exports = require("./useDrag.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDraggableItem", function () { return $c75db37444fefb9a$export$b35afafff42da2d9; });
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




const $c75db37444fefb9a$var$MESSAGES = {
    keyboard: {
        selected: 'dragSelectedKeyboard',
        notSelected: 'dragDescriptionKeyboard'
    },
    touch: {
        selected: 'dragSelectedLongPress',
        notSelected: 'dragDescriptionLongPress'
    },
    virtual: {
        selected: 'dragDescriptionVirtual',
        notSelected: 'dragDescriptionVirtual'
    }
};
function $c75db37444fefb9a$export$b35afafff42da2d9(props, state) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($89d6f7d3313f2c1d$exports))), '@react-aria/dnd');
    let isDisabled = state.isDisabled || state.selectionManager.isDisabled(props.key);
    let { dragProps: dragProps, dragButtonProps: dragButtonProps } = (0, $bc8c67c7657c5f5a$exports.useDrag)({
        getItems () {
            return state.getItems(props.key);
        },
        preview: state.preview,
        getAllowedDropOperations: state.getAllowedDropOperations,
        hasDragButton: props.hasDragButton,
        onDragStart (e) {
            state.startDrag(props.key, e);
            // Track draggingKeys for useDroppableCollection's default onDrop handler and useDroppableCollectionState's default getDropOperation
            (0, $c67ff3d36836a1c1$exports.setDraggingKeys)(state.draggingKeys);
        },
        onDragMove (e) {
            state.moveDrag(e);
        },
        onDragEnd (e) {
            let { dropOperation: dropOperation } = e;
            let isInternal = dropOperation === 'cancel' ? false : (0, $c67ff3d36836a1c1$exports.isInternalDropOperation)();
            state.endDrag({
                ...e,
                keys: state.draggingKeys,
                isInternal: isInternal
            });
            (0, $c67ff3d36836a1c1$exports.clearGlobalDnDState)();
        }
    });
    let item = state.collection.getItem(props.key);
    let numKeysForDrag = state.getKeysForDrag(props.key).size;
    let isSelected = numKeysForDrag > 1 && state.selectionManager.isSelected(props.key);
    let dragButtonLabel;
    let description;
    // Override description to include selected item count.
    let modality = (0, $c67ff3d36836a1c1$exports.useDragModality)();
    if (!props.hasDragButton && state.selectionManager.selectionMode !== 'none') {
        let msg = $c75db37444fefb9a$var$MESSAGES[modality][isSelected ? 'selected' : 'notSelected'];
        if (props.hasAction && modality === 'keyboard') msg += 'Alt';
        if (isSelected) description = stringFormatter.format(msg, {
            count: numKeysForDrag
        });
        else description = stringFormatter.format(msg);
        // Remove the onClick handler from useDrag. Long pressing will be required on touch devices,
        // and NVDA/JAWS are always in forms mode within collection components.
        delete dragProps.onClick;
    } else if (isSelected) dragButtonLabel = stringFormatter.format('dragSelectedItems', {
        count: numKeysForDrag
    });
    else {
        let itemText = state.collection.getTextValue?.(props.key) ?? item?.textValue ?? '';
        dragButtonLabel = stringFormatter.format('dragItem', {
            itemText: itemText
        });
    }
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(description);
    if (description) Object.assign(dragProps, descriptionProps);
    if (!props.hasDragButton && props.hasAction) {
        let { onKeyDownCapture: onKeyDownCapture, onKeyUpCapture: onKeyUpCapture } = dragProps;
        if (modality === 'touch') // Remove long press description if an action is present, because in that case long pressing selects the item.
        delete dragProps['aria-describedby'];
        // Require Alt key if there is a conflicting action.
        dragProps.onKeyDownCapture = (e)=>{
            if (e.altKey) onKeyDownCapture?.(e);
        };
        dragProps.onKeyUpCapture = (e)=>{
            if (e.altKey) onKeyUpCapture?.(e);
        };
    }
    return {
        dragProps: isDisabled ? {} : dragProps,
        dragButtonProps: {
            ...dragButtonProps,
            isDisabled: isDisabled,
            'aria-label': dragButtonLabel
        }
    };
}


//# sourceMappingURL=useDraggableItem.cjs.map
