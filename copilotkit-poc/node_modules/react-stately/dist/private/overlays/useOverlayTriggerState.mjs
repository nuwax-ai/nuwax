import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useCallback as $kE40A$useCallback} from "react";

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

function $f11fb0bcf1b2687a$export$61c6a8c84e605fb6(props) {
    let [isOpen, setOpen] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(props.isOpen, props.defaultOpen || false, props.onOpenChange);
    const open = (0, $kE40A$useCallback)(()=>{
        setOpen(true);
    }, [
        setOpen
    ]);
    const close = (0, $kE40A$useCallback)(()=>{
        setOpen(false);
    }, [
        setOpen
    ]);
    const toggle = (0, $kE40A$useCallback)(()=>{
        setOpen(!isOpen);
    }, [
        setOpen,
        isOpen
    ]);
    return {
        isOpen: isOpen,
        setOpen: setOpen,
        open: open,
        close: close,
        toggle: toggle
    };
}


export {$f11fb0bcf1b2687a$export$61c6a8c84e605fb6 as useOverlayTriggerState};
//# sourceMappingURL=useOverlayTriggerState.mjs.map
