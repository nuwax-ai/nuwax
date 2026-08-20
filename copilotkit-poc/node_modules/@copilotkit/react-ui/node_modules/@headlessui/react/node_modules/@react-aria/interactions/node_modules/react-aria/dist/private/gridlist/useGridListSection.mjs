import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useSlotId as $390e54f620492c70$export$b4cc09c592e8fdb8} from "../utils/useId.mjs";

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

function $e2f91f76d1206b07$export$8a024deed275af3f(props, // eslint-disable-next-line @typescript-eslint/no-unused-vars
state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { 'aria-label': ariaLabel } = props;
    let headingId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)();
    let labelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        'aria-label': ariaLabel,
        'aria-labelledby': headingId
    });
    return {
        rowProps: {
            role: 'row'
        },
        rowHeaderProps: {
            id: headingId,
            role: 'rowheader'
        },
        rowGroupProps: {
            role: 'rowgroup',
            ...labelProps
        }
    };
}


export {$e2f91f76d1206b07$export$8a024deed275af3f as useGridListSection};
//# sourceMappingURL=useGridListSection.mjs.map
