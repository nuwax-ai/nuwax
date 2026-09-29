import{o as e}from"./rolldown-runtime-C0FnF6B9.js";import{Ot as t,W as n,t as r,x as i}from"./jsx-runtime-DiiB9tZd.js";import{c as a,o}from"./collab-BgrD1QWh.js";import{t as s}from"./FullscreenButton-BuaTuylN.js";var c=e(t(),1),l=r();function u({html:e}){let[t,n]=(0,c.useState)([]),[r,i]=(0,c.useState)(0),a=(0,c.useRef)(null);(0,c.useEffect)(()=>{let t=document.createElement(`div`);t.innerHTML=e,n(Array.from(t.querySelectorAll(`.pptx-slide`)).map(e=>e.outerHTML)),i(0)},[e]);let o=t.length;return(0,l.jsxs)(`div`,{className:`pptx-preview`,ref:a,children:[(0,l.jsx)(`div`,{className:`pptx-preview__slides`,children:t.map((e,t)=>(0,l.jsx)(`div`,{className:`pptx-preview__frame`,style:{display:t===r?`flex`:`none`},dangerouslySetInnerHTML:{__html:e}},t))}),o>0&&(0,l.jsxs)(`div`,{className:`pptx-preview__nav`,children:[(0,l.jsx)(`button`,{type:`button`,disabled:r<=0,onClick:()=>i(e=>Math.max(0,e-1)),children:`上一页`}),(0,l.jsxs)(`span`,{className:`pptx-preview__page`,children:[r+1,` / `,o]}),(0,l.jsx)(`button`,{type:`button`,disabled:r>=o-1,onClick:()=>i(e=>Math.min(o-1,e+1)),children:`下一页`})]}),(0,l.jsx)(s,{getTarget:()=>a.current,autoHide:!0})]})}var d=320;function f(e){let[t,n]=(0,c.useState)(null),r=(0,c.useCallback)(()=>{let t=e.current;if(t==null)return;let r=Math.max(0,t.getBoundingClientRect().top),i=Math.max(d,Math.round(window.innerHeight-r));n(e=>e===i?e:i)},[e]);return(0,c.useEffect)(()=>{r();let e=requestAnimationFrame(r),t=()=>{r(),requestAnimationFrame(r)};return window.addEventListener(`resize`,r),document.addEventListener(`fullscreenchange`,t),()=>{cancelAnimationFrame(e),window.removeEventListener(`resize`,r),document.removeEventListener(`fullscreenchange`,t)}},[r]),t}async function p(e,t,n){let r=await a(t),i={"Content-Type":`application/json`};r&&(i.Authorization=`Bearer ${r}`);let s=n!=null,c=await fetch(`${o()}/internal/datatable/${encodeURIComponent(e)}`,{method:s?`POST`:`GET`,credentials:`include`,headers:i,body:s?JSON.stringify({ops:n}):void 0}),l=await c.json().catch(()=>({}));if(!c.ok)throw Error(typeof l.error==`string`?l.error:`数据表接口错误 ${c.status}`);return l}function m(e,t){let n=t?.shareToken??null,r=t=>p(e,n,t).then(()=>void 0),i=(e,t)=>t!=null&&t!==``?{...e,sheetId:t}:e;return{read:()=>p(e,n).then(e=>e),setCellValue:(e,t,n,a)=>r([i({op:`setCellValue`,row:e,col:t,value:n},a)]),appendRecord:(e,t)=>r([i({op:`appendRecord`,values:e},t)]),insertRecordAt:(e,t)=>r([i({op:`insertRecordAt`,row:e},t)]),removeRecordAt:(e,t)=>r([i({op:`removeRecordAt`,row:e},t)]),setField:(e,t,n={type:`text`},a)=>r([i({op:`setField`,col:e,name:t,schema:n},a)]),addField:(e,t,n={type:`text`},a)=>r([i({op:`addField`,col:e,name:t,schema:n},a)]),removeField:(e,t)=>r([i({op:`removeField`,col:e},t)]),setViewMeta:(e,t)=>r([i({op:`setViewMeta`,viewMeta:e},t)])}}function h(e){return JSON.stringify(e).replace(/</g,`\\u003c`).replace(/>/g,`\\u003e`).replace(/&/g,`\\u0026`)}async function g(e,t){let n=/<meta[^>]*name=["']repo-datatable-source["'][^>]*>/i.exec(e);if(n==null)return e;let r=/content=["']([^"']*)["']/i.exec(n[0]),i=r==null?``:r[1];if(i===``)return e;let a=`<script>
/* 静态导出：数据表快照内嵌，本地打开无需宿主 SDK（只读实现，写方法均拒绝） */
(function () {
  var snap = ${h({...await m(i,{shareToken:t}).read(),editable:!1})};
  window.repoDatatable = {
    read: function () { return Promise.resolve(snap); },
    setCellValue: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    appendRecord: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    insertRecordAt: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    removeRecordAt: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    setField: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    addField: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    removeField: function () { return Promise.reject(new Error('静态导出的数据为只读')); },
    setViewMeta: function () { return Promise.reject(new Error('静态导出的数据为只读')); }
  };
})();
<\/script>`;return/<\/head>/i.test(e)?e.replace(/<\/head>/i,`${a}\n</head>`):`${a}\n${e}`}var _=`repo-datatable`,v=`repo-host`,y=[`read`,`setCellValue`,`appendRecord`,`insertRecordAt`,`removeRecordAt`,`setField`,`addField`,`removeField`,`setViewMeta`],b=new Set([`setCellValue`,`appendRecord`,`insertRecordAt`,`removeRecordAt`,`setField`,`addField`,`removeField`,`setViewMeta`]),x=[`getTitle`,`getPref`,`setPref`,`resolveFileUrl`],S=/^\/api\/f\/[^?#"']+$/,C=200,w=8,T=2e6,E=64,D=8192;function O(e){if(typeof e!=`object`||!e||Array.isArray(e))return!1;let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function k(e){return e==null||typeof e==`string`||typeof e==`number`||typeof e==`boolean`}function A(e,t){return typeof e==`number`&&Number.isInteger(e)&&e>=t}function j(e){return e==null||typeof e==`string`}function M(e){try{return JSON.stringify(e).length<=T}catch{return!1}}function N(e,t){if(!Array.isArray(t))return`参数格式错误`;let n=t;switch(e){case`read`:return n.length===0?null:`参数格式错误`;case`setCellValue`:return A(n[0],1)?A(n[1],0)?k(n[2])?n.length>3&&!j(n[3])?`sheetId 类型非法`:null:`value 类型非法`:`col 必须是 ≥0 的整数`:`row 必须是 ≥1 的整数`;case`appendRecord`:if(!O(n[0]))return`values 必须是对象`;for(let[e,t]of Object.entries(n[0])){if(!/^\d+$/.test(e))return`values 的键必须是列号`;if(!k(t))return`values 的值类型非法`}return M(n[0])?n.length>1&&!j(n[1])?`sheetId 类型非法`:null:`values 体积超限`;case`insertRecordAt`:case`removeRecordAt`:return A(n[0],1)?n.length>1&&!j(n[1])?`sheetId 类型非法`:null:`row 必须是 ≥1 的整数`;case`setField`:case`addField`:return A(n[0],0)?typeof n[1]!=`string`||n[1].length>256?`name 非法`:n.length>2&&n[2]!=null&&(!O(n[2])||!M(n[2]))?`schema 非法`:n.length>3&&!j(n[3])?`sheetId 类型非法`:null:`col 必须是 ≥0 的整数`;case`removeField`:return A(n[0],0)?n.length>1&&!j(n[1])?`sheetId 类型非法`:null:`col 必须是 ≥0 的整数`;case`setViewMeta`:return n[0]!=null&&(!O(n[0])||!M(n[0]))?`viewMeta 非法`:n.length>1&&!j(n[1])?`sheetId 类型非法`:null;default:return`不支持的调用`}}function P(e,t){let n=e=>e<t.length?t[e]:void 0;switch(e){case`read`:return[];case`setCellValue`:return[n(0),n(1),n(2),n(3)];case`appendRecord`:return[n(0),n(1)];case`insertRecordAt`:case`removeRecordAt`:case`removeField`:return[n(0),n(1)];case`setField`:case`addField`:return[n(0),n(1),n(2),n(3)];case`setViewMeta`:return[n(0),n(1)];default:return[]}}function F(e){let{client:t}=e,n=`repo.pivot.pref.${e.prefNamespace??`default`}.`,r=null,i=0,a=``,o=!1,s=new Map,c=t=>{let n=e.getFrameWindow();if(!(n==null||o))try{n.postMessage(t,`*`)}catch{}},l=(e,t)=>{c({ch:_,id:e,ok:!0,result:t})},u=(e,t)=>{c({ch:_,id:e,ok:!1,error:t})},d=e=>{if(typeof e!=`string`||e.length===0||e.length>E)return null;try{return window.localStorage.getItem(n+e)}catch{return null}},f=(e,t)=>{if(typeof e!=`string`||e.length===0||e.length>E||typeof t!=`string`||t.length>D)return!1;try{return window.localStorage.setItem(n+e,t),!0}catch{return!1}},p=(t,n,r)=>{let i=(e,n,r)=>c({ch:v,id:t,ok:e,...e?{result:n}:{error:r}});if(typeof n!=`string`||!x.includes(n)){i(!1,void 0,`不支持的调用`);return}switch(n){case`getTitle`:i(!0,document.title);return;case`getPref`:i(!0,d(r[0]));return;case`setPref`:i(!0,f(r[0],r[1]));return;case`resolveFileUrl`:{let t=r[0];if(typeof t!=`string`||!S.test(t)){i(!1,void 0,`非法的文件路径`);return}if(e.resolveFileUrl==null){i(!1,void 0,`宿主未提供文件换址能力`);return}if(s.has(t)){i(!0,s.get(t)??null);return}Promise.resolve().then(()=>e.resolveFileUrl?.(t)??null).then(e=>{let n=typeof e==`string`&&e!==``?e:null;s.size>=C&&s.clear(),s.set(t,n),i(!0,n)}).catch(()=>i(!0,null));return}default:i(!1,void 0,`不支持的调用`)}},m=(e,n,a)=>{if(typeof n!=`string`||!y.includes(n)){u(e,`不支持的调用`);return}let s=n,c=N(s,a);if(c!=null){u(e,c);return}if(r===!1&&b.has(s)){u(e,`当前会话为只读，无法写入`);return}if(i>=w){u(e,`并发请求过多，请稍后重试`);return}let d=t[s];if(typeof d!=`function`){u(e,`不支持的调用`);return}i+=1,Promise.resolve().then(()=>d.apply(t,P(s,a))).then(t=>{o||(s===`read`&&O(t)&&typeof t.editable==`boolean`&&(r=t.editable),l(e,t??null))}).catch(t=>{o||u(e,t instanceof Error?t.message:`调用失败`)}).finally(()=>{i=Math.max(0,i-1)})},h=t=>{if(o)return;let n=e.getFrameWindow();if(n==null||t.source!==n)return;let r=t.data;if(!O(r))return;let i=r.ch;if(i!==`repo-datatable`&&i!==`repo-host`)return;if(i===`repo-host`&&typeof r.type==`string`){r.type===`hello`&&(c({ch:v,type:`ready`}),c({ch:v,type:`title`,value:a}));return}let s=r.id;if(typeof s!=`number`||!Number.isInteger(s))return;let l=Array.isArray(r.args)?r.args:[];i===`repo-host`?p(s,r.method,l):m(s,r.method,l)};return window.addEventListener(`message`,h),{dispose(){o||(o=!0,window.removeEventListener(`message`,h))},pushTitle(e){a=e,c({ch:v,type:`title`,value:e})}}}var I=15e3,L=`<meta http-equiv="Content-Security-Policy" content="form-action 'none'; base-uri 'none'; object-src 'none'">`,R=`(function () {
  var CH_DATA = ${JSON.stringify(_)};
  var CH_HOST = ${JSON.stringify(v)};
  var TIMEOUT = ${I};
  var rid = 0;
  var pending = {};
  var ready = false;
  var queue = [];
  var title = document.title || '';
  var titleHooks = [];

  function send(msg) {
    try { parent.postMessage(msg, '*'); } catch (e) { /* 父层已卸载 */ }
  }

  function call(ch, method, args) {
    return new Promise(function (resolve, reject) {
      var id = ++rid;
      pending[id] = { resolve: resolve, reject: reject };
      send({ ch: ch, id: id, method: method, args: args });
      setTimeout(function () {
        if (!pending[id]) return;
        delete pending[id];
        reject(new Error('宿主未响应（超时）'));
      }, TIMEOUT);
    });
  }

  /* ready 之前把调用排进队列：父层监听器晚挂也不会丢首批请求 */
  function via(ch, method, args) {
    if (ready) return call(ch, method, args);
    return new Promise(function (resolve, reject) {
      queue.push(function () { call(ch, method, args).then(resolve, reject); });
    });
  }

  function flush() {
    var q = queue;
    queue = [];
    for (var i = 0; i < q.length; i++) { try { q[i](); } catch (e) { /* 单条失败不影响其余 */ } }
  }

  window.addEventListener('message', function (e) {
    /* 只认父窗口：iframe 内若被页面自己嵌了别的 iframe，其消息 source 不等于 parent */
    if (e.source !== parent) return;
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.ch === CH_HOST && d.type === 'ready') { ready = true; flush(); return; }
    if (d.ch === CH_HOST && d.type === 'title') {
      title = d.value == null ? '' : String(d.value);
      for (var i = 0; i < titleHooks.length; i++) { try { titleHooks[i](title); } catch (e) {} }
      return;
    }
    if (d.ch !== CH_DATA && d.ch !== CH_HOST) return;
    if (d.id == null || !pending[d.id]) return;
    var p = pending[d.id];
    delete pending[d.id];
    if (d.ok) p.resolve(d.result);
    else p.reject(new Error(d.error || '调用失败'));
  });

  /* hello 重试：父层监听器就位前发出的消息会丢，故重试至收到 ready（最多 2s） */
  var tries = 0;
  (function hello() {
    send({ ch: CH_HOST, type: 'hello' });
    if (ready) return;
    if (tries++ < 40) { setTimeout(hello, 50); return; }
    ready = true;   /* 兜底放行：让排队的调用以超时错误收场，而不是永久挂起 */
    flush();
  })();

  /* 模板读 document.title 让标题跟随文档重命名；沙箱内改成读父层推送值 */
  try {
    Object.defineProperty(document, 'title', {
      configurable: true,
      get: function () { return title; },
      set: function (v) { title = String(v); }
    });
  } catch (e) { /* 引擎不允许则退回 iframe 自身 title，功能降级不报错 */ }

  /* opaque origin 下 window.localStorage 访问即抛 SecurityError：换成不抛的内存兜底 */
  try {
    var mem = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: function () {
        return {
          getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
          setItem: function (k, v) {
            mem[k] = String(v);
            via(CH_HOST, 'setPref', [String(k), mem[k]]).catch(function () {});
          },
          removeItem: function (k) { delete mem[k]; },
          clear: function () { mem = {}; },
          key: function (i) { return Object.keys(mem)[i] || null; },
          get length() { return Object.keys(mem).length; }
        };
      }
    });
  } catch (e) { /* 改不动就让它按原样抛，由页面自己兜 */ }

  /* sessionStorage 同理抛 SecurityError（2026-09-13 实测：裸沙箱下 localStorage/sessionStorage/document.cookie
     三者访问全抛）。它同样会让「首行就读 sessionStorage」的模板整页白屏，故一并兜住。
     与 localStorage 的差别：**不写回宿主** —— session 语义本就是「本次会话内有效」，
     而这里连「本次会话」都只到 iframe 重载为止（宿主刷新即新 iframe），写回反而制造持久化错觉。 */
  try {
    var sess = {};
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get: function () {
        return {
          getItem: function (k) { return Object.prototype.hasOwnProperty.call(sess, k) ? sess[k] : null; },
          setItem: function (k, v) { sess[k] = String(v); },
          removeItem: function (k) { delete sess[k]; },
          clear: function () { sess = {}; },
          key: function (i) { return Object.keys(sess)[i] || null; },
          get length() { return Object.keys(sess).length; }
        };
      }
    });
  } catch (e) { /* 同上 */ }

  /* 数据表维护 SDK：签名与宿主版 DatatableClient 完全一致 */
  window.repoDatatable = {
    read: function () { return via(CH_DATA, 'read', []); },
    setCellValue: function (row, col, value, sheetId) {
      return via(CH_DATA, 'setCellValue', [row, col, value, sheetId == null ? null : sheetId]);
    },
    appendRecord: function (values, sheetId) {
      return via(CH_DATA, 'appendRecord', [values, sheetId == null ? null : sheetId]);
    },
    insertRecordAt: function (row, sheetId) {
      return via(CH_DATA, 'insertRecordAt', [row, sheetId == null ? null : sheetId]);
    },
    removeRecordAt: function (row, sheetId) {
      return via(CH_DATA, 'removeRecordAt', [row, sheetId == null ? null : sheetId]);
    },
    setField: function (col, name, schema, sheetId) {
      return via(CH_DATA, 'setField', [col, name, schema, sheetId == null ? null : sheetId]);
    },
    addField: function (col, name, schema, sheetId) {
      return via(CH_DATA, 'addField', [col, name, schema, sheetId == null ? null : sheetId]);
    },
    removeField: function (col, sheetId) {
      return via(CH_DATA, 'removeField', [col, sheetId == null ? null : sheetId]);
    },
    setViewMeta: function (viewMeta, sheetId) {
      return via(CH_DATA, 'setViewMeta', [viewMeta, sheetId == null ? null : sheetId]);
    }
  };

  /* 宿主能力：标题 / 跨会话偏好 / 运行时图片换址（异步，真正落宿主 localStorage / 走宿主换址） */
  window.repoHost = {
    getTitle: function () { return title; },
    onTitle: function (fn) { if (typeof fn === 'function') titleHooks.push(fn); },
    getPref: function (key) { return call(CH_HOST, 'getPref', [String(key)]); },
    setPref: function (key, value) { return call(CH_HOST, 'setPref', [String(key), String(value)]); },
    /* 走 via：解析期就存在的 <img> 可能早于握手完成，排队不丢 */
    resolveFileUrl: function (path) { return via(CH_HOST, 'resolveFileUrl', [String(path)]); }
  };

  /* 运行时图片换址（#93）：模板用记录数据拼 <img src="/api/f/{key}"> 发生在沙箱内运行时，
     宿主渲染前的静态换址（改写 html 源码里的 src）够不到；opaque origin 请求不带登录 cookie → 401 裂图。
     这里观察 DOM（含后续插入/改 src），命中裸相对 /api/f/{key} 就问宿主换免登录直访地址再写回。
     只认「裸相对、无查询串」：换回来的地址带 ak/预签名查询串或是绝对地址，不会再命中，天然防回路；
     换不到（resolve 回 null）保留原 src，裂图但不影响其余渲染。 */
  var FILE_SRC_RE = /^\\/api\\/f\\/[^?#"']+$/;
  function fixMediaSrc(el) {
    if (!el || el.nodeType !== 1) return;
    var seen = el.__repoFileSeen || (el.__repoFileSeen = {});
    var attrs = ['src', 'poster'];   /* <video> 可同时有 poster + src，故两个都查、不提前 return */
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      var v = el.getAttribute(attr);
      if (!v || !FILE_SRC_RE.test(v) || seen[attr] === v) continue;
      seen[attr] = v;   /* 同一个裸地址只问宿主一次；换不到（回 null）也不反复重试 */
      (function (node, a, old) {
        window.repoHost.resolveFileUrl(old).then(function (url) {
          if (typeof url === 'string' && url) node.setAttribute(a, url);
        }).catch(function () {});
      })(el, attr, v);
    }
  }
  function scanMedia(root) {
    if (root && root.nodeType === 1) fixMediaSrc(root);
    var scope = root && root.nodeType === 1 ? root : document;
    if (!scope.querySelectorAll) return;
    var list = scope.querySelectorAll('img[src],video[src],video[poster],audio[src],source[src]');
    for (var i = 0; i < list.length; i++) fixMediaSrc(list[i]);
  }
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) scanMedia(m.addedNodes[j]);
        } else {
          fixMediaSrc(m.target);
        }
      }
    });
    var startObserve = function () {
      mo.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'poster']
      });
      scanMedia(document);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserve);
    else startObserve();
  }

  /* 这里曾有「高度上报」（ResizeObserver + load + setInterval(1000) 读 scrollHeight 报给父层，
     父层写进 iframe.style.height），2026-09-13 连同父层的 height 消息分支一起移除。
     原因：iframe 高度 = 可视区高度（父层 JS 量取，见 src/hooks/useFillHeight.ts），与内容无关，
     上报值不再被消费；而它与页面里的视口单位（100vh / min-h-screen / dvh）构成正反馈回路
     （上报 scrollHeight → iframe 变高 → 子页面视口变高 → 100vh 跟着变高 → 下次上报更大），
     线上实测每 700ms +688px 直到 40000px 封顶。附带好处：省掉每秒读 scrollHeight 触发的强制回流。
     ⚠️ 若要恢复「按内容自适应高度」，不能只是把这段加回来：必须同时解决回声（自己写的高度
     被下一次量取读回来）与该回路，历史实现见 git log。 */
})();`;function z(e){let t=`${L}\n<script>${R}<\/script>\n`;return/<head[^>]*>/i.test(e)?e.replace(/<head[^>]*>/i,e=>`${e}\n${t}`):/<html[^>]*>/i.test(e)?e.replace(/<html[^>]*>/i,e=>`${e}<head>${t}</head>`):`${t}${e}`}var B=`html-runtime`;function V(e){return/<meta[^>]+name=["']repo-datatable-source["']/i.test(e)}function H(e){let t=/<meta[^>]+name=["']repo-datatable-source["'][^>]*>/i.exec(e);if(t==null)return``;let n=/content=["']([^"']*)["']/i.exec(t[0]);return n==null?``:n[1]}function U({html:e,shareToken:t}){let r=(0,c.useRef)(null),a=(0,c.useRef)(null),o=f(a),s=(0,c.useMemo)(()=>z(e),[e]);return(0,c.useLayoutEffect)(()=>{let a=H(e),o=F({getFrameWindow:()=>r.current?.contentWindow??null,client:m(a,{shareToken:t??null}),prefNamespace:a===``?void 0:a,resolveFileUrl:e=>{let r=e.slice(7);return r===``?null:t!=null&&t!==``?n(t,r):i(e).catch(()=>null)}});o.pushTitle(document.title);let s=document.querySelector(`title`),c=null;return s!=null&&(c=new MutationObserver(()=>o.pushTitle(document.title)),c.observe(s,{childList:!0,characterData:!0,subtree:!0})),()=>{c?.disconnect(),o.dispose()}},[e,t]),(0,l.jsx)(`div`,{className:B,ref:a,children:(0,l.jsx)(`iframe`,{ref:r,title:`数据表透视页`,srcDoc:s,sandbox:`allow-scripts allow-forms allow-modals`,style:{height:o??void 0}})})}export{u as a,f as i,V as n,g as r,U as t};