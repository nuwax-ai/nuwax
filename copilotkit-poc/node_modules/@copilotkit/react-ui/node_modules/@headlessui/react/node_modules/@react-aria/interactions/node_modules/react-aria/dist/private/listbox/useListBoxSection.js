import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";

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
function $3ff215e5c84b28bb$export$c3f9f39876e4bc7(props) {
    let { heading: heading, 'aria-label': ariaLabel } = props;
    let headingId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    return {
        itemProps: {
            role: 'presentation'
        },
        headingProps: heading ? {
            // Technically, listbox cannot contain headings according to ARIA.
            // We hide the heading from assistive technology, using role="presentation",
            // and only use it as a visual label for the nested group.
            id: headingId,
            role: 'presentation',
            onMouseDown: (e)=>{
                // Prevent DOM focus from moving on mouse down when using virtual focus
                e.preventDefault();
            }
        } : {},
        groupProps: {
            role: 'group',
            'aria-label': ariaLabel,
            'aria-labelledby': heading ? headingId : undefined
        }
    };
}


export {$3ff215e5c84b28bb$export$c3f9f39876e4bc7 as useListBoxSection};
//# sourceMappingURL=useListBoxSection.js.map
