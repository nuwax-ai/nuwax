/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=new Set(["children","localName","ref","style","className"]),t=({react:t,tagName:n,elementClass:l,events:a,displayName:c})=>{const s=new Set(Object.keys(a??{})),o=t.forwardRef(((a,c)=>{t.useRef(new Map);const o=t.useRef(null),r={},m={};for(const[t,n]of Object.entries(a))e.has(t)?r["className"===t?"class":t]=n:s.has(t)||t in l.prototype?m[t]=n:r[t]=n;return("litPatchedCreateElement"===t.createElement.name||globalThis.litSsrReactEnabled)&&Object.keys(m).length&&(r._$litProps$=m),t.createElement(n,{...r,ref:t.useCallback((e=>{o.current=e,"function"==typeof c?c(e):null!==c&&(c.current=e)}),[c])})}));return o.displayName=c??l.name,o};export{t as createComponent};
//# sourceMappingURL=create-component.js.map
