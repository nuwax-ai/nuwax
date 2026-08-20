import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useCallback as $OWDLz$useCallback} from "react";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $aeefd058ad35e63e$export$3fcbf6e4407997e0(props) {
    let [isExpanded, setExpanded] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.isExpanded, props.defaultExpanded || false, props.onExpandedChange);
    const expand = (0, $OWDLz$useCallback)(()=>{
        setExpanded(true);
    }, [
        setExpanded
    ]);
    const collapse = (0, $OWDLz$useCallback)(()=>{
        setExpanded(false);
    }, [
        setExpanded
    ]);
    const toggle = (0, $OWDLz$useCallback)(()=>{
        setExpanded(!isExpanded);
    }, [
        setExpanded,
        isExpanded
    ]);
    return {
        isExpanded: isExpanded,
        setExpanded: setExpanded,
        expand: expand,
        collapse: collapse,
        toggle: toggle
    };
}


export {$aeefd058ad35e63e$export$3fcbf6e4407997e0 as useDisclosureState};
//# sourceMappingURL=useDisclosureState.js.map
