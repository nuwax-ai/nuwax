var $7394b2797bc2343d$exports = require("./DragManager.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $89d6f7d3313f2c1d$exports = require("./intlStrings.cjs");
var $1e739f154fc7e030$exports = require("./useDroppableItem.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDropIndicator", function () { return $63ee17a0fc28ced0$export$8d0e41d2815afac5; });
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





function $63ee17a0fc28ced0$export$8d0e41d2815afac5(props, state, ref) {
    let { target: target } = props;
    let { collection: collection } = state;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($89d6f7d3313f2c1d$exports))), '@react-aria/dnd');
    let dragSession = $7394b2797bc2343d$exports.useDragSession();
    let { dropProps: dropProps } = (0, $1e739f154fc7e030$exports.useDroppableItem)(props, state, ref);
    let id = (0, $7ac82d1fee77eb8a$exports.useId)();
    let getText = (key)=>{
        if (key == null) return '';
        else return collection.getTextValue?.(key) ?? collection.getItem(key)?.textValue ?? '';
    };
    let label = '';
    let labelledBy;
    if (target.type === 'root') {
        label = stringFormatter.format('dropOnRoot');
        labelledBy = `${id} ${(0, $c67ff3d36836a1c1$exports.getDroppableCollectionId)(state)}`;
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


//# sourceMappingURL=useDropIndicator.cjs.map
