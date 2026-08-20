import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576} from "../utils/shadowdom/DOMFunctions.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9} from "./useFocusVisible.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";
import {runAfterTransition as $aa33e9569e5401d5$export$24490316f764c430} from "../utils/runAfterTransition.js";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $56c81cdebdc6a696$export$80f3e147d781571c(element) {
    if (!element.isConnected) return;
    // If the user is interacting with a virtual cursor, e.g. screen reader, then
    // wait until after any animated transitions that are currently occurring on
    // the page before shifting focus. This avoids issues with VoiceOver on iOS
    // causing the page to scroll when moving focus if the element is transitioning
    // from off the screen.
    const ownerDocument = (0, $cc3c3666b64debad$export$b204af158042fbac)(element);
    if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'virtual') {
        let lastFocusedElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)(ownerDocument);
        (0, $aa33e9569e5401d5$export$24490316f764c430)(()=>{
            const activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)(ownerDocument);
            // If focus did not move or focus was lost to the body, and the element is still in the document, focus it.
            if ((activeElement === lastFocusedElement || activeElement === ownerDocument.body) && element.isConnected) (0, $d559d872031c749f$export$de79e2c695e052f3)(element);
        });
    } else (0, $d559d872031c749f$export$de79e2c695e052f3)(element);
}


export {$56c81cdebdc6a696$export$80f3e147d781571c as focusSafely};
//# sourceMappingURL=focusSafely.js.map
