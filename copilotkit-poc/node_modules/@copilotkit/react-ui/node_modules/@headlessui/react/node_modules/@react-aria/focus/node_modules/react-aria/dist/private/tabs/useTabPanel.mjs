import {generateId as $a251981b23baaa12$export$567fc7097e064344} from "./utils.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useHasTabbableChild as $bf14c9739fda2eb3$export$eac1895992b9f3d6} from "../focus/useHasTabbableChild.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";

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



function $7d951241dadd72e4$export$fae0121b5afe572d(props, state, ref) {
    // The tabpanel should have tabIndex=0 when there are no tabbable elements within it.
    // Otherwise, tabbing from the focused tab should go directly to the first tabbable element
    // within the tabpanel.
    let tabIndex = (0, $bf14c9739fda2eb3$export$eac1895992b9f3d6)(ref) ? undefined : 0;
    const id = (0, $a251981b23baaa12$export$567fc7097e064344)(state, props.id ?? state?.selectedKey, 'tabpanel');
    const tabPanelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        id: id,
        'aria-labelledby': (0, $a251981b23baaa12$export$567fc7097e064344)(state, state?.selectedKey, 'tab')
    });
    return {
        tabPanelProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(tabPanelProps, {
            tabIndex: tabIndex,
            role: 'tabpanel',
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details']
        })
    };
}


export {$7d951241dadd72e4$export$fae0121b5afe572d as useTabPanel};
//# sourceMappingURL=useTabPanel.mjs.map
