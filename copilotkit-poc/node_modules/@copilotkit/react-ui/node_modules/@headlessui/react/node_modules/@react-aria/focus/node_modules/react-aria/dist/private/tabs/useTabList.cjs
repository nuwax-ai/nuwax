var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $fe3ef331ec3a03dd$exports = require("./utils.cjs");
var $32378ba789af91c7$exports = require("./TabsKeyboardDelegate.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $df9ba3e9a7210056$exports = require("../selection/useSelectableCollection.cjs");
var $e9JUD$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTabList", function () { return $3128f4d6b201042d$export$773e389e644c5874; });
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







function $3128f4d6b201042d$export$773e389e644c5874(props, state, ref) {
    let { orientation: orientation = 'horizontal', keyboardActivation: keyboardActivation = 'automatic' } = props;
    let { collection: collection, selectionManager: manager, disabledKeys: disabledKeys } = state;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let delegate = (0, $e9JUD$react.useMemo)(()=>new (0, $32378ba789af91c7$exports.TabsKeyboardDelegate)(collection, direction, orientation, disabledKeys), [
        collection,
        disabledKeys,
        orientation,
        direction
    ]);
    let { collectionProps: collectionProps } = (0, $df9ba3e9a7210056$exports.useSelectableCollection)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        selectOnFocus: keyboardActivation === 'automatic',
        disallowEmptySelection: true,
        scrollRef: ref,
        linkBehavior: 'selection'
    });
    // Compute base id for all tabs
    let tabsId = (0, $7ac82d1fee77eb8a$exports.useId)();
    (0, $fe3ef331ec3a03dd$exports.tabsIds).set(state, tabsId);
    let tabListLabelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        ...props,
        id: tabsId
    });
    return {
        tabListProps: {
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(collectionProps, tabListLabelProps),
            role: 'tablist',
            'aria-orientation': orientation,
            tabIndex: undefined
        }
    };
}


//# sourceMappingURL=useTabList.cjs.map
