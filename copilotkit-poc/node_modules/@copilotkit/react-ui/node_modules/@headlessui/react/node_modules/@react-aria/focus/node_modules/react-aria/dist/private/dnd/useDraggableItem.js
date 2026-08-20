import {clearGlobalDnDState as $a279fa400589a731$export$70936501603e6c57, isInternalDropOperation as $a279fa400589a731$export$78bf638634500fa5, setDraggingKeys as $a279fa400589a731$export$72cb63bdda528276, useDragModality as $a279fa400589a731$export$49bac5d6d4b352ea} from "./utils.js";
import $kLg95$intlStringsjs from "./intlStrings.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useDrag as $220be66a19152688$export$7941f8aafa4b6021} from "./useDrag.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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




const $f5b70f04c9a32cb5$var$MESSAGES = {
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
function $f5b70f04c9a32cb5$export$b35afafff42da2d9(props, state) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($kLg95$intlStringsjs))), '@react-aria/dnd');
    let isDisabled = state.isDisabled || state.selectionManager.isDisabled(props.key);
    let { dragProps: dragProps, dragButtonProps: dragButtonProps } = (0, $220be66a19152688$export$7941f8aafa4b6021)({
        getItems () {
            return state.getItems(props.key);
        },
        preview: state.preview,
        getAllowedDropOperations: state.getAllowedDropOperations,
        hasDragButton: props.hasDragButton,
        onDragStart (e) {
            state.startDrag(props.key, e);
            // Track draggingKeys for useDroppableCollection's default onDrop handler and useDroppableCollectionState's default getDropOperation
            (0, $a279fa400589a731$export$72cb63bdda528276)(state.draggingKeys);
        },
        onDragMove (e) {
            state.moveDrag(e);
        },
        onDragEnd (e) {
            let { dropOperation: dropOperation } = e;
            let isInternal = dropOperation === 'cancel' ? false : (0, $a279fa400589a731$export$78bf638634500fa5)();
            state.endDrag({
                ...e,
                keys: state.draggingKeys,
                isInternal: isInternal
            });
            (0, $a279fa400589a731$export$70936501603e6c57)();
        }
    });
    let item = state.collection.getItem(props.key);
    let numKeysForDrag = state.getKeysForDrag(props.key).size;
    let isSelected = numKeysForDrag > 1 && state.selectionManager.isSelected(props.key);
    let dragButtonLabel;
    let description;
    // Override description to include selected item count.
    let modality = (0, $a279fa400589a731$export$49bac5d6d4b352ea)();
    if (!props.hasDragButton && state.selectionManager.selectionMode !== 'none') {
        let msg = $f5b70f04c9a32cb5$var$MESSAGES[modality][isSelected ? 'selected' : 'notSelected'];
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
        var _state_collection_getTextValue, _state_collection;
        var _state_collection_getTextValue1, _ref;
        let itemText = (_ref = (_state_collection_getTextValue1 = (_state_collection_getTextValue = (_state_collection = state.collection).getTextValue) === null || _state_collection_getTextValue === void 0 ? void 0 : _state_collection_getTextValue.call(_state_collection, props.key)) !== null && _state_collection_getTextValue1 !== void 0 ? _state_collection_getTextValue1 : item === null || item === void 0 ? void 0 : item.textValue) !== null && _ref !== void 0 ? _ref : '';
        dragButtonLabel = stringFormatter.format('dragItem', {
            itemText: itemText
        });
    }
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    if (description) Object.assign(dragProps, descriptionProps);
    if (!props.hasDragButton && props.hasAction) {
        let { onKeyDownCapture: onKeyDownCapture, onKeyUpCapture: onKeyUpCapture } = dragProps;
        if (modality === 'touch') // Remove long press description if an action is present, because in that case long pressing selects the item.
        delete dragProps['aria-describedby'];
        // Require Alt key if there is a conflicting action.
        dragProps.onKeyDownCapture = (e)=>{
            if (e.altKey) onKeyDownCapture === null || onKeyDownCapture === void 0 ? void 0 : onKeyDownCapture(e);
        };
        dragProps.onKeyUpCapture = (e)=>{
            if (e.altKey) onKeyUpCapture === null || onKeyUpCapture === void 0 ? void 0 : onKeyUpCapture(e);
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


export {$f5b70f04c9a32cb5$export$b35afafff42da2d9 as useDraggableItem};
//# sourceMappingURL=useDraggableItem.js.map
