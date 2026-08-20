import $9MBDy$intlStringsjs from "./intlStrings.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useInteractionModality as $b50b1cc8a843ace7$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useMemo as $9MBDy$useMemo} from "react";


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




function $344ec8680cac6ab0$export$be42ebdab07ae4c2(props) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($9MBDy$intlStringsjs))), '@react-aria/grid');
    let modality = (0, $b50b1cc8a843ace7$export$98e20ec92f614cfe)();
    // null is the default if the user hasn't interacted with the table at all yet or the rest of the page
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    let interactionDescription = (0, $9MBDy$useMemo)(()=>{
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
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(interactionDescription);
    return descriptionProps;
}


export {$344ec8680cac6ab0$export$be42ebdab07ae4c2 as useHighlightSelectionDescription};
//# sourceMappingURL=useHighlightSelectionDescription.js.map
