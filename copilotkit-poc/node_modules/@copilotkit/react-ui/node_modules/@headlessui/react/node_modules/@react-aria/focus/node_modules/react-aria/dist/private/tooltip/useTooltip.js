import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";

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


function $2fe835396d6f0857$export$1c4b08e0eca38426(props, state) {
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
        onHoverStart: ()=>state === null || state === void 0 ? void 0 : state.open(true),
        onHoverEnd: ()=>state === null || state === void 0 ? void 0 : state.close()
    });
    return {
        tooltipProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, hoverProps, {
            role: 'tooltip'
        })
    };
}


export {$2fe835396d6f0857$export$1c4b08e0eca38426 as useTooltip};
//# sourceMappingURL=useTooltip.js.map
