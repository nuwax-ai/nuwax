import {useGridSelectionCheckbox as $ba59c92b3d4c78e7$export$70e2eed1a92976ad} from "../grid/useGridSelectionCheckbox.js";
import {getRowId as $781ed2e01df48c52$export$f45c25170b9a99c2} from "./utils.js";

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $8aed53bbdf4bbdb5$export$e29f2573fabbf7b9(props, state) {
    let { key: key } = props;
    const { checkboxProps: checkboxProps } = (0, $ba59c92b3d4c78e7$export$70e2eed1a92976ad)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            'aria-labelledby': `${checkboxProps.id} ${(0, $781ed2e01df48c52$export$f45c25170b9a99c2)(state, key)}`
        }
    };
}


export {$8aed53bbdf4bbdb5$export$e29f2573fabbf7b9 as useGridListSelectionCheckbox};
//# sourceMappingURL=useGridListSelectionCheckbox.js.map
