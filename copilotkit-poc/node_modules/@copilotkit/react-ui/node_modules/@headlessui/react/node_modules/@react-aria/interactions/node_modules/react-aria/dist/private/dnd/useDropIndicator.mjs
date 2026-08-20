import {useDragSession as $99f1ee31a7e95d0e$export$418e185dd3f1b968} from "./DragManager.mjs";
import {getDroppableCollectionId as $d40e85a29b831dd6$export$3093291712f09a77} from "./utils.mjs";
import $hkYb1$intlStringsmjs from "./intlStrings.mjs";
import {useDroppableItem as $e312558a4ff8ca2a$export$f7b0c5d28b66b6a5} from "./useDroppableItem.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


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





function $931dca30b169ddce$export$8d0e41d2815afac5(props, state, ref) {
    let { target: target } = props;
    let { collection: collection } = state;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($hkYb1$intlStringsmjs))), '@react-aria/dnd');
    let dragSession = $99f1ee31a7e95d0e$export$418e185dd3f1b968();
    let { dropProps: dropProps } = (0, $e312558a4ff8ca2a$export$f7b0c5d28b66b6a5)(props, state, ref);
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    let getText = (key)=>{
        if (key == null) return '';
        else return collection.getTextValue?.(key) ?? collection.getItem(key)?.textValue ?? '';
    };
    let label = '';
    let labelledBy;
    if (target.type === 'root') {
        label = stringFormatter.format('dropOnRoot');
        labelledBy = `${id} ${(0, $d40e85a29b831dd6$export$3093291712f09a77)(state)}`;
    } else if (target.dropPosition === 'on') label = stringFormatter.format('dropOnItem', {
        itemText: getText(target.key)
    });
    else {
        let before;
        let after;
        if (target.dropPosition === 'before') {
            let prevKey = collection.getItem(target.key)?.prevKey;
            let prevNode = prevKey != null ? collection.getItem(prevKey) : null;
            before = prevNode?.type === 'item' ? prevNode.key : null;
        } else before = target.key;
        if (target.dropPosition === 'after') {
            let nextKey = collection.getItem(target.key)?.nextKey;
            let nextNode = nextKey != null ? collection.getItem(nextKey) : null;
            after = nextNode?.type === 'item' ? nextNode.key : null;
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


export {$931dca30b169ddce$export$8d0e41d2815afac5 as useDropIndicator};
//# sourceMappingURL=useDropIndicator.mjs.map
