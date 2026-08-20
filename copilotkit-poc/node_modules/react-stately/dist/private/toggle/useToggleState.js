import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $f66l6$useState} from "react";

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

function $3e76379ccda9b6f6$export$8042c6c013fd5226(props = {}) {
    let { isReadOnly: isReadOnly } = props;
    // have to provide an empty function so useControlledState doesn't throw a fit
    // can't use useControlledState's prop calling because we need the event object from the change
    let [isSelected, setSelected] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(props.isSelected, props.defaultSelected || false, props.onChange);
    let [initialValue] = (0, $f66l6$useState)(isSelected);
    function updateSelected(value) {
        if (!isReadOnly) setSelected(value);
    }
    function toggleState() {
        if (!isReadOnly) setSelected(!isSelected);
    }
    var _props_defaultSelected;
    return {
        isSelected: isSelected,
        defaultSelected: (_props_defaultSelected = props.defaultSelected) !== null && _props_defaultSelected !== void 0 ? _props_defaultSelected : initialValue,
        setSelected: updateSelected,
        toggle: toggleState
    };
}


export {$3e76379ccda9b6f6$export$8042c6c013fd5226 as useToggleState};
//# sourceMappingURL=useToggleState.js.map
