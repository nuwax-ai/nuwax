var $49582955cc364b1c$exports = require("../domHelpers.cjs");
var $doPez$reactstatelyprivateflagsflags = require("react-stately/private/flags/flags");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "nodeContains", function () { return $da02ee888921bc9e$export$4282f70798064fe0; });
$parcel$export(module.exports, "getActiveElement", function () { return $da02ee888921bc9e$export$cd4e5573fbe2b576; });
$parcel$export(module.exports, "getEventTarget", function () { return $da02ee888921bc9e$export$e58f029f0fbfdb29; });
$parcel$export(module.exports, "isFocusWithin", function () { return $da02ee888921bc9e$export$b4f377a2b6254582; });
// Source: https://github.com/microsoft/tabster/blob/a89fc5d7e332d48f68d03b1ca6e344489d1c3898/src/Shadowdomize/DOMFunctions.ts#L16
/* eslint-disable rsp-rules/no-non-shadow-contains, rsp-rules/safe-event-target */ 

function $da02ee888921bc9e$export$4282f70798064fe0(node, otherNode) {
    if (!(0, $doPez$reactstatelyprivateflagsflags.shadowDOM)()) return otherNode && node ? node.contains(otherNode) : false;
    if (!node || !otherNode) return false;
    let currentNode = otherNode;
    while(currentNode !== null){
        if (currentNode === node) return true;
        if (currentNode.tagName === 'SLOT' && currentNode.assignedSlot) // Element is slotted
        currentNode = currentNode.assignedSlot.parentNode;
        else if ((0, $49582955cc364b1c$exports.isShadowRoot)(currentNode)) // Element is in shadow root
        currentNode = currentNode.host;
        else currentNode = currentNode.parentNode;
    }
    return false;
}
const $da02ee888921bc9e$export$cd4e5573fbe2b576 = (doc = document)=>{
    if (!(0, $doPez$reactstatelyprivateflagsflags.shadowDOM)()) return doc.activeElement;
    let activeElement = doc.activeElement;
    while(activeElement && 'shadowRoot' in activeElement && activeElement.shadowRoot?.activeElement)activeElement = activeElement.shadowRoot.activeElement;
    return activeElement;
};
function $da02ee888921bc9e$export$e58f029f0fbfdb29(event) {
    if ((0, $doPez$reactstatelyprivateflagsflags.shadowDOM)() && event.target instanceof Element && event.target.shadowRoot) {
        if ('composedPath' in event) return event.composedPath()[0] ?? null;
        else if ('composedPath' in event.nativeEvent) return event.nativeEvent.composedPath()[0] ?? null;
    }
    return event.target;
}
function $da02ee888921bc9e$export$b4f377a2b6254582(node) {
    if (!node) return false;
    // Get the active element within the node's parent shadow root (or the document). Can return null.
    let root = node.getRootNode();
    let ownerWindow = (0, $49582955cc364b1c$exports.getOwnerWindow)(node);
    if (!(root instanceof ownerWindow.Document || root instanceof ownerWindow.ShadowRoot)) return false;
    let activeElement = root.activeElement;
    // Check if the active element is within this node. These nodes are within the same shadow root.
    return activeElement != null && node.contains(activeElement);
}


//# sourceMappingURL=DOMFunctions.cjs.map
