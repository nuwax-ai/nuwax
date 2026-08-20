var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $9UTaO$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDisclosureState", function () { return $41b34cbfbf780c14$export$3fcbf6e4407997e0; });
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

function $41b34cbfbf780c14$export$3fcbf6e4407997e0(props) {
    let [isExpanded, setExpanded] = (0, $14cedf286405cc4b$exports.useControlledState)(props.isExpanded, props.defaultExpanded || false, props.onExpandedChange);
    const expand = (0, $9UTaO$react.useCallback)(()=>{
        setExpanded(true);
    }, [
        setExpanded
    ]);
    const collapse = (0, $9UTaO$react.useCallback)(()=>{
        setExpanded(false);
    }, [
        setExpanded
    ]);
    const toggle = (0, $9UTaO$react.useCallback)(()=>{
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


//# sourceMappingURL=useDisclosureState.cjs.map
