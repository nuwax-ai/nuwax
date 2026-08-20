import {createFocusManager as $903814aeb7d53b38$export$c5251b9e124bf29, getFocusableTreeWalker as $903814aeb7d53b38$export$2d6ec8fc375ceafa} from "../focus/FocusScope.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useMemo as $ccL7x$useMemo} from "react";







function $69ed6c8aabd1db26$export$4a931266a3838b86(state, ref, disableArrowNavigation) {
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let focusManager = (0, $ccL7x$useMemo)(()=>(0, $903814aeb7d53b38$export$c5251b9e124bf29)(ref), [
        ref
    ]);
    // Open the popover on alt + arrow down
    let onKeyDown = (e)=>{
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && 'setOpen' in state) {
            e.preventDefault();
            e.stopPropagation();
            state.setOpen(true);
        }
        if (disableArrowNavigation) return;
        switch(e.key){
            case 'ArrowLeft':
                e.preventDefault();
                e.stopPropagation();
                if (direction === 'rtl') {
                    if (ref.current) {
                        let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                        let prev = $69ed6c8aabd1db26$var$findNextSegment(ref.current, target.getBoundingClientRect().left, -1);
                        if (prev) prev.focus();
                    }
                } else focusManager.focusPrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                if (direction === 'rtl') {
                    if (ref.current) {
                        let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                        let next = $69ed6c8aabd1db26$var$findNextSegment(ref.current, target.getBoundingClientRect().left, 1);
                        if (next) next.focus();
                    }
                } else focusManager.focusNext();
                break;
        }
    };
    // Focus the first placeholder segment from the end on mouse down/touch up in the field.
    let focusLast = ()=>{
        if (!ref.current) return;
        // Try to find the segment prior to the element that was clicked on.
        let target = window.event ? (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(window.event) : null;
        let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(ref.current, {
            tabbable: true
        });
        if (target) {
            walker.currentNode = target;
            target = walker.previousNode();
        }
        // If no target found, find the last element from the end.
        if (!target) {
            let last;
            do {
                last = walker.lastChild();
                if (last) target = last;
            }while (last);
        }
        // Now go backwards until we find an element that is not a placeholder.
        while(target === null || target === void 0 ? void 0 : target.hasAttribute('data-placeholder')){
            let prev = walker.previousNode();
            if (prev && prev.hasAttribute('data-placeholder')) target = prev;
            else break;
        }
        if (target) target.focus();
    };
    let { pressProps: pressProps } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        preventFocusOnPress: true,
        allowTextSelectionOnPress: true,
        onPressStart (e) {
            if (e.pointerType === 'mouse') focusLast();
        },
        onPress (e) {
            if (e.pointerType === 'touch' || e.pointerType === 'pen') focusLast();
        }
    });
    return (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(pressProps, {
        onKeyDown: onKeyDown
    });
}
function $69ed6c8aabd1db26$var$findNextSegment(group, fromX, direction) {
    let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(group, {
        tabbable: true
    });
    let node = walker.nextNode();
    let closest = null;
    let closestDistance = Infinity;
    while(node){
        let x = node.getBoundingClientRect().left;
        let distance = x - fromX;
        let absoluteDistance = Math.abs(distance);
        if (Math.sign(distance) === direction && absoluteDistance < closestDistance) {
            closest = node;
            closestDistance = absoluteDistance;
        }
        node = walker.nextNode();
    }
    return closest;
}


export {$69ed6c8aabd1db26$export$4a931266a3838b86 as useDatePickerGroup};
//# sourceMappingURL=useDatePickerGroup.js.map
