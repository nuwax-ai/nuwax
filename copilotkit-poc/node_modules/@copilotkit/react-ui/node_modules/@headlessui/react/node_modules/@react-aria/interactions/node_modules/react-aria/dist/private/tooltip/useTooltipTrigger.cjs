var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2U80o$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTooltipTrigger", function () { return $9988266722f3c4da$export$a6da6c504e4bba8b; });
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





function $9988266722f3c4da$export$a6da6c504e4bba8b(props, state, ref) {
    let { isDisabled: isDisabled, trigger: trigger, shouldCloseOnPress: shouldCloseOnPress = true } = props;
    let tooltipId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let isHovered = (0, $2U80o$react.useRef)(false);
    let isFocused = (0, $2U80o$react.useRef)(false);
    let handleShow = ()=>{
        if (isHovered.current || isFocused.current) state.open(isFocused.current);
    };
    let handleHide = (immediate)=>{
        if (!isHovered.current && !isFocused.current) state.close(immediate);
    };
    (0, $2U80o$react.useEffect)(()=>{
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
        if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'pointer') isHovered.current = true;
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
        let isVisible = (0, $d0df89f3abe2c2ca$exports.isFocusVisible)();
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
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
        isDisabled: isDisabled,
        onHoverStart: onHoverStart,
        onHoverEnd: onHoverEnd
    });
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)({
        isDisabled: isDisabled,
        onFocus: onFocus,
        onBlur: onBlur
    }, ref);
    return {
        triggerProps: {
            'aria-describedby': state.isOpen ? tooltipId : undefined,
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, hoverProps, {
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


//# sourceMappingURL=useTooltipTrigger.cjs.map
