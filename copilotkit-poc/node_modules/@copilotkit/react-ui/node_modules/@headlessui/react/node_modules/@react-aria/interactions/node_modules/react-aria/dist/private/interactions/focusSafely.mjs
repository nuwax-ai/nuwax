import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576} from "../utils/shadowdom/DOMFunctions.mjs";
import {getInteractionModality as $8f5a2122b0992be3$export$630ff653c5ada6a9} from "./useFocusVisible.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";
import {runAfterTransition as $081cb5757e08788e$export$24490316f764c430} from "../utils/runAfterTransition.mjs";

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




function $f192c2f16961cbe0$export$80f3e147d781571c(element) {
    if (!element.isConnected) return;
    // If the user is interacting with a virtual cursor, e.g. screen reader, then
    // wait until after any animated transitions that are currently occurring on
    // the page before shifting focus. This avoids issues with VoiceOver on iOS
    // causing the page to scroll when moving focus if the element is transitioning
    // from off the screen.
    const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(element);
    if ((0, $8f5a2122b0992be3$export$630ff653c5ada6a9)() === 'virtual') {
        let lastFocusedElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument);
        (0, $081cb5757e08788e$export$24490316f764c430)(()=>{
            const activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument);
            // If focus did not move or focus was lost to the body, and the element is still in the document, focus it.
            if ((activeElement === lastFocusedElement || activeElement === ownerDocument.body) && element.isConnected) (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(element);
        });
    } else (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(element);
}


export {$f192c2f16961cbe0$export$80f3e147d781571c as focusSafely};
//# sourceMappingURL=focusSafely.mjs.map
