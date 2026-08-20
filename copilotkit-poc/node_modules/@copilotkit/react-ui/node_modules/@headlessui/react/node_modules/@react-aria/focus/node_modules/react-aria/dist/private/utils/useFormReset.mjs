import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "./useEffectEvent.mjs";
import {useEffect as $1HUBd$useEffect} from "react";

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

function $3274bf1495747a7b$export$5add1d006293d136(ref, initialValue, onReset) {
    let handleReset = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (onReset && !e.defaultPrevented) onReset(initialValue);
    });
    (0, $1HUBd$useEffect)(()=>{
        let form = ref?.current?.form;
        form?.addEventListener('reset', handleReset);
        return ()=>{
            form?.removeEventListener('reset', handleReset);
        };
    }, [
        ref
    ]);
}


export {$3274bf1495747a7b$export$5add1d006293d136 as useFormReset};
//# sourceMappingURL=useFormReset.mjs.map
