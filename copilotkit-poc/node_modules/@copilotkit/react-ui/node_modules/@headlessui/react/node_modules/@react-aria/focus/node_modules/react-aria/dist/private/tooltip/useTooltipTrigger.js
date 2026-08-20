import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9, isFocusVisible as $b50b1cc8a843ace7$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useRef as $8fBAg$useRef, useEffect as $8fBAg$useEffect} from "react";

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





function $7e40c44d82ba72cb$export$a6da6c504e4bba8b(props, state, ref) {
    let { isDisabled: isDisabled, trigger: trigger, shouldCloseOnPress: shouldCloseOnPress = true } = props;
    let tooltipId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let isHovered = (0, $8fBAg$useRef)(false);
    let isFocused = (0, $8fBAg$useRef)(false);
    let handleShow = ()=>{
        if (isHovered.current || isFocused.current) state.open(isFocused.current);
    };
    let handleHide = (immediate)=>{
        if (!isHovered.current && !isFocused.current) state.close(immediate);
    };
    (0, $8fBAg$useEffect)(()=>{
        let onKeyDown = (e)=>{
            if (ref && ref.current) // Escape after clicking something can give it keyboard focus
            // dismiss tooltip on esc key press
            {
                if (e.key === 'Escape') {
                    e.stopPropagation();
                    state.close(true);
                }
            }
        };
        if (state.isOpen) {
            document.addEventListener('keydown', onKeyDown, true);
            return ()=>{
                document.removeEventListener('keydown', onKeyDown, true);
            };
        }
    }, [
        ref,
        state
    ]);
    let onHoverStart = ()=>{
        if (trigger === 'focus') return;
        // In chrome, if you hover a trigger, then another element obscures it, due to keyboard
        // interactions for example, hover will end. When hover is restored after that element disappears,
        // focus moves on for example, then the tooltip will reopen. We check the modality to know if the hover
        // is the result of moving the mouse.
        if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'pointer') isHovered.current = true;
        else isHovered.current = false;
        handleShow();
    };
    let onHoverEnd = ()=>{
        if (trigger === 'focus') return;
        // no matter how the trigger is left, we should close the tooltip
        isFocused.current = false;
        isHovered.current = false;
        handleHide();
    };
    let onPressStart = ()=>{
        // if shouldCloseOnPress is false, we should not close the tooltip
        if (!shouldCloseOnPress) return;
        // no matter how the trigger is pressed, we should close the tooltip
        isFocused.current = false;
        isHovered.current = false;
        handleHide(true);
    };
    let onFocus = ()=>{
        let isVisible = (0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)();
        if (isVisible) {
            isFocused.current = true;
            handleShow();
        }
    };
    let onBlur = ()=>{
        isFocused.current = false;
        isHovered.current = false;
        handleHide(true);
    };
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
        isDisabled: isDisabled,
        onHoverStart: onHoverStart,
        onHoverEnd: onHoverEnd
    });
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)({
        isDisabled: isDisabled,
        onFocus: onFocus,
        onBlur: onBlur
    }, ref);
    return {
        triggerProps: {
            'aria-describedby': state.isOpen ? tooltipId : undefined,
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, hoverProps, {
                onPointerDown: onPressStart,
                onKeyDown: onPressStart
            }),
            tabIndex: undefined
        },
        tooltipProps: {
            id: tooltipId
        }
    };
}


export {$7e40c44d82ba72cb$export$a6da6c504e4bba8b as useTooltipTrigger};
//# sourceMappingURL=useTooltipTrigger.js.map
