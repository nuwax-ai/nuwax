import {generateId as $83ae27ae4c16dc56$export$567fc7097e064344} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useHasTabbableChild as $644c3c0e7ea96f5b$export$eac1895992b9f3d6} from "../focus/useHasTabbableChild.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";

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



function $21f29b5912e876ef$export$fae0121b5afe572d(props, state, ref) {
    // The tabpanel should have tabIndex=0 when there are no tabbable elements within it.
    // Otherwise, tabbing from the focused tab should go directly to the first tabbable element
    // within the tabpanel.
    let tabIndex = (0, $644c3c0e7ea96f5b$export$eac1895992b9f3d6)(ref) ? undefined : 0;
    var _props_id;
    const id = (0, $83ae27ae4c16dc56$export$567fc7097e064344)(state, (_props_id = props.id) !== null && _props_id !== void 0 ? _props_id : state === null || state === void 0 ? void 0 : state.selectedKey, 'tabpanel');
    const tabPanelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        ...props,
        id: id,
        'aria-labelledby': (0, $83ae27ae4c16dc56$export$567fc7097e064344)(state, state === null || state === void 0 ? void 0 : state.selectedKey, 'tab')
    });
    return {
        tabPanelProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(tabPanelProps, {
            tabIndex: tabIndex,
            role: 'tabpanel',
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details']
        })
    };
}


export {$21f29b5912e876ef$export$fae0121b5afe572d as useTabPanel};
//# sourceMappingURL=useTabPanel.js.map
