var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $8gVJ0$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDatePickerGroup", function () { return $593fdd0ed62674c2$export$4a931266a3838b86; });






function $593fdd0ed62674c2$export$4a931266a3838b86(state, ref, disableArrowNavigation) {
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let focusManager = (0, $8gVJ0$react.useMemo)(()=>(0, $9fb4ac1cc58342cc$exports.createFocusManager)(ref), [
        ref
    ]);
    // Open the popover on alt + arrow down
    let onKeyDown = (e)=>{
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) return;
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
                        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
                        let prev = $593fdd0ed62674c2$var$findNextSegment(ref.current, target.getBoundingClientRect().left, -1);
                        if (prev) prev.focus();
                    }
                } else focusManager.focusPrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                if (direction === 'rtl') {
                    if (ref.current) {
                        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
                        let next = $593fdd0ed62674c2$var$findNextSegment(ref.current, target.getBoundingClientRect().left, 1);
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
        let target = window.event ? (0, $da02ee888921bc9e$exports.getEventTarget)(window.event) : null;
        let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(ref.current, {
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
        while(target?.hasAttribute('data-placeholder')){
            let prev = walker.previousNode();
            if (prev && prev.hasAttribute('data-placeholder')) target = prev;
            else break;
        }
        if (target) target.focus();
    };
    let { pressProps: pressProps } = (0, $1d003dcb6308cd89$exports.usePress)({
        preventFocusOnPress: true,
        allowTextSelectionOnPress: true,
        onPressStart (e) {
            if (e.pointerType === 'mouse') focusLast();
        },
        onPress (e) {
            if (e.pointerType === 'touch' || e.pointerType === 'pen') focusLast();
        }
    });
    return (0, $89b39774f3b79dbb$exports.mergeProps)(pressProps, {
        onKeyDown: onKeyDown
    });
}
function $593fdd0ed62674c2$var$findNextSegment(group, fromX, direction) {
    let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(group, {
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


//# sourceMappingURL=useDatePickerGroup.cjs.map
