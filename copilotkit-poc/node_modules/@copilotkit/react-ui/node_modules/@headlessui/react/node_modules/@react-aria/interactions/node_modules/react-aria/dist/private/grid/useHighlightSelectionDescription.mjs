import $cK8Ie$intlStringsmjs from "./intlStrings.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useInteractionModality as $8f5a2122b0992be3$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMemo as $cK8Ie$useMemo} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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




function $40ae3c60ef0e2e61$export$be42ebdab07ae4c2(props) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($cK8Ie$intlStringsmjs))), '@react-aria/grid');
    let modality = (0, $8f5a2122b0992be3$export$98e20ec92f614cfe)();
    // null is the default if the user hasn't interacted with the table at all yet or the rest of the page
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    let interactionDescription = (0, $cK8Ie$useMemo)(()=>{
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
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(interactionDescription);
    return descriptionProps;
}


export {$40ae3c60ef0e2e61$export$be42ebdab07ae4c2 as useHighlightSelectionDescription};
//# sourceMappingURL=useHighlightSelectionDescription.mjs.map
