import {createEventHandler as $9f1ad800ae5e6534$export$48d1ea6320830260} from "./createEventHandler.js";

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
function $bf74df7506f65576$export$8f71654801c2f7cd(props) {
    return {
        keyboardProps: props.isDisabled ? {} : {
            onKeyDown: (0, $9f1ad800ae5e6534$export$48d1ea6320830260)(props.onKeyDown),
            onKeyUp: (0, $9f1ad800ae5e6534$export$48d1ea6320830260)(props.onKeyUp)
        }
    };
}


export {$bf74df7506f65576$export$8f71654801c2f7cd as useKeyboard};
//# sourceMappingURL=useKeyboard.js.map
