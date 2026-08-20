var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $h2mV5$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTypeSelect", function () { return $a6299e8d95fc8908$export$e32c88dfddc6e1d8; });
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

/**
 * Controls how long to wait before clearing the typeahead buffer.
 */ const $a6299e8d95fc8908$var$TYPEAHEAD_DEBOUNCE_WAIT_MS = 1000; // 1 second
function $a6299e8d95fc8908$export$e32c88dfddc6e1d8(options) {
    let { keyboardDelegate: keyboardDelegate, selectionManager: selectionManager, onTypeSelect: onTypeSelect } = options;
    let state = (0, $h2mV5$react.useRef)({
        search: '',
        timeout: undefined
    }).current;
    let onKeyDown = (e)=>{
        let character = $a6299e8d95fc8908$var$getStringForKey(e.key);
        if (!character || e.ctrlKey || e.metaKey || !(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) || state.search.length === 0 && character === ' ') return;
        // Do not propagate the Spacebar event if it's meant to be part of the search.
        // When we time out, the search term becomes empty, hence the check on length.
        // Trimming is to account for the case of pressing the Spacebar more than once,
        // which should cycle through the selection/deselection of the focused item.
        if (character === ' ' && state.search.trim().length > 0) {
            e.preventDefault();
            if (!('continuePropagation' in e)) e.stopPropagation();
        }
        state.search += character;
        if (keyboardDelegate.getKeyForSearch != null) {
            // Use the delegate to find a key to focus.
            // Prioritize items after the currently focused item, falling back to searching the whole list.
            let key = keyboardDelegate.getKeyForSearch(state.search, selectionManager.focusedKey);
            // If no key found, search from the top.
            if (key == null) key = keyboardDelegate.getKeyForSearch(state.search);
            if (key != null) {
                selectionManager.setFocusedKey(key);
                if (onTypeSelect) onTypeSelect(key);
            }
        }
        clearTimeout(state.timeout);
        state.timeout = setTimeout(()=>{
            state.search = '';
        }, $a6299e8d95fc8908$var$TYPEAHEAD_DEBOUNCE_WAIT_MS);
    };
    return {
        typeSelectProps: {
            // Using a capturing listener to catch the keydown event before
            // other hooks in order to handle the Spacebar event.
            onKeyDownCapture: keyboardDelegate.getKeyForSearch ? onKeyDown : undefined
        }
    };
}
function $a6299e8d95fc8908$var$getStringForKey(key) {
    // If the key is of length 1, it is an ASCII value.
    // Otherwise, if there are no ASCII characters in the key name,
    // it is a Unicode character.
    // See https://www.w3.org/TR/uievents-key/
    if (key.length === 1 || !/^[A-Z]/i.test(key)) return key;
    return '';
}


//# sourceMappingURL=useTypeSelect.cjs.map
