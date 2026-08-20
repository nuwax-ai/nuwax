import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "./useEffectEvent.js";
import {useEffect as $2OJGH$useEffect} from "react";

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

function $5dfd40f1661a7fc3$export$5add1d006293d136(ref, initialValue, onReset) {
    let handleReset = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        if (onReset && !e.defaultPrevented) onReset(initialValue);
    });
    (0, $2OJGH$useEffect)(()=>{
        var _ref_current;
        let form = ref === null || ref === void 0 ? void 0 : (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.form;
        form === null || form === void 0 ? void 0 : form.addEventListener('reset', handleReset);
        return ()=>{
            form === null || form === void 0 ? void 0 : form.removeEventListener('reset', handleReset);
        };
    }, [
        ref
    ]);
}


export {$5dfd40f1661a7fc3$export$5add1d006293d136 as useFormReset};
//# sourceMappingURL=useFormReset.js.map
