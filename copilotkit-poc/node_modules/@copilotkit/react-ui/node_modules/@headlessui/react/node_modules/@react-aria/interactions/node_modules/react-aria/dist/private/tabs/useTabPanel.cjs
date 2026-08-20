var $fe3ef331ec3a03dd$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $4a38c0a29bd84510$exports = require("../focus/useHasTabbableChild.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTabPanel", function () { return $439f08efe75a8477$export$fae0121b5afe572d; });
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



function $439f08efe75a8477$export$fae0121b5afe572d(props, state, ref) {
    // The tabpanel should have tabIndex=0 when there are no tabbable elements within it.
    // Otherwise, tabbing from the focused tab should go directly to the first tabbable element
    // within the tabpanel.
    let tabIndex = (0, $4a38c0a29bd84510$exports.useHasTabbableChild)(ref) ? undefined : 0;
    const id = (0, $fe3ef331ec3a03dd$exports.generateId)(state, props.id ?? state?.selectedKey, 'tabpanel');
    const tabPanelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        ...props,
        id: id,
        'aria-labelledby': (0, $fe3ef331ec3a03dd$exports.generateId)(state, state?.selectedKey, 'tab')
    });
    return {
        tabPanelProps: (0, $89b39774f3b79dbb$exports.mergeProps)(tabPanelProps, {
            tabIndex: tabIndex,
            role: 'tabpanel',
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details']
        })
    };
}


//# sourceMappingURL=useTabPanel.cjs.map
