import {useGridListItem as $7d08662b45460e3b$export$9610e69494fadfd2} from "../gridlist/useGridListItem.js";
import $fFLhT$intlStringsjs from "./intlStrings.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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



function $6921f059b634f99b$export$e4bcc4675b2b123a(props, state, ref) {
    let { node: node } = props;
    let gridListAria = (0, $7d08662b45460e3b$export$9610e69494fadfd2)(props, state, ref);
    let isExpanded = gridListAria.rowProps['aria-expanded'] === true;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($fFLhT$intlStringsjs))), '@react-aria/tree');
    let labelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
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


export {$6921f059b634f99b$export$e4bcc4675b2b123a as useTreeItem};
//# sourceMappingURL=useTreeItem.js.map
