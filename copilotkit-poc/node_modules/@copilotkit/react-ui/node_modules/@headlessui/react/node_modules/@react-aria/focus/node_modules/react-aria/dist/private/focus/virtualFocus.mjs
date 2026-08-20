import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576} from "../utils/shadowdom/DOMFunctions.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";



function $b72f3f7b3b5f42c6$export$76e4e37e5339496d(to) {
    let from = $b72f3f7b3b5f42c6$export$759df0d867455a91((0, $d447af545b77c9f1$export$b204af158042fbac)(to));
    if (from !== to) {
        if (from) $b72f3f7b3b5f42c6$export$6c5dc7e81d2cc29a(from, to);
        if (to) $b72f3f7b3b5f42c6$export$2b35b76d2e30e129(to, from);
    }
}
function $b72f3f7b3b5f42c6$export$6c5dc7e81d2cc29a(from, to) {
    from.dispatchEvent(new FocusEvent('blur', {
        relatedTarget: to
    }));
    from.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: to
    }));
}
function $b72f3f7b3b5f42c6$export$2b35b76d2e30e129(to, from) {
    to.dispatchEvent(new FocusEvent('focus', {
        relatedTarget: from
    }));
    to.dispatchEvent(new FocusEvent('focusin', {
        bubbles: true,
        relatedTarget: from
    }));
}
function $b72f3f7b3b5f42c6$export$759df0d867455a91(document) {
    let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(document);
    let activeDescendant = activeElement?.getAttribute('aria-activedescendant');
    if (activeDescendant) return document.getElementById(activeDescendant) || activeElement;
    return activeElement;
}


export {$b72f3f7b3b5f42c6$export$76e4e37e5339496d as moveVirtualFocus, $b72f3f7b3b5f42c6$export$759df0d867455a91 as getVirtuallyFocusedElement, $b72f3f7b3b5f42c6$export$6c5dc7e81d2cc29a as dispatchVirtualBlur, $b72f3f7b3b5f42c6$export$2b35b76d2e30e129 as dispatchVirtualFocus};
//# sourceMappingURL=virtualFocus.mjs.map
