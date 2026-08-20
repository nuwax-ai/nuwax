/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=new Set(["children","localName","ref","style","className"]),n=new WeakMap,t=(e,t,o,l,a)=>{const s=a?.[t];void 0===s?(e[t]=o,null==o&&t in HTMLElement.prototype&&e.removeAttribute(t)):o!==l&&((e,t,o)=>{let l=n.get(e);void 0===l&&n.set(e,l=new Map);let a=l.get(t);void 0!==o?void 0===a?(l.set(t,a={handleEvent:o}),e.addEventListener(t,a)):a.handleEvent=o:void 0!==a&&(l.delete(t),e.removeEventListener(t,a))})(e,s,o)},o=({react:n,tagName:o,elementClass:l,events:a,displayName:s})=>{const c=new Set(Object.keys(a??{})),r=n.forwardRef(((s,r)=>{const i=n.useRef(new Map),d=n.useRef(null),f={},u={};for(const[n,t]of Object.entries(s))e.has(n)?f["className"===n?"class":n]=t:c.has(n)||n in l.prototype?u[n]=t:f[n]=t;return n.useLayoutEffect((()=>{if(null===d.current)return;const e=new Map;for(const n in u)t(d.current,n,s[n],i.current.get(n),a),i.current.delete(n),e.set(n,s[n]);for(const[e,n]of i.current)t(d.current,e,void 0,n,a);i.current=e})),n.useLayoutEffect((()=>{d.current?.removeAttribute("defer-hydration")}),[]),f.suppressHydrationWarning=!0,n.createElement(o,{...f,ref:n.useCallback((e=>{d.current=e,"function"==typeof r?r(e):null!==r&&(r.current=e)}),[r])})}));return r.displayName=s??l.name,r};export{o as createComponent};
//# sourceMappingURL=create-component.js.map
