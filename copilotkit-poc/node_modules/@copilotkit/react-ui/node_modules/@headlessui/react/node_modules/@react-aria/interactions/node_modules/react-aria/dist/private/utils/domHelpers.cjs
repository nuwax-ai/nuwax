
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "getOwnerDocument", function () { return $49582955cc364b1c$export$b204af158042fbac; });
$parcel$export(module.exports, "getOwnerWindow", function () { return $49582955cc364b1c$export$f21a1ffae260145a; });
$parcel$export(module.exports, "isShadowRoot", function () { return $49582955cc364b1c$export$af51f0f06c0f328a; });
const $49582955cc364b1c$export$b204af158042fbac = (el)=>{
    return el?.ownerDocument ?? document;
};
const $49582955cc364b1c$export$f21a1ffae260145a = (el)=>{
    if (el && 'window' in el && el.window === el) return el;
    const doc = $49582955cc364b1c$export$b204af158042fbac(el);
    return doc.defaultView || window;
};
/**
 * Type guard that checks if a value is a Node. Verifies the presence and type of the nodeType
 * property.
 */ function $49582955cc364b1c$var$isNode(value) {
    return value !== null && typeof value === 'object' && 'nodeType' in value && typeof value.nodeType === 'number';
}
function $49582955cc364b1c$export$af51f0f06c0f328a(node) {
    return $49582955cc364b1c$var$isNode(node) && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in node;
}


//# sourceMappingURL=domHelpers.cjs.map
