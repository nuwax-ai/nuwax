import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusRing as $0c4a58759813079a$export$4e328f61c538687f} from "./useFocusRing.mjs";
import $9Zarp$clsx from "clsx";
import $9Zarp$react from "react";

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



function $aeb8be23c2978fc5$export$1a38b4ad7f578e1d(props) {
    let { children: children, focusClass: focusClass, focusRingClass: focusRingClass } = props;
    let { isFocused: isFocused, isFocusVisible: isFocusVisible, focusProps: focusProps } = (0, $0c4a58759813079a$export$4e328f61c538687f)(props);
    let child = (0, $9Zarp$react).Children.only(children);
    return /*#__PURE__*/ (0, $9Zarp$react).cloneElement(child, (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(child.props, {
        ...focusProps,
        className: (0, $9Zarp$clsx)({
            [focusClass || '']: isFocused,
            [focusRingClass || '']: isFocusVisible
        })
    }));
}


export {$aeb8be23c2978fc5$export$1a38b4ad7f578e1d as FocusRing};
//# sourceMappingURL=FocusRing.mjs.map
