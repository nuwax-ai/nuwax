import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import $1SpDQ$intlStringsmjs from "./intlStrings.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useLongPress as $7b01448eaad0fe7c$export$c24ed0104d07eab9} from "../interactions/useLongPress.mjs";
import {useOverlayTrigger as $f282e36c29c025e8$export$f9d5c8beee7d008d} from "../overlays/useOverlayTrigger.mjs";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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





function $f19b83c1486f45cc$export$dc9c12ed27dd1b49(props, state, ref) {
    let { type: type = 'menu', isDisabled: isDisabled, trigger: trigger = 'press' } = props;
    let menuTriggerId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let { triggerProps: triggerProps, overlayProps: overlayProps } = (0, $f282e36c29c025e8$export$f9d5c8beee7d008d)({
        type: type
    }, state, ref);
    let onKeyDown = (e)=>{
        if (isDisabled) return;
        if (trigger === 'longPress' && !e.altKey) return;
        if (ref && ref.current) switch(e.key){
            case 'Enter':
            case ' ':
                // React puts listeners on the same root, so even if propagation was stopped, immediate propagation is still possible.
                // useTypeSelect will handle the spacebar first if it's running, so we don't want to open if it's handled it already.
                // We use isDefaultPrevented() instead of isPropagationStopped() because createEventHandler stops propagation by default.
                // And default prevented means that the event was handled by something else (typeahead), so we don't want to open the menu.
                if (trigger === 'longPress' || e.isDefaultPrevented()) return;
            // fallthrough
            case 'ArrowDown':
                // Stop propagation, unless it would already be handled by useKeyboard.
                if (!('continuePropagation' in e)) e.stopPropagation();
                e.preventDefault();
                state.toggle('first');
                break;
            case 'ArrowUp':
                if (!('continuePropagation' in e)) e.stopPropagation();
                e.preventDefault();
                state.toggle('last');
                break;
            default:
                // Allow other keys.
                if ('continuePropagation' in e) e.continuePropagation();
        }
    };
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($1SpDQ$intlStringsmjs))), '@react-aria/menu');
    let { longPressProps: longPressProps } = (0, $7b01448eaad0fe7c$export$c24ed0104d07eab9)({
        isDisabled: isDisabled || trigger !== 'longPress',
        accessibilityDescription: stringFormatter.format('longPressMessage'),
        onLongPressStart () {
            state.close();
        },
        onLongPress () {
            state.open('first');
        }
    });
    let pressProps = {
        preventFocusOnPress: true,
        onPressStart (e) {
            // For consistency with native, open the menu on mouse/key down, but touch up.
            if (e.pointerType !== 'touch' && e.pointerType !== 'keyboard' && !isDisabled) {
                // Ensure trigger has focus before opening the menu so it can be restored by FocusScope on close.
                (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(e.target);
                // If opened with a screen reader, auto focus the first item.
                // Otherwise, the menu itself will be focused.
                state.open(e.pointerType === 'virtual' ? 'first' : null);
            }
        },
        onPress (e) {
            if (e.pointerType === 'touch' && !isDisabled) {
                // Ensure trigger has focus before opening the menu so it can be restored by FocusScope on close.
                (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(e.target);
                state.toggle();
            }
        }
    };
    // omit onPress from triggerProps since we override it above.
    delete triggerProps.onPress;
    return {
        // @ts-ignore - TODO we pass out both DOMAttributes AND AriaButtonProps, but useButton will discard the longPress event handlers, it's only through PressResponder magic that this works for RSP and RAC. it does not work in aria examples
        menuTriggerProps: {
            ...triggerProps,
            ...trigger === 'press' ? pressProps : longPressProps,
            id: menuTriggerId,
            onKeyDown: onKeyDown
        },
        menuProps: {
            ...overlayProps,
            'aria-labelledby': menuTriggerId,
            autoFocus: state.focusStrategy || true,
            onClose: state.close
        }
    };
}


export {$f19b83c1486f45cc$export$dc9c12ed27dd1b49 as useMenuTrigger};
//# sourceMappingURL=useMenuTrigger.mjs.map
