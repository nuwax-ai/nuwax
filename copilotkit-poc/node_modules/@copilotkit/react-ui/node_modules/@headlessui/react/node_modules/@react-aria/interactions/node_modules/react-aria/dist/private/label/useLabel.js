import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";

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

function $6dc0ccf02415c0af$export$8467354a121f1b9f(props) {
    let { id: id, label: label, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, labelElementType: labelElementType = 'label' } = props;
    id = (0, $0292efe68908de6b$export$f680877a34711e37)(id);
    let labelId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let labelProps = {};
    if (label) {
        ariaLabelledby = ariaLabelledby ? `${labelId} ${ariaLabelledby}` : labelId;
        labelProps = {
            id: labelId,
            htmlFor: labelElementType === 'label' ? id : undefined
        };
    } else if (!ariaLabelledby && !ariaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility');
    let fieldProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        id: id,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby
    });
    return {
        labelProps: labelProps,
        fieldProps: fieldProps
    };
}


export {$6dc0ccf02415c0af$export$8467354a121f1b9f as useLabel};
//# sourceMappingURL=useLabel.js.map
