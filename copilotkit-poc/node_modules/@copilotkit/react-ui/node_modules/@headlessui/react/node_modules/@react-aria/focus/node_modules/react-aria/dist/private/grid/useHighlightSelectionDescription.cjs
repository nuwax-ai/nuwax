var $88d878ce22ac7f67$exports = require("./intlStrings.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $1RmMN$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useHighlightSelectionDescription", function () { return $50ae4f70f9b3767e$export$be42ebdab07ae4c2; });
/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $50ae4f70f9b3767e$export$be42ebdab07ae4c2(props) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($88d878ce22ac7f67$exports))), '@react-aria/grid');
    let modality = (0, $d0df89f3abe2c2ca$exports.useInteractionModality)();
    // null is the default if the user hasn't interacted with the table at all yet or the rest of the page
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    let interactionDescription = (0, $1RmMN$react.useMemo)(()=>{
        let selectionMode = props.selectionManager.selectionMode;
        let selectionBehavior = props.selectionManager.selectionBehavior;
        let message;
        if (shouldLongPress) message = stringFormatter.format('longPressToSelect');
        return selectionBehavior === 'replace' && selectionMode !== 'none' && props.hasItemActions ? message : undefined;
    }, [
        props.selectionManager.selectionMode,
        props.selectionManager.selectionBehavior,
        props.hasItemActions,
        stringFormatter,
        shouldLongPress
    ]);
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(interactionDescription);
    return descriptionProps;
}


//# sourceMappingURL=useHighlightSelectionDescription.cjs.map
