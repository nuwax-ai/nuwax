import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $H6UTZ$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useSelectableList as $64903b4b31b6bb2a$export$b95089534ab7c1fd} from "../selection/useSelectableList.mjs";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $352d36ff50f6185a$export$c51c7b7354499d04(props, state, ref) {
    let { 'aria-label': ariaLabel } = props;
    let { listProps: listProps } = (0, $64903b4b31b6bb2a$export$b95089534ab7c1fd)({
        ...props,
        ...state,
        allowsTabNavigation: true,
        ref: ref
    });
    const strings = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($H6UTZ$intlStringsmjs))), '@react-aria/steplist');
    const stepListProps = {
        ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(listProps, (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
            labelable: true
        })),
        'aria-label': ariaLabel || strings.format('steplist')
    };
    return {
        listProps: {
            ...stepListProps,
            tabIndex: undefined
        }
    };
}


export {$352d36ff50f6185a$export$c51c7b7354499d04 as useStepList};
//# sourceMappingURL=useStepList.mjs.map
