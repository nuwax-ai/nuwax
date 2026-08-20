import {useButton as $ac4318a9c075bb9f$export$ea18c227d4417cc3} from "./useButton.mjs";
import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";

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


function $b54a524c670b905d$export$51e84d46ca0bc451(props, state, ref) {
    const { isSelected: isSelected } = state;
    const { isPressed: isPressed, buttonProps: buttonProps } = (0, $ac4318a9c075bb9f$export$ea18c227d4417cc3)({
        ...props,
        onPress: (0, $a4e76a5424781910$export$e08e3b67e392101e)(state.toggle, props.onPress)
    }, ref);
    return {
        isPressed: isPressed,
        isSelected: isSelected,
        isDisabled: props.isDisabled || false,
        buttonProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(buttonProps, {
            'aria-pressed': isSelected
        })
    };
}


export {$b54a524c670b905d$export$51e84d46ca0bc451 as useToggleButton};
//# sourceMappingURL=useToggleButton.mjs.map
