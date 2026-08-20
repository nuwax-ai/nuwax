var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "moveVirtualFocus", function () { return $4f541c01c875ab4e$export$76e4e37e5339496d; });
$parcel$export(module.exports, "getVirtuallyFocusedElement", function () { return $4f541c01c875ab4e$export$759df0d867455a91; });
$parcel$export(module.exports, "dispatchVirtualBlur", function () { return $4f541c01c875ab4e$export$6c5dc7e81d2cc29a; });
$parcel$export(module.exports, "dispatchVirtualFocus", function () { return $4f541c01c875ab4e$export$2b35b76d2e30e129; });


function $4f541c01c875ab4e$export$76e4e37e5339496d(to) {
    let from = $4f541c01c875ab4e$export$759df0d867455a91((0, $49582955cc364b1c$exports.getOwnerDocument)(to));
    if (from !== to) {
        if (from) $4f541c01c875ab4e$export$6c5dc7e81d2cc29a(from, to);
        if (to) $4f541c01c875ab4e$export$2b35b76d2e30e129(to, from);
    }
}
function $4f541c01c875ab4e$export$6c5dc7e81d2cc29a(from, to) {
    from.dispatchEvent(new FocusEvent('blur', {
        relatedTarget: to
    }));
    from.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: to
    }));
}
function $4f541c01c875ab4e$export$2b35b76d2e30e129(to, from) {
    to.dispatchEvent(new FocusEvent('focus', {
        relatedTarget: from
    }));
    to.dispatchEvent(new FocusEvent('focusin', {
        bubbles: true,
        relatedTarget: from
    }));
}
function $4f541c01c875ab4e$export$759df0d867455a91(document) {
    let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)(document);
    let activeDescendant = activeElement?.getAttribute('aria-activedescendant');
    if (activeDescendant) return document.getElementById(activeDescendant) || activeElement;
    return activeElement;
}


//# sourceMappingURL=virtualFocus.cjs.map
