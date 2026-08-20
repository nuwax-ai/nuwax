/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=Promise.resolve();class s{constructor(t,s){this.o=[],this.t=!0,this.i=!1,this.l=t,this.h=s,this.u=new Promise(((t,s)=>{this.p=t}))}addController(t){this.o.push(t)}removeController(t){this.o?.splice(this.o.indexOf(t)>>>0,1)}requestUpdate(){this.t||(this.t=!0,t.then((()=>this.h(++this.l))))}get updateComplete(){return this.u}m(){this.i=!0,this.o.forEach((t=>t.hostConnected?.()))}_(){this.i=!1,this.o.forEach((t=>t.hostDisconnected?.()))}v(){this.o.forEach((t=>t.hostUpdate?.()))}C(){this.t=!1;const t=this.p;this.u=new Promise(((t,s)=>{this.p=t})),this.o.forEach((t=>t.hostUpdated?.())),t(this.t)}}const e=(e,i)=>{const{useState:h,useLayoutEffect:o}=e,[n,r]=h(0);let c=!1;const[u]=h((()=>{const e=new s(n,r),h=i(e);return e.M=h,e.m(),c=!0,t.then((()=>{c&&e._()})),e}));return u.t=!0,o((()=>(c=!1,u.i||u.m(),()=>u._())),[]),o((()=>u.C())),u.v(),u.M};export{e as useController};
//# sourceMappingURL=use-controller.js.map
