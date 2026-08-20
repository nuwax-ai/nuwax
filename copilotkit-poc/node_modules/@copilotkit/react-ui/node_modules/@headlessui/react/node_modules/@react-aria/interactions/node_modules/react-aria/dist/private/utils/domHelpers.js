const $cc3c3666b64debad$export$b204af158042fbac = (el)=>{
    var _el_ownerDocument;
    return (_el_ownerDocument = el === null || el === void 0 ? void 0 : el.ownerDocument) !== null && _el_ownerDocument !== void 0 ? _el_ownerDocument : document;
};
const $cc3c3666b64debad$export$f21a1ffae260145a = (el)=>{
    if (el && 'window' in el && el.window === el) return el;
    const doc = $cc3c3666b64debad$export$b204af158042fbac(el);
    return doc.defaultView || window;
};
/**
 * Type guard that checks if a value is a Node. Verifies the presence and type of the nodeType
 * property.
 */ function $cc3c3666b64debad$var$isNode(value) {
    return value !== null && typeof value === 'object' && 'nodeType' in value && typeof value.nodeType === 'number';
}
function $cc3c3666b64debad$export$af51f0f06c0f328a(node) {
    return $cc3c3666b64debad$var$isNode(node) && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in node;
}


export {$cc3c3666b64debad$export$b204af158042fbac as getOwnerDocument, $cc3c3666b64debad$export$f21a1ffae260145a as getOwnerWindow, $cc3c3666b64debad$export$af51f0f06c0f328a as isShadowRoot};
//# sourceMappingURL=domHelpers.js.map
