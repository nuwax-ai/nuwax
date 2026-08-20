import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $a983912ba836a672$export$fd9dc107b7325b53(props, state, ref) {
    const { key: key } = props;
    let { selectionManager: manager, selectedKey: selectedKey } = state;
    let isDisabled = !state.isSelectable(key);
    let { itemProps: itemProps } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        isDisabled: isDisabled,
        key: key,
        ref: ref,
        selectionManager: manager
    });
    const isSelected = selectedKey === key;
    let onKeyDown = (event)=>{
        const { key: eventKey } = event;
        if (eventKey === 'ArrowDown' || eventKey === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
        }
        itemProps.onKeyDown?.(event);
    };
    return {
        stepProps: {
            ...itemProps,
            onKeyDown: onKeyDown,
            role: 'link',
            'aria-current': isSelected ? 'step' : undefined,
            'aria-disabled': isDisabled ? true : undefined,
            tabIndex: !isDisabled ? 0 : undefined
        }
    };
}


export {$a983912ba836a672$export$fd9dc107b7325b53 as useStepListItem};
//# sourceMappingURL=useStepListItem.mjs.map
