import {parseColor as $9be7d47340a9a2a9$export$6e865ea70d7724f} from "./Color.js";
import {useMemo as $btG16$useMemo} from "react";

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

function $3c80253044a6b286$export$5aadd9c0606af5c2(value) {
    return (0, $btG16$useMemo)(()=>{
        if (typeof value === 'string') try {
            return (0, $9be7d47340a9a2a9$export$6e865ea70d7724f)(value);
        } catch  {
            return undefined;
        }
        return value;
    }, [
        value
    ]);
}


export {$3c80253044a6b286$export$5aadd9c0606af5c2 as useColor};
//# sourceMappingURL=useColor.js.map
