import {useButton as $3f0ac64f7a0a47af$export$ea18c227d4417cc3} from "./useButton.js";
import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";

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


function $4244afc2be24de34$export$51e84d46ca0bc451(props, state, ref) {
    const { isSelected: isSelected } = state;
    const { isPressed: isPressed, buttonProps: buttonProps } = (0, $3f0ac64f7a0a47af$export$ea18c227d4417cc3)({
        ...props,
        onPress: (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(state.toggle, props.onPress)
    }, ref);
    return {
        isPressed: isPressed,
        isSelected: isSelected,
        isDisabled: props.isDisabled || false,
        buttonProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(buttonProps, {
            'aria-pressed': isSelected
        })
    };
}


export {$4244afc2be24de34$export$51e84d46ca0bc451 as useToggleButton};
//# sourceMappingURL=useToggleButton.js.map
