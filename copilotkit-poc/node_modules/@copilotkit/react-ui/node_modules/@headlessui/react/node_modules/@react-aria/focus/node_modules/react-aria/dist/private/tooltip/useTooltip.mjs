import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useHover as $e969f22b6713ca4a$export$ae780daf29e6d456} from "../interactions/useHover.mjs";

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


function $8c383cffc84c9982$export$1c4b08e0eca38426(props, state) {
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let { hoverProps: hoverProps } = (0, $e969f22b6713ca4a$export$ae780daf29e6d456)({
        onHoverStart: ()=>state?.open(true),
        onHoverEnd: ()=>state?.close()
    });
    return {
        tooltipProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, hoverProps, {
            role: 'tooltip'
        })
    };
}


export {$8c383cffc84c9982$export$1c4b08e0eca38426 as useTooltip};
//# sourceMappingURL=useTooltip.mjs.map
