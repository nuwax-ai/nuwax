import {useDragSession as $e1cd17e16f360ff6$export$418e185dd3f1b968} from "./DragManager.js";
import {getDroppableCollectionId as $a279fa400589a731$export$3093291712f09a77} from "./utils.js";
import $iiCXE$intlStringsjs from "./intlStrings.js";
import {useDroppableItem as $65e6f1542b1d98c7$export$f7b0c5d28b66b6a5} from "./useDroppableItem.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
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





function $db5a12b9efa43d23$export$8d0e41d2815afac5(props, state, ref) {
    let { target: target } = props;
    let { collection: collection } = state;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($iiCXE$intlStringsjs))), '@react-aria/dnd');
    let dragSession = $e1cd17e16f360ff6$export$418e185dd3f1b968();
    let { dropProps: dropProps } = (0, $65e6f1542b1d98c7$export$f7b0c5d28b66b6a5)(props, state, ref);
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let getText = (key)=>{
        var _collection_getTextValue, _collection_getItem;
        var _collection_getTextValue1, _ref;
        if (key == null) return '';
        else return (_ref = (_collection_getTextValue1 = (_collection_getTextValue = collection.getTextValue) === null || _collection_getTextValue === void 0 ? void 0 : _collection_getTextValue.call(collection, key)) !== null && _collection_getTextValue1 !== void 0 ? _collection_getTextValue1 : (_collection_getItem = collection.getItem(key)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _ref !== void 0 ? _ref : '';
    };
    let label = '';
    let labelledBy;
    if (target.type === 'root') {
        label = stringFormatter.format('dropOnRoot');
        labelledBy = `${id} ${(0, $a279fa400589a731$export$3093291712f09a77)(state)}`;
    } else if (target.dropPosition === 'on') label = stringFormatter.format('dropOnItem', {
        itemText: getText(target.key)
    });
    else {
        let before;
        let after;
        if (target.dropPosition === 'before') {
            var _collection_getItem;
            let prevKey = (_collection_getItem = collection.getItem(target.key)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.prevKey;
            let prevNode = prevKey != null ? collection.getItem(prevKey) : null;
            before = (prevNode === null || prevNode === void 0 ? void 0 : prevNode.type) === 'item' ? prevNode.key : null;
        } else before = target.key;
        if (target.dropPosition === 'after') {
            var _collection_getItem1;
            let nextKey = (_collection_getItem1 = collection.getItem(target.key)) === null || _collection_getItem1 === void 0 ? void 0 : _collection_getItem1.nextKey;
            let nextNode = nextKey != null ? collection.getItem(nextKey) : null;
            after = (nextNode === null || nextNode === void 0 ? void 0 : nextNode.type) === 'item' ? nextNode.key : null;
        } else after = target.key;
        if (before != null && after != null) label = stringFormatter.format('insertBetween', {
            beforeItemText: getText(before),
            afterItemText: getText(after)
        });
        else if (before != null) label = stringFormatter.format('insertAfter', {
            itemText: getText(before)
        });
        else if (after != null) label = stringFormatter.format('insertBefore', {
            itemText: getText(after)
        });
    }
    let isDropTarget = state.isDropTarget(target);
    let ariaHidden = !dragSession ? 'true' : dropProps['aria-hidden'];
    return {
        dropIndicatorProps: {
            ...dropProps,
            id: id,
            'aria-roledescription': stringFormatter.format('dropIndicator'),
            'aria-label': label,
            'aria-labelledby': labelledBy,
            'aria-hidden': ariaHidden,
            tabIndex: -1
        },
        isDropTarget: isDropTarget,
        // If aria-hidden, we are either not in a drag session or the drop target is invalid.
        // In that case, there's no need to render anything at all unless we need to show the indicator visually.
        // This can happen when dragging using the native DnD API as opposed to keyboard dragging.
        isHidden: !isDropTarget && !!ariaHidden
    };
}


export {$db5a12b9efa43d23$export$8d0e41d2815afac5 as useDropIndicator};
//# sourceMappingURL=useDropIndicator.js.map
