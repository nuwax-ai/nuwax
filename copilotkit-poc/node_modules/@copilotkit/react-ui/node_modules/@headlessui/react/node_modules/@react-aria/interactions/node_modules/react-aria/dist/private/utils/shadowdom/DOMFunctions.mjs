import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a, isShadowRoot as $d447af545b77c9f1$export$af51f0f06c0f328a} from "../domHelpers.mjs";
import {shadowDOM as $eXv8n$shadowDOM} from "react-stately/private/flags/flags";

// Source: https://github.com/microsoft/tabster/blob/a89fc5d7e332d48f68d03b1ca6e344489d1c3898/src/Shadowdomize/DOMFunctions.ts#L16
/* eslint-disable rsp-rules/no-non-shadow-contains, rsp-rules/safe-event-target */ 

function $23f2114a1b82827e$export$4282f70798064fe0(node, otherNode) {
    if (!(0, $eXv8n$shadowDOM)()) return otherNode && node ? node.contains(otherNode) : false;
    if (!node || !otherNode) return false;
    let currentNode = otherNode;
    while(currentNode !== null){
        if (currentNode === node) return true;
        if (currentNode.tagName === 'SLOT' && currentNode.assignedSlot) // Element is slotted
        currentNode = currentNode.assignedSlot.parentNode;
        else if ((0, $d447af545b77c9f1$export$af51f0f06c0f328a)(currentNode)) // Element is in shadow root
        currentNode = currentNode.host;
        else currentNode = currentNode.parentNode;
    }
    return false;
}
const $23f2114a1b82827e$export$cd4e5573fbe2b576 = (doc = document)=>{
    if (!(0, $eXv8n$shadowDOM)()) return doc.activeElement;
    let activeElement = doc.activeElement;
    while(activeElement && 'shadowRoot' in activeElement && activeElement.shadowRoot?.activeElement)activeElement = activeElement.shadowRoot.activeElement;
    return activeElement;
};
function $23f2114a1b82827e$export$e58f029f0fbfdb29(event) {
    if ((0, $eXv8n$shadowDOM)() && event.target instanceof Element && event.target.shadowRoot) {
        if ('composedPath' in event) return event.composedPath()[0] ?? null;
        else if ('composedPath' in event.nativeEvent) return event.nativeEvent.composedPath()[0] ?? null;
    }
    return event.target;
}
function $23f2114a1b82827e$export$b4f377a2b6254582(node) {
    if (!node) return false;
    // Get the active element within the node's parent shadow root (or the document). Can return null.
    let root = node.getRootNode();
    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(node);
    if (!(root instanceof ownerWindow.Document || root instanceof ownerWindow.ShadowRoot)) return false;
    let activeElement = root.activeElement;
    // Check if the active element is within this node. These nodes are within the same shadow root.
    return activeElement != null && node.contains(activeElement);
}


export {$23f2114a1b82827e$export$4282f70798064fe0 as nodeContains, $23f2114a1b82827e$export$cd4e5573fbe2b576 as getActiveElement, $23f2114a1b82827e$export$e58f029f0fbfdb29 as getEventTarget, $23f2114a1b82827e$export$b4f377a2b6254582 as isFocusWithin};
//# sourceMappingURL=DOMFunctions.mjs.map
