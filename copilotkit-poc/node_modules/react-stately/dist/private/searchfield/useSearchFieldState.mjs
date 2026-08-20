import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";

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
function $56baeede9f35e022$export$3f8be18b0f41eaf2(props) {
    let [value, setValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)($56baeede9f35e022$var$toString(props.value), $56baeede9f35e022$var$toString(props.defaultValue) || '', props.onChange);
    return {
        value: value,
        setValue: setValue
    };
}
function $56baeede9f35e022$var$toString(val) {
    if (val == null) return;
    return val.toString();
}


export {$56baeede9f35e022$export$3f8be18b0f41eaf2 as useSearchFieldState};
//# sourceMappingURL=useSearchFieldState.mjs.map
