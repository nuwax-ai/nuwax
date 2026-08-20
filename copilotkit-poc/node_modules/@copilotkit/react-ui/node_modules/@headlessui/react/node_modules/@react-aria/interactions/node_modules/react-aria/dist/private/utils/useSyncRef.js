import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "./useLayoutEffect.js";

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
function $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e(context, ref) {
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (context && context.ref && ref) {
            context.ref.current = ref.current;
            return ()=>{
                if (context.ref) // oxlint-disable-next-line react-hooks/exhaustive-deps
                context.ref.current = null;
            };
        }
    });
}


export {$6a8f54bd475a2c7b$export$4debdb1a3f0fa79e as useSyncRef};
//# sourceMappingURL=useSyncRef.js.map
