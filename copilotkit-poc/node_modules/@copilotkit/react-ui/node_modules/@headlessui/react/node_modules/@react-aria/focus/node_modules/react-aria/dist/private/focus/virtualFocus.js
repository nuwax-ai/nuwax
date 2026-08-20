import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576} from "../utils/shadowdom/DOMFunctions.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";



function $57a86975180d30a8$export$76e4e37e5339496d(to) {
    let from = $57a86975180d30a8$export$759df0d867455a91((0, $cc3c3666b64debad$export$b204af158042fbac)(to));
    if (from !== to) {
        if (from) $57a86975180d30a8$export$6c5dc7e81d2cc29a(from, to);
        if (to) $57a86975180d30a8$export$2b35b76d2e30e129(to, from);
    }
}
function $57a86975180d30a8$export$6c5dc7e81d2cc29a(from, to) {
    from.dispatchEvent(new FocusEvent('blur', {
        relatedTarget: to
    }));
    from.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: to
    }));
}
function $57a86975180d30a8$export$2b35b76d2e30e129(to, from) {
    to.dispatchEvent(new FocusEvent('focus', {
        relatedTarget: from
    }));
    to.dispatchEvent(new FocusEvent('focusin', {
        bubbles: true,
        relatedTarget: from
    }));
}
function $57a86975180d30a8$export$759df0d867455a91(document) {
    let activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)(document);
    let activeDescendant = activeElement === null || activeElement === void 0 ? void 0 : activeElement.getAttribute('aria-activedescendant');
    if (activeDescendant) return document.getElementById(activeDescendant) || activeElement;
    return activeElement;
}


export {$57a86975180d30a8$export$76e4e37e5339496d as moveVirtualFocus, $57a86975180d30a8$export$759df0d867455a91 as getVirtuallyFocusedElement, $57a86975180d30a8$export$6c5dc7e81d2cc29a as dispatchVirtualBlur, $57a86975180d30a8$export$2b35b76d2e30e129 as dispatchVirtualFocus};
//# sourceMappingURL=virtualFocus.js.map
