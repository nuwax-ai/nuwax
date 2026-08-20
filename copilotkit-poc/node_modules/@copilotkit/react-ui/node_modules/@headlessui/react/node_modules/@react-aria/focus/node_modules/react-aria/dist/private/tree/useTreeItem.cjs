var $d07dc266c3dc14c0$exports = require("../gridlist/useGridListItem.cjs");
var $e320cee86e0907dc$exports = require("./intlStrings.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTreeItem", function () { return $71590af46dfcd99e$export$e4bcc4675b2b123a; });
/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $71590af46dfcd99e$export$e4bcc4675b2b123a(props, state, ref) {
    let { node: node } = props;
    let gridListAria = (0, $d07dc266c3dc14c0$exports.useGridListItem)(props, state, ref);
    let isExpanded = gridListAria.rowProps['aria-expanded'] === true;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($e320cee86e0907dc$exports))), '@react-aria/tree');
    let labelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        'aria-label': isExpanded ? stringFormatter.format('collapse') : stringFormatter.format('expand'),
        'aria-labelledby': gridListAria.rowProps.id
    });
    let expandButtonProps = {
        onPress: ()=>{
            if (!gridListAria.isDisabled) {
                state.toggleKey(node.key);
                state.selectionManager.setFocused(true);
                state.selectionManager.setFocusedKey(node.key);
            }
        },
        excludeFromTabOrder: true,
        preventFocusOnPress: true,
        'data-react-aria-prevent-focus': true,
        ...labelProps
    };
    // TODO: should it return a state specifically for isExpanded? Or is aria attribute sufficient?
    return {
        ...gridListAria,
        expandButtonProps: expandButtonProps
    };
}


//# sourceMappingURL=useTreeItem.cjs.map
