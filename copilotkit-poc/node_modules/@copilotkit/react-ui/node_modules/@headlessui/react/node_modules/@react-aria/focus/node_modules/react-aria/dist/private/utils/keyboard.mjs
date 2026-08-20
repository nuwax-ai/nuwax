import {isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "./platform.mjs";

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
function $bb39c0fc1c19b34c$export$16792effe837dba3(e) {
    if ((0, $2add3ce32c6007eb$export$9ac100e40613ea10)()) return e.metaKey;
    return e.ctrlKey;
}
// HTML input types that do not cause the software keyboard to appear.
const $bb39c0fc1c19b34c$var$nonTextInputTypes = new Set([
    'checkbox',
    'radio',
    'range',
    'color',
    'file',
    'image',
    'button',
    'submit',
    'reset'
]);
function $bb39c0fc1c19b34c$export$c57958e35f31ed73(target) {
    return target instanceof HTMLInputElement && !$bb39c0fc1c19b34c$var$nonTextInputTypes.has(target.type) || target instanceof HTMLTextAreaElement || target instanceof HTMLElement && target.isContentEditable;
}


export {$bb39c0fc1c19b34c$export$16792effe837dba3 as isCtrlKeyPressed, $bb39c0fc1c19b34c$export$c57958e35f31ed73 as willOpenKeyboard};
//# sourceMappingURL=keyboard.mjs.map
