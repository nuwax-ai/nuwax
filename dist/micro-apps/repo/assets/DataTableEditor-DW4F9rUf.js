const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/SheetEditor-BbnchVV9.js","assets/rolldown-runtime-C0FnF6B9.js","assets/jsx-runtime-CrbV5c8e.js","assets/react-dom-DzAjJk52.js","assets/icons-B1KDTxvP.js","assets/collab-D2GrOYOs.js","assets/pptx-ttoSlMzt.js","assets/jszip.min-BXqW2-9v.js","assets/import-busy-BKGe4TT_.js","assets/index-Dlk018Vj.js","assets/Avatar-DwZvEN3N.js","assets/open-file-picker-BVYqoNs2.js","assets/useTreeChannel-B7kNiO9q.js","assets/index-DGos4oBd.css","assets/floating-ui.dom-C2Ihx1xU.js","assets/y-indexeddb-Dwh-kfyT.js","assets/merge-BqA_GkwT.js","assets/set-DiDbwdfY.js","assets/FullscreenButton-DPnME9d8.js","assets/es-BFOyIn3Y.js","assets/dataTable-DMBqIaOg.js","assets/sheet-TSxlQVp0.js","assets/SheetEditor-7RO4nLi5.css"])))=>i.map(i=>d[i]);
import{o as e,t}from"./rolldown-runtime-C0FnF6B9.js";import{At as n,Ct as r,F as i,Nt as a,S as o,St as s,Tt as c,V as l,Y as u,kt as d,lt as f,s as p,st as m,t as h,z as g}from"./jsx-runtime-CrbV5c8e.js";import{t as _}from"./react-dom-DzAjJk52.js";import{st as v}from"./icons-B1KDTxvP.js";import{m as y,o as b,r as x}from"./Avatar-DwZvEN3N.js";import{_t as S,c as ee,d as te,dt as ne,h as C,ht as re,t as ie,y as w}from"./collab-D2GrOYOs.js";import{a as ae}from"./comment-anchor-D23pp_jt.js";import{Xt as T}from"./es-BFOyIn3Y.js";import{C as oe,S as E,a as se,b as ce,c as D,d as O,f as le,g as ue,h as de,i as k,n as fe,p as A,r as j,t as pe,v as M,x as N,y as me}from"./dataTable-DMBqIaOg.js";import{t as he}from"./CommentsPanel-CS7BhYXx.js";var P=e(a(),1),ge=e(_(),1),F=class extends Error{code;constructor(e){super(e),this.code=e}};function _e(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(r===` `||r===`	`||r===`
`||r===`\r`){n++;continue}if(r===`[`){let r=e.indexOf(`]`,n+1);if(r<0)throw new F(`#ERROR`);t.push({t:`field`,v:e.slice(n+1,r)}),n=r+1;continue}if(r===`"`||r===`'`){let i=n+1,a=``;for(;i<e.length&&e[i]!==r;)e[i]===`\\`&&i+1<e.length?(a+=e[i+1],i+=2):(a+=e[i],i++);if(i>=e.length)throw new F(`#ERROR`);t.push({t:`str`,v:a}),n=i+1;continue}if(/[0-9.]/.test(r)){let r=n;for(;r<e.length&&/[0-9.]/.test(e[r]);)r++;let i=Number(e.slice(n,r));if(Number.isNaN(i))throw new F(`#VALUE!`);t.push({t:`num`,v:i}),n=r;continue}if(/[A-Za-z_一-龥]/.test(r)){let r=n;for(;r<e.length&&/[A-Za-z0-9_一-龥]/.test(e[r]);)r++;t.push({t:`ident`,v:e.slice(n,r)}),n=r;continue}let i=e.slice(n,n+2);if(i===`<>`||i===`<=`||i===`>=`){t.push({t:`op`,v:i}),n+=2;continue}if(`+-*/&=<>(),`.includes(r)){t.push({t:`op`,v:r}),n++;continue}throw new F(`#ERROR`)}return t}var ve=class{tokens;pos=0;constructor(e){this.tokens=e}peek(){return this.tokens[this.pos]}eatOp(e){let t=this.peek();return t!=null&&t.t===`op`&&t.v===e&&(this.pos++,!0)}expectOp(e){if(!this.eatOp(e))throw new F(`#ERROR`)}parse(){let e=this.parseCompare();if(this.pos<this.tokens.length)throw new F(`#ERROR`);return e}parseCompare(){let e=this.parseConcat();for(;;){let t=this.peek();if(t!=null&&t.t===`op`&&[`=`,`<>`,`<`,`>`,`<=`,`>=`].includes(t.v))this.pos++,e={k:`binary`,op:t.v,left:e,right:this.parseConcat()};else return e}}parseConcat(){let e=this.parseAdd();for(;this.eatOp(`&`);)e={k:`binary`,op:`&`,left:e,right:this.parseAdd()};return e}parseAdd(){let e=this.parseMul();for(;;){let t=this.peek();if(t!=null&&t.t===`op`&&(t.v===`+`||t.v===`-`))this.pos++,e={k:`binary`,op:t.v,left:e,right:this.parseMul()};else return e}}parseMul(){let e=this.parseUnary();for(;;){let t=this.peek();if(t!=null&&t.t===`op`&&(t.v===`*`||t.v===`/`))this.pos++,e={k:`binary`,op:t.v,left:e,right:this.parseUnary()};else return e}}parseUnary(){return this.eatOp(`-`)?{k:`unary`,op:`-`,operand:this.parseUnary()}:this.eatOp(`+`)?this.parseUnary():this.parsePrimary()}parsePrimary(){let e=this.peek();if(e==null)throw new F(`#ERROR`);if(e.t===`num`||e.t===`str`)return this.pos++,{k:`lit`,v:e.v};if(e.t===`field`)return this.pos++,{k:`field`,name:e.v};if(e.t===`ident`){this.pos++;let t=e.v.toLowerCase();if(t===`true`)return{k:`lit`,v:!0};if(t===`false`)return{k:`lit`,v:!1};this.expectOp(`(`);let n=[];if(!this.eatOp(`)`)){for(;;)if(n.push(this.parseCompare()),!this.eatOp(`,`)){this.expectOp(`)`);break}}return{k:`call`,name:e.v.toUpperCase(),args:n}}if(e.t===`op`&&e.v===`(`){this.pos++;let e=this.parseCompare();return this.expectOp(`)`),e}throw new F(`#ERROR`)}};function I(e){return e==null||typeof e==`string`&&e.length===0}function L(e){if(e==null)return 0;if(typeof e==`number`)return e;if(typeof e==`boolean`)return+!!e;let t=e.trim();if(t.length===0)return 0;let n=Number(t);if(Number.isNaN(n))throw new F(`#VALUE!`);return n}function R(e){return e==null?``:typeof e==`boolean`?e?`TRUE`:`FALSE`:String(e)}function z(e){if(e==null)return!1;if(typeof e==`boolean`)return e;if(typeof e==`number`)return e!==0;let t=e.trim().toLowerCase();if(t===`true`)return!0;if(t===`false`)return!1;let n=Number(t);return Number.isNaN(n)?t.length>0:n!==0}function B(e){if(!Number.isFinite(e))throw new F(`#VALUE!`);return Number.isInteger(e)?e:Number(e.toFixed(10))}function V(e){return String(e).padStart(2,`0`)}function H(e){return`${e.getFullYear()}-${V(e.getMonth()+1)}-${V(e.getDate())}`}function U(e){return`${H(e)} ${V(e.getHours())}:${V(e.getMinutes())}`}function W(e,t){let n=()=>t.map(L);switch(e){case`SUM`:return B(n().reduce((e,t)=>e+t,0));case`AVG`:case`AVERAGE`:{let e=n();if(e.length===0)throw new F(`#DIV/0!`);return B(e.reduce((e,t)=>e+t,0)/e.length)}case`MAX`:return t.length===0?0:B(Math.max(...n()));case`MIN`:return t.length===0?0:B(Math.min(...n()));case`COUNT`:return t.filter(e=>!I(e)&&!Number.isNaN(Number(e))).length;case`COUNTA`:return t.filter(e=>!I(e)).length;case`ROUND`:{let[e,t=0]=n(),r=10**Math.trunc(t);return B(Math.round(e*r)/r)}case`ABS`:return B(Math.abs(L(t[0])));case`INT`:return Math.trunc(L(t[0]));case`MOD`:{let e=L(t[1]);if(e===0)throw new F(`#DIV/0!`);return B(L(t[0])%e)}case`POWER`:return B(L(t[0])**L(t[1]));case`SQRT`:{let e=L(t[0]);if(e<0)throw new F(`#VALUE!`);return B(Math.sqrt(e))}case`CONCAT`:case`CONCATENATE`:return t.map(R).join(``);case`LEN`:return R(t[0]).length;case`UPPER`:return R(t[0]).toUpperCase();case`LOWER`:return R(t[0]).toLowerCase();case`TRIM`:return R(t[0]).trim();case`LEFT`:return R(t[0]).slice(0,Math.max(0,Math.trunc(L(t[1]))));case`RIGHT`:{let e=R(t[0]),n=Math.max(0,Math.trunc(L(t[1])));return n===0?``:e.slice(-n)}case`MID`:{let e=R(t[0]),n=Math.max(1,Math.trunc(L(t[1]))),r=Math.max(0,Math.trunc(L(t[2])));return e.slice(n-1,n-1+r)}case`IF`:return z(t[0])?t[1]:t[2]??!1;case`AND`:return t.every(z);case`OR`:return t.some(z);case`NOT`:return!z(t[0]);case`ISBLANK`:return I(t[0]);case`TODAY`:return H(new Date);case`NOW`:return U(new Date);case`YEAR`:return new Date(R(t[0])).getFullYear()||0;case`MONTH`:return(new Date(R(t[0])).getMonth()||0)+1;case`DAY`:return new Date(R(t[0])).getDate()||0;default:throw new F(`#NAME?`)}}function G(e,t){switch(e.k){case`lit`:return e.v;case`field`:{let n=t(e.name);if(n===void 0)throw new F(`#NAME?`);return n}case`unary`:return B(-L(G(e.operand,t)));case`binary`:{let{op:n}=e;if(n===`&`)return R(G(e.left,t))+R(G(e.right,t));let r=G(e.left,t),i=G(e.right,t);switch(n){case`+`:return B(L(r)+L(i));case`-`:return B(L(r)-L(i));case`*`:return B(L(r)*L(i));case`/`:{let e=L(i);if(e===0)throw new F(`#DIV/0!`);return B(L(r)/e)}case`=`:return K(r,i);case`<>`:return!K(r,i);case`<`:return q(r,i)<0;case`>`:return q(r,i)>0;case`<=`:return q(r,i)<=0;case`>=`:return q(r,i)>=0;default:throw new F(`#ERROR`)}}case`call`:return e.name===`IF`?z(G(e.args[0],t))?G(e.args[1],t):e.args[2]!=null&&G(e.args[2],t):W(e.name,e.args.map(e=>G(e,t)))}}function K(e,t){if(I(e)&&I(t))return!0;let n=Number(R(e)),r=Number(R(t));return!I(e)&&!I(t)&&!Number.isNaN(n)&&!Number.isNaN(r)?n===r:R(e)===R(t)}function q(e,t){let n=Number(R(e)),r=Number(R(t));return!I(e)&&!I(t)&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:R(e).localeCompare(R(t),`zh-CN`)}function ye(e,t){let n=(e??``).trim();if(n.length===0)return``;try{let e=G(new ve(_e(n)).parse(),t);return typeof e==`number`?B(e):e??``}catch(e){return e instanceof F?e.code:`#ERROR`}}var be=`opLog`,xe=`meta`,Se=`sheet.mutation.insert-sheet`,Ce=`sheet.mutation.remove-sheet`,we=`sheet.mutation.set-range-values`,Te=`sheet.mutation.set-worksheet-row-count`,Ee=`sheet.mutation.set-worksheet-column-count`;function De(){return{id:`replay-default`,name:``,appVersion:`0.1.0`,locale:T.ZH_CN,styles:{},sheetOrder:[`sheet-1`],sheets:{"sheet-1":{id:`sheet-1`,name:`Sheet 1`,rowCount:20,columnCount:20,cellData:{},mergeData:[],rowData:{},columnData:{},rowHeader:{width:46},columnHeader:{height:20},hidden:0,zoomRatio:1,scrollTop:0,scrollLeft:0,defaultColumnWidth:73,defaultRowHeight:23}}}}function Oe(e,t,n){let r=e.sheets?.[t];if(r==null||typeof n!=`object`||!n)return;let i=r.cellData??={};for(let[e,t]of Object.entries(n)){let n=Number(e);if(!(!Number.isInteger(n)||n<0)&&!(typeof t!=`object`||!t))for(let[e,r]of Object.entries(t)){let t=Number(e);if(!Number.isInteger(t)||t<0)continue;let a=i[n]??={};if(r==null)delete a[t];else{let e={...a[t]??{},...r};e.f===null&&delete e.f,a[t]=e}}}}function ke(e){let t=e.subUnitId;if(typeof t==`string`&&t!==``)return t;let n=e.params?.subUnitId;return typeof n==`string`&&n!==``?n:null}function Ae(e){try{let t=e.getMap(xe).get(`checkpoint`)?.snapshot;if(typeof t==`object`&&t)return t}catch{}return null}function je(e,t){let n=t==null?De():JSON.parse(JSON.stringify(t)),r;try{r=e.getArray(be)}catch{return null}for(let e=0;e<r.length;e++){let t=r.get(e);if(typeof t!=`object`||!t)continue;let i=t.params??{};switch(t.commandId){case Se:{let e=i.sheet;if(e==null||typeof e.id!=`string`||e.id===``)continue;let t=i.styles;t!=null&&(n.styles={...n.styles??{},...t});let r=typeof i.index==`number`?i.index:n.sheetOrder.length,a=Math.max(0,Math.min(r,n.sheetOrder.length));e.id in(n.sheets??{})||n.sheetOrder.splice(a,0,e.id),(n.sheets??={})[e.id]=e;break}case Ce:{let e=ke(t);if(e==null)continue;n.sheetOrder=n.sheetOrder.filter(t=>t!==e),n.sheets!=null&&delete n.sheets[e];break}case we:{let e=ke(t);if(e==null)continue;Oe(n,e,i.cellValue);break}case Te:{let e=ke(t);if(e==null)continue;let r=n.sheets?.[e];if(r==null)continue;let a=i.rowCount;typeof a==`number`&&Number.isInteger(a)&&a>0&&(r.rowCount=a);break}case Ee:{let e=ke(t);if(e==null)continue;let r=n.sheets?.[e];if(r==null)continue;let a=i.columnCount;typeof a==`number`&&Number.isInteger(a)&&a>0&&(r.columnCount=a);break}}}return n.sheetOrder.length>0?n:null}var Me=3e4,Ne=6e3,Pe=new Map;function J(e){if(e==null)return``;let t=e.v;return t==null?``:String(t)}function Fe(e){let t=e.sheetOrder?.[0],n=(t==null?void 0:e.sheets?.[t])?.cellData??{},r=[],i=n[0]??{};for(let e=0;e<60;e++){let t=i[e],n=J(t);n.length!==0&&r.push({col:e,name:n,schema:ce(t)??{type:`text`}})}let a=i[0]?.custom?.dtMeta;if(typeof a==`string`&&a.length>0)try{let e=JSON.parse(a).views?.[0]?.fieldOrder;if(Array.isArray(e)&&e.length>0){let t=new Map(r.map(e=>[e.col,e])),n=[];for(let r of e){if(!Number.isInteger(r)||r<0)continue;let e=t.get(r);e!=null&&(n.push(e),t.delete(r))}for(let e of r)t.has(e.col)&&n.push(e);r.length=0,r.push(...n)}}catch{}let o=[],s=Object.keys(n).map(Number).filter(e=>Number.isInteger(e)&&e>=1).sort((e,t)=>e-t);for(let e of s){if(e>1e3)break;let t={},i=!1;for(let a of r){let r=J(n[e]?.[a.col]);t[a.col]=r,r.length>0&&(i=!0)}if(!i)continue;let a=r[0]?.col??0;o.push({row:e,title:t[a]||`记录 ${e}`,values:t})}return{fields:r,records:o}}async function Ie(e,t){let n=Pe.get(e);if(n!=null&&Date.now()-n.ts<Me)return n.data;let r=new w,i=new C({url:ie,name:te(e),token:()=>ee(t),document:r});try{await new Promise((e,t)=>{let n=window.setTimeout(()=>{i.off(`synced`,r),t(Error(`读取目标表超时`))},Ne),r=()=>{window.clearTimeout(n),e()};i.synced?(window.clearTimeout(n),e()):i.on(`synced`,r),i.on(`authenticationFailed`,()=>{window.clearTimeout(n),i.off(`synced`,r),t(Error(`无权限读取目标表`))})});let t=je(r,Ae(r));if(t==null)throw Error(`目标表无协作数据`);let n=Fe(t);return Pe.set(e,{ts:Date.now(),data:n}),n}finally{i.disconnect(),i.destroy(),r.destroy()}}async function Le(e,t){let n=await i(e),r=[],a=e=>{for(let n of e){let e=n.page;e!=null&&e.pageType===`datatable`&&e.slugId!==t&&r.push({pageId:e.id,slugId:e.slugId,title:e.title}),Array.isArray(n.children)&&n.children.length>0&&a(n.children)}};return a(n),r}var Re=new Set([`[]`,`{}`,`null`,`undefined`]);function Y(e){return e==null?``:typeof e==`string`?e:String(e)}function ze(e){if(e==null)return!0;let t=e.trim();return t.length===0||Re.has(t.toLowerCase())}function Be(e){return ze(Y(e))}function Ve(e){return Be(e)?``:Y(e).trim()}function He(e){if(e==null)return!0;let t=String(e).trim();return t.length===0||t===`[]`||t===`{}`}var Ue=/^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|\+\d{6,15})$/,We=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,Ge=/^https?:\/\/.+/i,Ke=/^[A-Za-z0-9\-_.]{3,64}$/,qe=/^\d{4}-\d{1,2}-\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/;function Je(e){return Number(String(e).replace(/[,¥$€£₩\s]/g,``))}function Ye(e,t){if(He(t))return null;let n=String(t).trim();switch(e.type){case`phone`:return Ue.test(n.replace(/\s+/g,``))?null:`电话号码格式不正确（支持手机号 / 区号-座机 / +国际号）`;case`email`:return We.test(n)?null:`Email 格式不正确（如 name@example.com）`;case`url`:return Ge.test(n)?null:`链接需以 http:// 或 https:// 开头`;case`number`:case`currency`:{let t=Je(n);if(!Number.isFinite(t))return e.type===`currency`?`货币金额必须是数字`:`必须是数字`;let r=e.decimals;if(e.type===`currency`&&r!=null&&r>=0){let e=n.replace(/,/g,``).split(`.`)[1];if(e!=null&&e.length>r)return`小数位不能超过 ${r} 位`}return null}case`progress`:{let t=Je(n.replace(/%$/,``)),r=e.max??100;return Number.isFinite(t)?t<0||t>r?`进度需在 0 ~ ${r} 之间`:null:`进度必须是数字`}case`rating`:{let t=Je(n),r=e.max??5;return!Number.isFinite(t)||!Number.isInteger(t)?`评分必须是整数`:t<0||t>r?`评分需在 0 ~ ${r} 之间`:null}case`barcode`:return Ke.test(n)?null:`条码仅限字母/数字/-_.，长度 3~64`;case`date`:{if(qe.test(n))return null;let e=Date.parse(n);return Number.isNaN(e)?`日期格式不正确（如 2026-09-08）`:null}default:return null}}var Xe=`repo.dtView`;function Ze(e,t){return`${Xe}.${e}.${t}`}function Qe(e,t){if(t==null||t===``)return null;try{let n=window.localStorage.getItem(Ze(e,t));return n!=null&&n!==``?n:null}catch{return null}}function $e(e,t,n){if(t!=null&&t!==``&&n!==``)try{window.localStorage.setItem(Ze(e,t),n)}catch{}}function et(e,t){if(t!=null&&t!==``)try{window.localStorage.removeItem(Ze(e,t))}catch{}}var tt=`<!DOCTYPE html>
<!--
  数据看板 · 透视页默认模版（多维表格「+ → 新建透视页面」播种用）
  ───────────────────────────────────────────────────────────────
  两处占位符由前端 buildPivotSeedHtml() 替换后写入新页面（**本文件不要直接导入成页**）：
    数据表 slugId 占位符 → 填进 head 区那一行数据表标记的 content
    标题占位符          → title / 页眉大标题 / 页脚兜底文案三处共用（运行时会被宿主
                          推送的真实文档标题覆盖，静态值只是首帧兜底）

  这一页不写死任何字段名 / 列号 / 选项 id：字段角色（标题、分组轴、次要分组、
  人员、标签、日期、数值）全部按「字段类型 + 字段名语义」自动识别，分组轴还能
  在页面右上角手动切换，选择结果跨会话记住。

  三个视图共用一份数据与一个搜索词：看板（拖拽卡片即改分组轴）、表格、图表。
  图表同样按字段自动适配 —— select 出分布，user 出人员任务量，multiSelect 出
  标签分布，date 族出时间趋势，number 族出按分组求和 / 均值，语义词典认出
  「完成」类选项才出完成率。缺哪类字段就少哪张图，一张都画不出时给一段说明而
  不是摆空图；每张图右上角可换图形，图形选择也跨会话记住。

  想微调文案与语义词典，改 JS 顶部的 NONE_LABEL / UNASSIGNED / GROUP_HINTS /
  DOING_HINTS / DONE_HINTS / NEG_HINTS 即可。词典只是「猜」，猜不中会自动降级。

  ⚠️ 改这个文件时注意：宿主解析这份 HTML 用的是**裸正则在原始文本上取首个匹配、
  不剥注释**（取第一个数据表标记当目标、把 SDK 注入到第一个 head 标签之后），
  所以注释里千万不要出现带尖括号的示例标签——会抢走真标签，导致页面读不到数据
  或 SDK 变惰性，而**本地预览看不出来**。
-->
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="repo-datatable-source" content="{{SLUG_ID}}">
<title>{{TITLE}}</title>
<script src="https://static-resources.nuwax.com/echarts.min.js"><\/script>
<style>
  :root{
    --ink:#16181d; --ink2:#5b6270; --ink3:#8b939f; --ink4:#aeb4bf;
    --line:#e9ebef; --line2:#f1f3f6; --canvas:#f7f8fa; --card:#ffffff;
    --sel:#6b8cff; --focus:rgba(22,119,255,.16);
    --sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif;
    --serif:"Songti SC","Source Han Serif SC","Noto Serif SC",Georgia,serif;
    --mono:"SFMono-Regular",Menlo,Consolas,"JetBrains Mono","Courier New",monospace;
    --r:10px;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{
    font-family:var(--sans); color:var(--ink); background:#fff;
    -webkit-font-smoothing:antialiased; line-height:1.55;
  }
  ::-webkit-scrollbar{height:9px;width:9px}
  ::-webkit-scrollbar-thumb{background:#d8dce3;border-radius:6px}
  ::-webkit-scrollbar-thumb:hover{background:#c4cad4}
  ::-webkit-scrollbar-track{background:transparent}

  .wrap{display:flex;flex-direction:column;height:100vh;min-height:420px}

  /* ── 工具栏 ───────────────────────────────── */
  .bar{
    display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap;
    padding:22px 28px 16px;border-bottom:1px solid var(--line);background:#fff;
  }
  .brand{min-width:0;flex:1 1 320px}
  .brand .kicker{
    font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;
    color:var(--ink4);margin-bottom:7px;
  }
  h1{
    font-family:var(--serif);font-size:27px;font-weight:700;letter-spacing:.01em;
    line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:36vw;
  }
  .sub{margin-top:7px;font-size:12px;color:var(--ink3);font-family:var(--mono);letter-spacing:.01em}
  .sub b{color:var(--ink2);font-weight:600}
  .sub i{font-style:normal;color:var(--ink4);margin:0 6px}

  .tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
  .search{position:relative}
  .search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);opacity:.42}
  .search input{
    width:238px;border:1px solid var(--line);background:#fbfcfd;border-radius:8px;
    padding:8px 30px 8px 32px;font-size:13px;font-family:inherit;color:var(--ink);outline:none;
    transition:border-color .18s,box-shadow .18s,background .18s;
  }
  .search input::placeholder{color:var(--ink4)}
  .search input:focus{border-color:var(--sel);background:#fff;box-shadow:0 0 0 3px var(--focus)}
  .search .clr{
    position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;
    cursor:pointer;color:var(--ink4);font-size:15px;line-height:1;padding:3px 5px;border-radius:5px;display:none;
  }
  .search .clr:hover{color:var(--ink);background:var(--line2)}

  .seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff}
  .seg button{
    border:0;background:transparent;font-family:inherit;font-size:12.5px;color:var(--ink2);
    padding:8px 13px;cursor:pointer;transition:background .16s,color .16s;white-space:nowrap;
  }
  .seg button + button{border-left:1px solid var(--line)}
  .seg button:hover{background:var(--line2)}
  .seg button[aria-pressed="true"]{color:var(--sel);font-weight:700;background:#f7f9ff}

  /* ── 图表视图：一屏图表卡片，卡片高度固定免得 echarts 首帧量不到高度 ── */
  .charts{padding:16px 28px 24px;background:var(--canvas)}
  .cg-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 2px 12px}
  .cg-head b{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.01em}
  .cg-head span{font-size:10.5px;color:var(--ink4);font-family:var(--mono);letter-spacing:.01em;line-height:1.5}
  .cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
  .ccard{
    background:#fff;border:1px solid var(--line);border-radius:11px;padding:13px 14px 8px;min-width:0;
    box-shadow:0 1px 2px rgba(20,30,55,.03);animation:cardIn .34s ease both;
  }
  .ccard-hd{display:flex;align-items:flex-start;gap:10px;margin-bottom:5px}
  .ccard-tt{flex:1;min-width:0}
  .ccard-tt b{display:block;font-size:12.5px;font-weight:700;color:var(--ink);letter-spacing:-.01em}
  .ccard-tt span{display:block;font-size:10.5px;color:var(--ink4);margin-top:3px;line-height:1.5}
  .ctype{display:flex;gap:2px;flex:0 0 auto;background:var(--line2);border-radius:7px;padding:2px}
  .ctype button{
    border:0;background:transparent;font-family:inherit;font-size:10.5px;color:var(--ink3);
    padding:3px 8px;border-radius:5px;cursor:pointer;transition:background .14s,color .14s;white-space:nowrap;
  }
  .ctype button:hover{color:var(--ink2)}
  .ctype button[aria-pressed="true"]{background:#fff;color:var(--ink);font-weight:700;box-shadow:0 1px 2px rgba(20,30,55,.08)}
  .cbox{width:100%;height:224px}
  .cbox--tall{height:252px}

  /* 分组维度选择器：看上去像一枚标签，点开才是 select */
  .pick{
    display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;
    border-radius:8px;padding:0 10px;height:34px;transition:border-color .16s,box-shadow .16s;
  }
  .pick:hover{border-color:#cfd6e4}
  .pick:focus-within{border-color:var(--sel);box-shadow:0 0 0 3px var(--focus)}
  .pick > span{font-size:10.5px;font-weight:700;letter-spacing:.09em;color:var(--ink4);text-transform:uppercase}
  .pick select{
    width:auto;border:0;background:transparent;font-size:12.5px;color:var(--ink);font-weight:600;
    font-family:inherit;padding:0 2px 0 0;cursor:pointer;max-width:132px;outline:none;
  }
  .pick select:focus{border:0;box-shadow:none}
  .pick select:disabled{color:var(--ink2);cursor:default}
  .pick i{font-style:normal;font-size:10px;color:var(--ink4);letter-spacing:.04em}
  .pick i:empty{display:none}

  .btn{
    border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:8px;
    padding:8px 14px;font-size:12.5px;font-family:inherit;cursor:pointer;
    transition:border-color .16s,color .16s,background .16s,transform .16s;white-space:nowrap;
  }
  .btn:hover{border-color:#cfd5df;background:#fcfdfe}
  .btn:active{transform:translateY(1px)}
  .btn--primary{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:600}
  .btn--primary:hover{background:#000;border-color:#000;color:#fff}
  .btn--danger{color:#c0392b;border-color:#f0d5d1}
  .btn--danger:hover{background:#fdf4f3;border-color:#e6b8b2}
  .btn[disabled]{opacity:.45;cursor:not-allowed}

  /* ── 数据表切换：一个多维表格里有多张数据表时才出现 ── */
  .tabs{
    display:flex;gap:24px;padding:0 28px;background:#fff;border-bottom:1px solid var(--line);
    overflow-x:auto;scrollbar-width:none;
  }
  .tabs[hidden]{display:none}
  .tabs::-webkit-scrollbar{height:0}
  .tab{
    appearance:none;border:0;background:none;font-family:inherit;font-size:13px;color:var(--ink4);
    padding:11px 0;line-height:1.5;cursor:pointer;white-space:nowrap;transition:color .18s;
  }
  .tab:hover{color:var(--ink2)}
  .tab[aria-pressed="true"]{color:var(--sel);font-weight:700}
  .tab .n{font-family:var(--mono);font-size:10.5px;font-weight:500;color:var(--ink4);margin-left:6px}
  .tab[aria-pressed="true"] .n{color:var(--sel);opacity:.7}

  /* ── 指标条 ───────────────────────────────── */
  .metrics{
    display:flex;align-items:stretch;gap:0;padding:0 28px;background:#fff;
    border-bottom:1px solid var(--line);overflow-x:auto;
  }
  .metric{padding:14px 26px 15px 0;margin-right:26px;border-right:1px solid var(--line2);min-width:118px}
  .metric:last-child{border-right:0;margin-right:0}
  .metric .lb{font-family:var(--mono);font-size:10.5px;letter-spacing:.11em;color:var(--ink4);text-transform:uppercase}
  .metric .vl{font-family:var(--mono);font-size:25px;font-weight:600;letter-spacing:-.02em;margin-top:3px;line-height:1.1}
  .metric .vl small{font-size:12px;font-weight:500;color:var(--ink3);margin-left:3px;letter-spacing:0}
  .metric .note{font-size:11.5px;color:var(--ink3);margin-top:2px}
  .metric .track{height:4px;border-radius:2px;background:var(--line2);margin-top:9px;overflow:hidden;width:100%}
  .metric .track i{display:block;height:100%;border-radius:2px;transition:width .5s cubic-bezier(.22,1,.36,1)}
  .metric--chart{flex:1;min-width:300px;border-right:0}
  .metric--chart .lb{margin-bottom:2px}
  #chart{width:100%;height:84px;margin-top:3px}

  /* ── 看板 ─────────────────────────────────── */
  .board{
    flex:1;min-height:0;overflow:auto;background:var(--canvas);
    padding:18px 28px 26px;display:flex;gap:14px;align-items:flex-start;
  }
  .col{
    flex:1 1 202px;min-width:202px;max-width:330px;min-height:176px;background:#f1f3f6;border-radius:var(--r);
    padding:11px 11px 9px;display:flex;flex-direction:column;gap:9px;
    animation:colIn .42s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes colIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .col-hd{display:flex;align-items:center;gap:8px;padding:2px 3px 6px}
  .col-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
  .col-nm{font-size:13px;font-weight:600;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .col-ct{font-family:var(--mono);font-size:12px;color:var(--ink3);margin-left:auto;font-weight:500}
  .col-track{height:3px;border-radius:2px;background:#e2e6ec;overflow:hidden;margin:0 3px 4px}
  .col-track i{display:block;height:100%;border-radius:2px;transition:width .5s cubic-bezier(.22,1,.36,1)}
  .col-body{display:flex;flex-direction:column;gap:8px;min-height:16px}

  .card{
    position:relative;background:var(--card);border-radius:8px;padding:11px 12px 10px 13px;
    border:1px solid #e7eaf0;cursor:pointer;overflow:hidden;
    transition:box-shadow .2s,border-color .2s,transform .2s;
    animation:cardIn .4s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes cardIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ac,#c9ced8)}
  .card:hover{border-color:#d3d9e3;box-shadow:0 6px 18px rgba(20,30,55,.09);transform:translateY(-1px)}
  .card:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
  /* 拖拽改状态 */
  .card[draggable="true"]{cursor:grab}
  .card[draggable="true"] .card-t{padding-right:17px}
  .card-grip{position:absolute;top:9px;right:8px;color:var(--ink4);opacity:0;transition:opacity .16s;line-height:0;cursor:grab}
  .card:hover .card-grip,.card:focus-visible .card-grip{opacity:.7}
  .card.dragging{opacity:.4;border-style:dashed;box-shadow:0 10px 26px rgba(20,30,55,.14)}
  body.dragging .card{cursor:grabbing}
  body.dragging .card:hover{transform:none;box-shadow:none}
  .col.drop-on{background:#e6ebf5;box-shadow:inset 0 0 0 2px var(--sel)}
  .col.drop-on .col-nm{color:var(--sel)}
  .col.drop-on .col-empty{background:#fff;border-color:#c6d2ea}
  .col.drop-on .col-body::after{
    content:"松开即改状态";display:block;text-align:center;font-size:11px;font-weight:600;
    color:var(--sel);padding:7px 0 1px;letter-spacing:.02em;
  }
  .card-t{font-size:13.5px;font-weight:600;line-height:1.45;word-break:break-word;padding-right:2px}
  .card-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .pill{
    display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:20px;
    font-size:11px;line-height:1.6;font-weight:600;letter-spacing:.01em;white-space:nowrap;
    background:#f2f4f7;color:var(--ink2);
  }
  .pill .dt{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
  .pill--tag{font-weight:500}
  .card-ft{display:flex;align-items:center;gap:7px;margin-top:9px;padding-top:8px;border-top:1px solid var(--line2)}
  .avatar{
    width:19px;height:19px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;
    font-size:10px;font-weight:700;color:#fff;background:#8b939f;font-family:var(--sans);
  }
  .who{font-size:11.5px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rowno{font-family:var(--mono);font-size:10.5px;color:var(--ink4);margin-left:auto;flex:0 0 auto}
  .add{
    border:1px dashed #d8dde5;background:transparent;border-radius:8px;padding:7px;width:100%;
    font-family:inherit;font-size:12px;color:var(--ink3);cursor:pointer;transition:all .18s;
  }
  .add:hover{color:var(--ink);border-color:#b9c1cd;background:#fff}
  .col-empty{
    border:1px dashed #dfe3ea;border-radius:8px;padding:15px 10px;text-align:center;
    font-size:11.5px;color:var(--ink4);background:rgba(255,255,255,.5);
  }

  /* ── 表格视图 ─────────────────────────────── */
  .sheet{flex:1;min-height:0;overflow:auto;padding:20px 28px 30px;background:#fff}
  table{width:100%;border-collapse:collapse}
  th{
    text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--ink4);font-weight:600;padding:9px 12px;border-bottom:1px solid var(--line);
    position:sticky;top:0;background:#fff;z-index:2;
  }
  td{font-size:13px;padding:11px 12px;border-bottom:1px solid var(--line2);vertical-align:middle}
  tbody tr{transition:background .15s}
  tbody tr:hover{background:#fafbfd}
  td.t-title{font-weight:600}
  .t-people{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .muted{color:var(--ink4)}

  .empty{text-align:center;color:var(--ink3);font-size:13px;padding:52px 0}
  .empty b{display:block;font-size:14px;color:var(--ink);margin-bottom:6px;font-weight:600}

  /* ── 抽屉 / 弹层 ──────────────────────────── */
  #mask{display:none;position:fixed;inset:0;background:rgba(16,22,34,.34);z-index:60}
  .drawer{
    position:fixed;top:0;right:0;bottom:0;width:396px;max-width:92vw;background:#fff;z-index:61;
    box-shadow:-14px 0 44px rgba(16,22,34,.16);transform:translateX(101%);
    transition:transform .3s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;
  }
  .drawer.on{transform:none}
  .d-hd{padding:18px 20px 14px;border-bottom:1px solid var(--line);display:flex;align-items:flex-start;gap:12px}
  .d-hd .kicker{font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:var(--ink4);text-transform:uppercase}
  .d-hd h2{font-size:16px;font-weight:600;margin-top:5px;line-height:1.4;word-break:break-word}
  .x{border:0;background:transparent;font-size:19px;line-height:1;color:var(--ink3);cursor:pointer;padding:3px 7px;border-radius:6px}
  .x:hover{background:var(--line2);color:var(--ink)}
  .d-bd{padding:16px 20px 20px;overflow:auto;flex:1}
  .fld{margin-bottom:17px}
  .fld > label{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;color:var(--ink4);text-transform:uppercase;margin-bottom:7px}
  .fld input[type=text]{
    width:100%;border:1px solid var(--line);border-radius:7px;padding:8px 10px;font-size:13px;
    font-family:inherit;color:var(--ink);outline:none;transition:border-color .16s,box-shadow .16s;
  }
  .fld input[type=text]:focus{border-color:var(--sel);box-shadow:0 0 0 3px var(--focus)}
  .chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip{
    border:1px solid var(--line);background:#fff;border-radius:20px;padding:4px 11px;font-size:12px;
    font-family:inherit;color:var(--ink2);cursor:pointer;transition:all .16s;
  }
  .chip:hover{border-color:#c9d0da}
  .chip.on{background:var(--chip-bg,#f2f4f7);border-color:var(--chip-bd,#cfd5df);color:var(--chip-fg,var(--ink));font-weight:600}
  .d-ft{padding:13px 20px;border-top:1px solid var(--line);display:flex;gap:9px;align-items:center;background:#fcfdfe}
  .d-ft .sp{flex:1}
  .hint{font-size:11px;color:var(--ink4);margin-top:9px}

  .modal{
    position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.97);z-index:61;
    background:#fff;border-radius:12px;width:404px;max-width:92vw;box-shadow:0 22px 60px rgba(16,22,34,.24);
    display:none;opacity:0;transition:opacity .2s,transform .2s;
  }
  .modal.on{display:block;opacity:1;transform:translate(-50%,-50%) scale(1)}
  .m-hd{padding:18px 20px 4px;font-size:15px;font-weight:600}
  .m-bd{padding:12px 20px 4px}
  .m-ft{padding:14px 20px 18px;display:flex;justify-content:flex-end;gap:9px}
  select{
    width:100%;border:1px solid var(--line);border-radius:7px;padding:8px 10px;font-size:13px;
    font-family:inherit;color:var(--ink);background:#fff;outline:none;
  }
  select:focus{border-color:var(--sel);box-shadow:0 0 0 3px var(--focus)}

  .toast{
    position:fixed;left:50%;bottom:28px;transform:translate(-50%,14px);background:var(--ink);color:#fff;
    font-size:12.5px;padding:9px 17px;border-radius:8px;opacity:0;pointer-events:none;z-index:70;
    transition:opacity .22s,transform .22s;font-family:inherit;max-width:80vw;text-align:center;
  }
  .toast.on{opacity:1;transform:translate(-50%,0)}
  .toast.err{background:#9b2c20}

  @media (max-width:1080px){
    .cgrid{grid-template-columns:1fr}
  }
  @media (max-width:860px){
    .bar{padding:16px 16px 13px}
    .tabs{padding:0 16px}
    h1{font-size:22px;max-width:70vw}
    .metrics{padding:0 16px}
    .board{padding:14px 16px 22px}
    .sheet{padding:14px 16px 24px}
    .charts{padding:14px 16px 22px}
    .search input{width:170px}
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="bar">
    <div class="brand">
      <div class="kicker">Board · 任务透视</div>
      <h1 id="pageTitle">{{TITLE}}</h1>
      <div class="sub" id="meta">数据同步中…</div>
    </div>
    <div class="tools">
      <div class="search">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b939f" stroke-width="1.6">
          <circle cx="7" cy="7" r="4.6"></circle><path d="M10.6 10.6 14 14"></path>
        </svg>
        <input id="q" type="text" placeholder="搜索标题 / 处理人 / 标签" autocomplete="off">
        <button class="clr" id="qClr" type="button" title="清除">×</button>
      </div>
      <div class="seg" role="group" aria-label="视图切换">
        <button id="vBoard" type="button" aria-pressed="true">看板</button>
        <button id="vTable" type="button" aria-pressed="false">表格</button>
        <button id="vChart" type="button" aria-pressed="false">图表</button>
      </div>
      <label class="pick" id="pickGroup" title="看板按哪个字段分列 —— 默认自动识别字段类型与名称，也可以在这里手选">
        <span>分组</span>
        <select id="groupBy" aria-label="分组字段"></select>
        <i id="pickHint">自动</i>
      </label>
      <button class="btn btn--primary" id="btnNew" type="button">＋ 新建记录</button>
    </div>
  </header>

  <nav class="tabs" id="tabs" hidden aria-label="数据表切换"></nav>

  <section class="metrics" id="metrics"></section>

  <main class="board" id="board"><div class="empty">加载中…</div></main>
  <main class="sheet" id="sheet" style="display:none"></main>
  <main class="charts" id="charts" style="display:none"></main>

  <footer style="padding:11px 28px;border-top:1px solid var(--line);background:#fff;font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;color:var(--ink4);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <span id="footSrc">数据源 · {{TITLE}}</span>
    <span style="margin-left:auto" id="footSync">数据表更新后刷新本页即同步</span>
  </footer>
</div>

<div id="mask"></div>

<!-- 详情 / 编辑抽屉 -->
<aside class="drawer" id="drawer" aria-hidden="true">
  <div class="d-hd">
    <div style="flex:1;min-width:0">
      <div class="kicker" id="dRow">记录</div>
      <h2 id="dTitle">—</h2>
    </div>
    <button class="x" id="dClose" type="button" title="关闭">×</button>
  </div>
  <div class="d-bd" id="dBody"></div>
  <div class="d-ft">
    <button class="btn btn--danger" id="dDel" type="button">删除记录</button>
    <span class="sp"></span>
    <button class="btn" id="dDone" type="button">完成</button>
  </div>
</aside>

<!-- 新建记录 -->
<div class="modal" id="mNew" role="dialog" aria-modal="true">
  <div class="m-hd" id="mNewTitle">新建记录</div>
  <div class="m-bd">
    <div class="fld" id="fTitle">
      <label for="nTitle" id="lblTitle">标题</label>
      <input type="text" id="nTitle" placeholder="写一句能看懂的话">
    </div>
    <div class="fld" id="fStatus">
      <label for="nStatus" id="lblStatus">状态</label>
      <select id="nStatus"></select>
    </div>
    <div class="fld" id="fWho">
      <label for="nWho" id="lblWho">人员</label>
      <input type="text" id="nWho" placeholder="多个用英文逗号分隔（可留空）">
    </div>
    <div class="fld" id="fPri" style="margin-bottom:4px">
      <label for="nPri" id="lblPri">次要分组</label>
      <select id="nPri"></select>
    </div>
  </div>
  <div class="m-ft">
    <button class="btn" id="nCancel" type="button">取消</button>
    <button class="btn btn--primary" id="nOk" type="button">创建记录</button>
  </div>
</div>

<!-- 删除确认 -->
<div class="modal" id="mDel" role="dialog" aria-modal="true">
  <div class="m-hd">删除这条记录？</div>
  <div class="m-bd" style="font-size:13px;color:var(--ink2);line-height:1.65" id="delText"></div>
  <div class="m-ft">
    <button class="btn" id="delCancel" type="button">取消</button>
    <button class="btn btn--primary" id="delOk" type="button">确认删除</button>
  </div>
</div>

<div class="toast" id="toast"></div>
<script>
(function () {
  'use strict';

  /* ── 可配置文案（改这里即可，不必改数据表）───────────── */
  var NONE_LABEL = '未分类';     // 分组字段为空时的列名 / 标签
  var NONE_COLOR = '#94A3B8';    // 空值桶配色（中性灰）
  var UNASSIGNED = '未指派';     // 人员字段为空时的显示
  var AVATAR_COLORS = ['#4d6fd0', '#2f8f83', '#7a5bd0', '#b4791f', '#b0475f', '#5a7d2f'];

  /* 语义词典：只用于「猜哪个字段该当分组轴」「挑进行中 / 完成类桶」，
     猜不中会自动降级（分组退化为"按用到的值最多的 select"，指标退化为"计数前几名"），
     不会硬套一个错的结论。换一张表不用改代码。 */
  var GROUP_HINTS = ['状态', '阶段', '进度', '进展', '情况', '环节', '流程', '生命周期',
    'status', 'state', 'stage', 'phase', 'progress', 'step', 'workflow'];
  var DOING_HINTS = ['进行中', '进行', '处理中', '执行中', '开发中', '制作中', '审核中',
    'doing', 'inprogress', 'in progress', 'progress', 'wip', 'ongoing', 'active', 'started'];
  var DONE_HINTS = ['已完成', '完成', '已交付', '交付', '已上线', '上线', '已发布', '发布', '已结案', '结案',
    '已结束', '结束', '已关闭', '关闭', '已解决', '解决', '已通过', '通过', '已归档', '归档',
    'done', 'complete', 'completed', 'closed', 'resolved', 'finished', 'shipped', 'released', 'merged', 'archived', 'deployed'];
  var NEG_HINTS = ['未', '不', '待', '非', '取消', '驳回', '打回', '拒绝', '失败', '阻塞', '暂停', '挂起', '搁置', '中止',
    'cancel', 'reject', 'fail', 'block', 'hold', 'todo', 'to do', 'backlog', 'not '];
  var PREF_GROUP = 'groupField'; // 用户手选的分组字段名（存字段名而不是列号，换表/调列序都不失效）
  var PREF_VIEW = 'viewMode';    // 上次停在哪个视图（看板 / 表格 / 图表）
  var PREF_KINDS = 'chartKinds'; // 每张图上次选的图形（JSON：{status:'rose', ...}）
  var PREF_TABLE = 'activeSheet';// 上次看的是哪张数据表（一个多维表格里有多张时才用得上）

  var api = window.repoDatatable;
  var snap = null, fields = [], records = [], F = {}, editable = false;
  var view = 'board', kw = '', drawerRow = null, pendingDelete = null, charts = [];
  var gcharts = [];              // 图表视图里的 echarts 实例（与指标条那张 mini 图分开管理）
  var kinds = {};                // 每张图的图形选择，键是图 id（status / user / sub / tag / date / num）
  var groupPref = null;          // 用户手选的分组字段名（跨会话记住，见 PREF_GROUP）
  var tables = [], activeIdx = 0, pendingSheetId = null;  // 多维表格里的多张数据表（一个 workbook 多个 sheet）

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stripSite(t) {
    t = String(t == null ? (document.title || '') : t);
    var i = t.indexOf(' - ');
    return i > 0 ? t.slice(i + 3) : t;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hex2rgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    var n = parseInt(h, 16);
    if (isNaN(n)) { return [140, 140, 140]; }
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function tint(hex, a) { var c = hex2rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function darken(hex, k) {                      // 亮色状态色在浅底上做文字对比度不足，加深后再用作文字色
    var c = hex2rgb(hex);
    return '#' + c.map(function (v) {
      var x = Math.max(0, Math.round(v * (1 - k)));
      return ('0' + x.toString(16)).slice(-2);
    }).join('');
  }
  function avatarColor(name) {
    var s = 0, i;
    for (i = 0; i < name.length; i++) { s = (s * 31 + name.charCodeAt(i)) % 9973; }
    return AVATAR_COLORS[s % AVATAR_COLORS.length];
  }
  function toast(msg, isErr) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast on' + (isErr ? ' err' : '');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.className = 'toast' + (isErr ? ' err' : ''); }, 2200);
  }

  /* ── 字段角色识别（不写死列号、也不写死字段名，换表即用）────── */
  function nthType(type, n) {
    var c = 0, i;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].schema && fields[i].schema.type === type) {
        if (c === n) { return fields[i]; }
        c++;
      }
    }
    return null;
  }
  function selectFields() {
    var out = [], i;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].schema && fields[i].schema.type === 'select') { out.push(fields[i]); }
    }
    return out;
  }
  function normName(s) { return String(s == null ? '' : s).toLowerCase().replace(/\\s+/g, ''); }
  function hintHit(name, hints) {                // 先全等、再包含：词典里短词多，全等优先避免误伤
    var s = normName(name), i;
    for (i = 0; i < hints.length; i++) { if (s === normName(hints[i])) { return 1; } }
    for (i = 0; i < hints.length; i++) { if (s.indexOf(normName(hints[i])) >= 0) { return 1; } }
    return 0;
  }
  function isNegName(name) { return hintHit(name, NEG_HINTS) === 1; }

  function usedOptionCount(f) {                  // 这张表里真正用到的选项数（空值不算）
    var m = optMap(f), used = {}, n = 0, i, v;
    for (i = 0; i < records.length; i++) {
      v = valOf(records[i], f);
      if (v && m[v] && !used[v]) { used[v] = 1; n++; }
    }
    return n;
  }
  function fillRate(f) {
    var i, n = 0;
    if (!records.length) { return 0; }
    for (i = 0; i < records.length; i++) { if (valOf(records[i], f)) { n++; } }
    return n / records.length;
  }
  function groupScore(f) {                       // 谁最像"分组轴"：名字像状态 > 填得满 > 用得开 > 列数合适
    var os = (f.schema && f.schema.options) || [];
    if (os.length < 2) { return -1e9; }          // 只有 0/1 个选项，分不出列
    var u = usedOptionCount(f);
    var s = 0;
    if (hintHit(f.name, GROUP_HINTS)) { s += 100; }
    s += fillRate(f) * 40;
    s += (u / os.length) * 30;
    if (u >= 2 && u <= 9) { s += 12; }           // 2~9 个在用值，正好是看板列数
    if (u <= 1) { s -= 60; }                     // 只有一个值在用，分组没意义
    return s;
  }
  function pickGroupField() {
    var ss = selectFields(), best = null, bs = -1e9, i, s;
    for (i = 0; i < ss.length; i++) {
      s = groupScore(ss[i]);
      if (s > bs) { bs = s; best = ss[i]; }      // 同分保留靠前的字段（表里先定义的更可能是主状态）
    }
    return best;
  }
  function pickSecondSelect(g) {                 // 状态之外的那个 select，当卡片副标签用
    var ss = selectFields(), i;
    for (i = 0; i < ss.length; i++) { if (!g || ss[i].col !== g.col) { return ss[i]; } }
    return null;
  }
  function resolveFields() {
    F.title = nthType('text', 0) || (fields.length ? fields[0] : null);  // 没有 text 字段就退用第一列
    var g = null, i;
    if (groupPref) {                             // 用户在页面上手选过 → 以他为准
      for (i = 0; i < fields.length; i++) {
        if (fields[i].name === groupPref && fields[i].schema && fields[i].schema.type === 'select') { g = fields[i]; }
      }
    }
    F.status = g || pickGroupField();
    F.sub = pickSecondSelect(F.status);
    F.user = nthType('user', 0);
    F.tag = nthType('multiSelect', 0);
    F.date = nthTypeIn(DATE_TYPES, 0);           // 图表用：有日期族字段就画趋势
    F.num = nthTypeIn(NUM_TYPES, 0);             // 图表用：有数值族字段就画聚合
  }
  function valOf(r, f) { return f ? String(r.values[f.col] == null ? '' : r.values[f.col]) : ''; }
  function optMap(f) {
    var m = {}, os = (f && f.schema && f.schema.options) || [], i;
    for (i = 0; i < os.length; i++) { m[os[i].id] = os[i]; }
    return m;
  }
  function bucketsOf(f) {                        // 分组维度 = 空值桶 + 已定义选项（顺序固定，空值桶最前）
    var out = [{ key: '', name: NONE_LABEL, color: NONE_COLOR }];
    var os = (f && f.schema && f.schema.options) || [], i;
    for (i = 0; i < os.length; i++) { out.push({ key: os[i].id, name: os[i].name, color: os[i].color || '#8c8c8c' }); }
    return out;
  }
  function bucketKeyOf(r, f) {                   // 空串 / 未知 id 一律进空值桶
    var v = valOf(r, f);
    if (!v) { return ''; }
    return optMap(f)[v] ? v : '';
  }
  function bucketByHints(hints) {                // 按语义词典挑桶；否定词优先（"未完成"不算完成，"已取消"也不算）
    var bs = bucketsOf(F.status), i;
    if (!F.status) { return null; }
    for (i = 1; i < bs.length; i++) {
      if (isNegName(bs[i].name)) { continue; }
      if (hintHit(bs[i].name, hints)) { return bs[i]; }
    }
    return null;
  }

  function searchText(r) {
    var parts = [], i;
    for (i = 0; i < fields.length; i++) {
      var f = fields[i], v = valOf(r, f);
      if (!v) { continue; }
      if (f.schema && (f.schema.type === 'select' || f.schema.type === 'multiSelect')) {
        var m = optMap(f);
        parts.push(v.split(',').map(function (id) { return m[id] ? m[id].name : id; }).join(' '));
      } else {
        parts.push(v);
      }
    }
    return parts.join(' ').toLowerCase();
  }
  function visible() {
    if (!kw) { return records; }
    var k = kw.toLowerCase();
    return records.filter(function (r) { return searchText(r).indexOf(k) >= 0; });
  }

  /* ── 渲染片段 ───────────────────────────────── */
  function noneLabelFor(f) { return f === F.status ? NONE_LABEL : '未填'; }
  function pillOf(f, v) {
    if (!f) { return ''; }                        /* 表里没有这类字段（纯文本表、没建状态列）→ 不画标签，别把整页拖崩 */
    var type = f.schema && f.schema.type;
    if (type === 'select') {
      if (v === '') { return '<span class="pill" style="background:' + tint(NONE_COLOR, .16) + ';color:' + darken(NONE_COLOR, .35) + '">' + esc(noneLabelFor(f)) + '</span>'; }
      var o = optMap(f)[v];
      var nm = o ? o.name : v, cl = (o && o.color) || '#8c8c8c';
      return '<span class="pill" style="background:' + tint(cl, .16) + ';color:' + darken(cl, .35) + '">'
        + '<i class="dt" style="background:' + esc(cl) + '"></i>' + esc(nm) + '</span>';
    }
    if (type === 'multiSelect') {
      if (v === '') { return ''; }
      var m = optMap(f);
      return v.split(',').map(function (id) {
        var o = m[id], nm = o ? o.name : id, cl = (o && o.color) || '#8c8c8c';
        return '<span class="pill pill--tag" style="background:' + tint(cl, .14) + ';color:' + darken(cl, .4) + '">' + esc(nm) + '</span>';
      }).join('');
    }
    return '';
  }
  function peopleHtml(names, showName) {
    if (!names) { return '<span class="avatar" style="background:#c3c8d2">·</span><span class="who">' + esc(UNASSIGNED) + '</span>'; }
    var arr = names.split(',').filter(function (s) { return s.trim(); });
    var first = arr.length ? arr[0].trim() : UNASSIGNED;
    var html = arr.slice(0, 3).map(function (n) {
      n = n.trim();
      return '<span class="avatar" style="background:' + avatarColor(n) + '" title="' + esc(n) + '">' + esc(n.slice(0, 1)) + '</span>';
    }).join('');
    if (!showName) { return html; }
    return html + '<span class="who">' + esc(arr.join('、') || UNASSIGNED) + (arr.length > 3 ? ' 等' + arr.length + '人' : '') + '</span>';
  }

  function canDrag() { return editable && !!F.status; }   /* 拖拽=改状态：没有状态字段/只读身份都不给拖 */
  function findRecord(row) {
    for (var i = 0; i < records.length; i++) { if (records[i].row === row) { return records[i]; } }
    return null;
  }
  var GRIP_SVG = '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">'
    + '<circle cx="2" cy="2" r="1.15"/><circle cx="8" cy="2" r="1.15"/><circle cx="2" cy="7" r="1.15"/>'
    + '<circle cx="8" cy="7" r="1.15"/><circle cx="2" cy="12" r="1.15"/><circle cx="8" cy="12" r="1.15"/></svg>';

  function cardHtml(r, i, acColor) {
    var pr = F.sub ? pillOf(F.sub, valOf(r, F.sub)) : '';
    var tag = F.tag ? pillOf(F.tag, valOf(r, F.tag)) : '';
    var dg = canDrag();
    return '<article class="card" data-row="' + r.row + '" tabindex="0" role="button"'
      + (dg ? ' draggable="true"' : '')
      + ' style="--ac:' + esc(acColor) + ';animation-delay:' + (Math.min(i, 14) * 26) + 'ms">'
      + (dg ? '<span class="card-grip" title="拖拽到别的列，即改「' + esc(F.status.name) + '」">' + GRIP_SVG + '</span>' : '')
      + '<div class="card-t">' + (esc(valOf(r, F.title)) || '<span class="muted">（未填' + esc(F.title ? F.title.name : '标题') + '）</span>') + '</div>'
      + '<div class="card-tags">' + pillOf(F.status, valOf(r, F.status)) + pr + tag + '</div>'
      + '<div class="card-ft">' + peopleHtml(valOf(r, F.user), true)
      + '<span class="rowno">#' + pad(r.row) + '</span></div>'
      + '</article>';
  }

  function renderBoard(resetScroll) {
    var host = $('board');
    var sl = host.scrollLeft;
    if (!records.length) {
      host.innerHTML = '<div class="empty" style="flex:1"><b>这张数据表还没有记录</b>点右上角「新建记录」写下第一条，或直接在多维表格里添加</div>';
      return;
    }
    var rows = visible();
    var total = records.length;
    var bs = F.status ? bucketsOf(F.status) : [{ key: '__all__', name: '全部记录', color: '#8c8c8c' }];
    var keyOf = function (r) { return F.status ? bucketKeyOf(r, F.status) : '__all__'; };

    var html = bs.map(function (b, ci) {
      var list = rows.filter(function (r) { return keyOf(r) === b.key; });
      var pct = total ? Math.round(list.length / total * 100) : 0;
      return '<section class="col" data-bucket="' + esc(b.key) + '" data-bname="' + esc(b.name) + '"'
        + ' style="animation-delay:' + (ci * 55) + 'ms">'
        + '<div class="col-hd"><span class="col-dot" style="background:' + esc(b.color) + '"></span>'
        + '<span class="col-nm">' + esc(b.name) + '</span>'
        + '<span class="col-ct">' + list.length + (kw ? '/' + total : '') + '</span></div>'
        + '<div class="col-track"><i style="width:' + pct + '%;background:' + esc(b.color) + '"></i></div>'
        + '<div class="col-body">'
        + (list.length
            ? list.map(function (r, i) { return cardHtml(r, i, b.color); }).join('')
            : '<div class="col-empty">' + (kw ? '无匹配记录' : '这一列还是空的') + '</div>')
        + '</div>'
        + (editable ? '<button class="add" type="button" data-add="' + esc(b.key) + '">＋ 添加记录</button>' : '')
        + '</section>';
    }).join('');

    host.innerHTML = rows.length ? html
      : '<div class="empty" style="flex:1"><b>没有匹配「' + esc(kw) + '」的记录</b>换个关键词，或清空搜索框</div>';
    host.scrollLeft = resetScroll ? 0 : sl;
  }

  function renderTable() {
    var host = $('sheet');
    var rows = visible();
    if (!rows.length) {
      host.innerHTML = '<div class="empty"><b>' + (records.length ? '没有匹配的记录' : '暂无数据') + '</b></div>';
      return;
    }
    var head = '<tr><th style="width:52px">#</th>' + fields.map(function (f) {
      return '<th>' + esc(f.name) + '</th>';
    }).join('') + '</tr>';
    var body = rows.map(function (r) {
      return '<tr>' + '<td class="muted" style="font-family:var(--mono);font-size:11px">' + pad(r.row) + '</td>'
        + fields.map(function (f) {
          var t = f.schema && f.schema.type, v = valOf(r, f);
          if (t === 'select' || t === 'multiSelect') {
            var p = pillOf(f, v);
            return '<td>' + (p || '<span class="muted">—</span>') + '</td>';
          }
          if (t === 'user') { return '<td><div class="t-people">' + peopleHtml(v, true) + '</div></td>'; }
          if (t === 'checkbox') { return '<td>' + (v === 'true' ? '✓' : '<span class="muted">—</span>') + '</td>'; }
          if (!v) { return '<td><span class="muted">—</span></td>'; }
          var isTitle = F.title && f.col === F.title.col;
          return '<td' + (isTitle ? ' class="t-title"' : '') + '>' + esc(v) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    host.innerHTML = '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
  }

  /* ── 指标条 ─────────────────────────────────── */
  function renderMetrics() {
    var host = $('metrics');
    var total = records.length;
    var bs = bucketsOf(F.status);
    var counts = {}, i;
    for (i = 0; i < bs.length; i++) { counts[bs[i].key] = 0; }
    var seen = 0;
    records.forEach(function (r) {
      var k = F.status ? bucketKeyOf(r, F.status) : '';
      if (counts[k] == null) { k = ''; }
      counts[k]++; seen++;
    });
    if (F.status && seen !== total) { console.warn('分组数字不自洽', seen, total); }

    var people = {}, pn = 0;
    records.forEach(function (r) {
      var n = (valOf(r, F.user).split(',')[0] || '').trim();
      if (!n) { return; }
      if (!people[n]) { people[n] = 1; pn++; }
    });

    var doing = bucketByHints(DOING_HINTS);
    var done = bucketByHints(DONE_HINTS);
    var rate = (total && done) ? Math.round(counts[done.key] / total * 1000) / 10 : null;
    var pctOf = function (k) { return total ? Math.round(counts[k] / total * 100) : 0; };

    var mCount = 0;
    function metric(lb, vl, unit, note, color, pct) {
      mCount++;
      return '<div class="metric"><div class="lb">' + esc(lb) + '</div>'
        + '<div class="vl">' + esc(vl) + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div>'
        + (note ? '<div class="note">' + esc(note) + '</div>' : '<div class="note">&nbsp;</div>')
        + (pct == null ? '' : '<div class="track"><i style="width:' + pct + '%;background:' + esc(color) + '"></i></div>')
        + '</div>';
    }
    var html = metric('任务总数', total, '条',
      F.user ? (pn ? '来自 ' + pn + ' 位' + F.user.name : '尚未指派' + F.user.name) : '',
      NONE_COLOR, null);
    var shown = {};
    if (doing) {
      shown[doing.key] = 1;
      html += metric(doing.name, counts[doing.key], '条', '占比 ' + pctOf(doing.key) + '%', doing.color, pctOf(doing.key));
    }
    if (done) {
      shown[done.key] = 1;
      html += metric(done.name, counts[done.key], '条', '占比 ' + pctOf(done.key) + '%', done.color, pctOf(done.key));
    }
    if (rate != null) { html += metric('完成率', rate, '%', counts[done.key] + ' / ' + total + ' 条为「' + done.name + '」', done.color, rate); }

    /* 语义词典没命中时不留空：按计数补位，指标条永远有内容可读 */
    var fill = bs.slice().sort(function (a, b) { return counts[b.key] - counts[a.key]; });
    var j, b, cap = (doing && done) ? 4 : 5;
    for (j = 0; j < fill.length; j++) {
      b = fill[j];
      if (shown[b.key] || mCount >= cap) { continue; }
      html += metric(b.name, counts[b.key], '条', '占比 ' + pctOf(b.key) + '%', b.color, pctOf(b.key));
      shown[b.key] = 1;
    }

    var legend = bs.map(function (b) {
      return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:11px">'
        + '<i style="width:7px;height:7px;border-radius:2px;background:' + esc(b.color) + ';display:inline-block"></i>'
        + esc(b.name) + '</span>';
    }).join('');
    var chartTitle = F.status ? ((F.user ? F.user.name + ' × ' : '') + F.status.name + ' 分布') : (F.user ? F.user.name + ' 分布' : '分布');
    html += '<div class="metric metric--chart"><div class="lb">' + esc(chartTitle) + '</div>'
      + '<div style="font-size:10.5px;color:#8b939f;margin:2px 0 1px;white-space:nowrap;overflow:hidden">' + legend + '</div>'
      + '<div id="chart"></div></div>';
    host.innerHTML = html;
    renderChart();
  }

  function renderChart() {
    charts.forEach(function (c) { try { c.dispose(); } catch (e) {} });
    charts = [];
    var el = $('chart');
    if (!el) { return; }
    if (typeof echarts === 'undefined' || !records.length || !F.status) { el.style.display = 'none'; return; }
    var bs = bucketsOf(F.status);
    var names = [], idx = {};
    records.forEach(function (r) {
      var n = (valOf(r, F.user).split(',')[0] || '').trim() || UNASSIGNED;
      if (idx[n] == null) { idx[n] = names.length; names.push(n); }
    });
    var series = bs.map(function (b) {
      return {
        name: b.name, type: 'bar', stack: 'st', barMaxWidth: 11, barCategoryGap: '34%', itemStyle: { color: b.color },
        emphasis: { focus: 'series' },
        data: names.map(function (n) { return 0; })
      };
    });
    records.forEach(function (r) {
      var n = (valOf(r, F.user).split(',')[0] || '').trim() || UNASSIGNED;
      var k = bucketKeyOf(r, F.status);
      var si = 0, i;
      for (i = 0; i < bs.length; i++) { if (bs[i].key === k) { si = i; } }
      series[si].data[idx[n]]++;
    });
    var ch = echarts.init(el);
    ch.setOption({
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: '#fff', borderColor: '#E4EAF4', borderWidth: 1,
        textStyle: { color: '#16203A', fontSize: 12 },
        extraCssText: 'box-shadow:0 6px 20px rgba(20,34,64,.10);border-radius:8px;'
      },
      grid: { left: 2, right: 8, top: 6, bottom: 0, containLabel: true },
      xAxis: {
        type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#5A6785', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F8' } }
      },
      yAxis: {
        type: 'category', data: names.reverse(), axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#2b2f33', fontSize: 11 }
      },
      series: series.map(function (s) { s.data = s.data.reverse(); return s; })
    });
    charts.push(ch);
  }
  function fixCharts() {
    var el = $('chart');
    if (el) { el.style.height = ''; }   /* 交还高度给 CSS，避免 echarts 用首帧塌陷高度写死内联 px */
    charts.concat(gcharts).forEach(function (c) {
      try { if (c.getDom && c.getDom().offsetWidth) { c.resize(); } } catch (e) {}
    });
  }
  requestAnimationFrame(fixCharts);
  setTimeout(fixCharts, 200);
  window.addEventListener('resize', fixCharts);

  /* ── 图表视图：本表有什么字段，就画什么图 ───────────────
     不写死任何一种图：select → 环形 / 条形 / 玫瑰，user → 人员任务量，
     multiSelect → 标签分布，date 族 → 时间趋势，number 族 → 按分组求和 / 均值，
     语义词典认出「完成」类桶才出完成率仪表盘。缺哪类字段就少哪张图；
     一张都画不出时给一句说明，而不是摆一张空图。 */
  var NUM_TYPES = ['number', 'currency', 'rating', 'progress', 'autoNumber'];
  var DATE_TYPES = ['date', 'createdTime', 'modifiedTime'];

  function nthTypeIn(types, n) {
    var i, j, c = 0;
    for (i = 0; i < fields.length; i++) {
      for (j = 0; j < types.length; j++) {
        if (fields[i].schema && fields[i].schema.type === types[j]) {
          if (c === n) { return fields[i]; }
          c++;
          break;
        }
      }
    }
    return null;
  }
  function bucketByKey(f, key) {
    var bs = bucketsOf(f), i;
    for (i = 0; i < bs.length; i++) { if (bs[i].key === key) { return bs[i]; } }
    return { key: '', name: noneLabelFor(f), color: NONE_COLOR };
  }
  function tallySelect(f, rows) {                // 各桶计数（只画有数据的桶，免得一串 0 挤满轴）
    var bs = bucketsOf(f), cnt = {}, i, k, out = [];
    for (i = 0; i < bs.length; i++) { cnt[bs[i].key] = 0; }
    for (i = 0; i < rows.length; i++) {
      k = bucketKeyOf(rows[i], f);
      if (cnt[k] == null) { k = ''; }
      cnt[k]++;
    }
    for (i = 0; i < bs.length; i++) {
      if (cnt[bs[i].key] > 0) {
        out.push({ name: bs[i].key === '' ? noneLabelFor(f) : bs[i].name, color: bs[i].color, value: cnt[bs[i].key] });
      }
    }
    return out;
  }
  function tallyPeople(f, rows) {                // 取第一个处理人，与看板卡片口径一致
    var cnt = {}, order = [], i, n;
    for (i = 0; i < rows.length; i++) {
      n = (valOf(rows[i], f).split(',')[0] || '').trim() || UNASSIGNED;
      if (cnt[n] == null) { cnt[n] = 0; order.push(n); }
      cnt[n]++;
    }
    return order.map(function (x) { return { name: x, color: avatarColor(x), value: cnt[x] }; })
      .sort(function (a, b) { return b.value - a.value; });
  }
  function tallyTags(f, rows) {                  // 一条记录的多个标签各自计一次
    var m = optMap(f), map = {}, order = [], i, j, arr, id, nm;
    for (i = 0; i < rows.length; i++) {
      arr = valOf(rows[i], f).split(',');
      for (j = 0; j < arr.length; j++) {
        id = arr[j].trim();
        if (!id) { continue; }
        nm = m[id] ? m[id].name : id;
        if (!map[nm]) { map[nm] = { name: nm, color: (m[id] && m[id].color) || NONE_COLOR, value: 0 }; order.push(nm); }
        map[nm].value++;
      }
    }
    return order.map(function (x) { return map[x]; }).sort(function (a, b) { return b.value - a.value; });
  }
  function toDate(v) {                           // 兼容 Excel 序列号（20000~80000）与日期串
    if (!v) { return null; }
    var n = Number(v), d;
    if (isFinite(n) && n > 20000 && n < 80000) { return new Date(Math.round((n - 25569) * 86400000)); }
    d = new Date(String(v).replace(/\\//g, '-').slice(0, 10).replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
  }
  function tallyDates(f, rows) {                 // 跨度 > 92 天按月，否则按天
    var ds = [], cnt = {}, order = [], i, d;
    for (i = 0; i < rows.length; i++) {
      d = toDate(valOf(rows[i], f));
      if (d) { ds.push(d); }
    }
    if (ds.length < 2) { return null; }
    ds.sort(function (a, b) { return a - b; });
    var byMonth = (ds[ds.length - 1] - ds[0]) / 86400000 > 92;
    for (i = 0; i < ds.length; i++) {
      d = ds[i];
      var k = byMonth ? (d.getFullYear() + '-' + pad(d.getMonth() + 1)) : (pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
      if (cnt[k] == null) { cnt[k] = 0; order.push(k); }
      cnt[k]++;
    }
    order.sort();
    return { byMonth: byMonth, items: order.map(function (x) { return { name: x, value: cnt[x], color: '#6b8cff' }; }) };
  }
  function tallyNumber(f, groupF, rows, mode) {  // 按分组求和 / 求均值
    var g = {}, order = [], i, v, k, b;
    for (i = 0; i < rows.length; i++) {
      v = parseFloat(valOf(rows[i], f));
      if (!isFinite(v)) { continue; }
      k = groupF ? bucketKeyOf(rows[i], groupF) : '__all__';
      if (!g[k]) { g[k] = { sum: 0, n: 0 }; order.push(k); }
      g[k].sum += v;
      g[k].n++;
    }
    return order.map(function (x) {
      b = groupF ? bucketByKey(groupF, x) : { name: '全部', color: '#6b8cff' };
      var val = mode === 'avg' ? g[x].sum / g[x].n : g[x].sum;
      return { name: b.key === '' ? noneLabelFor(groupF) : b.name, color: b.color, value: Math.round(val * 100) / 100 };
    });
  }

  /* ── ECharts 公共样式与几种图形 ─────────────── */
  function echBase() {
    return {
      textStyle: { fontFamily: '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif', color: '#2b2f33' },
      tooltip: {
        backgroundColor: '#fff', borderColor: '#E4EAF4', borderWidth: 1,
        textStyle: { color: '#16203A', fontSize: 12 },
        extraCssText: 'box-shadow:0 6px 20px rgba(20,34,64,.10);border-radius:8px;'
      },
      animationDuration: 420,
      animationEasing: 'cubicOut'
    };
  }
  function optHBar(items) {                      // 横向条形：每条用自己的色（取自数据表选项色）
    return {
      grid: { left: 2, right: 36, top: 6, bottom: 2, containLabel: true },
      xAxis: {
        type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#8b939f', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F8' } }
      },
      yAxis: {
        type: 'category', inverse: true, data: items.map(function (x) { return x.name; }),
        axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#2b2f33', fontSize: 11 }
      },
      series: [{
        type: 'bar', barMaxWidth: 15, barCategoryGap: '38%',
        label: { show: true, position: 'right', fontSize: 11, color: '#5b6270' },
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        data: items.map(function (x) { return { value: x.value, itemStyle: { color: x.color } }; })
      }]
    };
  }
  function optVBar(items) {                      // 纵向柱：条目多时自动斜排标签
    return {
      grid: { left: 2, right: 10, top: 14, bottom: 2, containLabel: true },
      xAxis: {
        type: 'category', data: items.map(function (x) { return x.name; }),
        axisLine: { lineStyle: { color: '#E9EBEF' } }, axisTick: { show: false },
        axisLabel: { color: '#5b6270', fontSize: 10, rotate: items.length > 8 ? 32 : 0 }
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#8b939f', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F8' } }
      },
      series: [{
        type: 'bar', barMaxWidth: 24, itemStyle: { borderRadius: [3, 3, 0, 0] },
        label: { show: items.length <= 12, position: 'top', fontSize: 10.5, color: '#5b6270' },
        data: items.map(function (x) {
          return { value: x.value, itemStyle: { color: x.color || '#6b8cff' } };
        })
      }]
    };
  }
  function optPie(items, kind) {
    var rose = kind === 'rose', donut = kind === 'donut';
    var total = items.reduce(function (s, x) { return s + x.value; }, 0);
    var o = {
      tooltip: echBase().tooltip,
      legend: {
        bottom: 0, icon: 'circle', itemWidth: 7, itemHeight: 7, itemGap: 11,
        textStyle: { fontSize: 10.5, color: '#5b6270' }
      },
      series: [{
        type: 'pie',
        radius: rose ? ['16%', '70%'] : (donut ? ['52%', '76%'] : '74%'),
        center: ['50%', donut ? '43%' : '45%'],
        roseType: rose ? 'radius' : false, avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: !donut, formatter: '{b} {c}', fontSize: 10.5, color: '#5b6270' },
        labelLine: { length: 5, length2: 5, lineStyle: { color: '#d5dbe6' } },
        data: items.map(function (x) { return { name: x.name, value: x.value, itemStyle: { color: x.color } }; })
      }]
    };
    o.tooltip = {
      trigger: 'item', formatter: '{b}：{c} 条（{d}%）',
      backgroundColor: '#fff', borderColor: '#E4EAF4', borderWidth: 1,
      textStyle: { color: '#16203A', fontSize: 12 },
      extraCssText: 'box-shadow:0 6px 20px rgba(20,34,64,.10);border-radius:8px;'
    };
    if (donut) {                                 // 环形中心写总数，图例看分布
      o.graphic = [
        { type: 'text', left: 'center', top: '33%', silent: true, style: { text: String(total), fontSize: 23, fontWeight: 'bold', fill: '#16181d', textAlign: 'center' } },
        { type: 'text', left: 'center', top: '46%', silent: true, style: { text: '条记录', fontSize: 10.5, fill: '#8b939f', textAlign: 'center' } }
      ];
    }
    return o;
  }
  function optGauge(pct, color, cap) {
    return {
      tooltip: echBase().tooltip,
      series: [{
        type: 'gauge', startAngle: 206, endAngle: -26, min: 0, max: 100, radius: '90%', center: ['50%', '56%'],
        progress: { show: true, width: 16, roundCap: true, itemStyle: { color: color } },
        axisLine: { lineStyle: { width: 16, color: [[1, '#EEF1F7']] } },
        pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { show: false }, anchor: { show: false },
        detail: { valueAnimation: true, offsetCenter: [0, '0%'], fontSize: 30, fontWeight: 'bold', color: '#16181d', formatter: '{value}%' },
        title: { offsetCenter: [0, '30%'], fontSize: 11, color: '#8b939f' },
        data: [{ value: pct, name: cap }]
      }]
    };
  }
  function optLine(items, color, filled) {
    return {
      grid: { left: 2, right: 12, top: 14, bottom: 2, containLabel: true },
      xAxis: {
        type: 'category', boundaryGap: false, data: items.map(function (x) { return x.name; }),
        axisLine: { lineStyle: { color: '#E9EBEF' } }, axisTick: { show: false },
        axisLabel: { color: '#5b6270', fontSize: 10 }
      },
      yAxis: {
        type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#8b939f', fontSize: 10 }, splitLine: { lineStyle: { color: '#EDF1F8' } }
      },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, showSymbol: items.length <= 24,
        lineStyle: { width: 2.4, color: color }, itemStyle: { color: color },
        areaStyle: filled ? {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: tint(color, .26) }, { offset: 1, color: tint(color, .02) }]
          }
        } : { opacity: 0 },
        data: items.map(function (x) { return x.value; })
      }]
    };
  }

  /* ── 图表清单：按字段角色动态拼，缺字段就不出现 ───────── */
  function roleLine() {
    var p = [];
    if (F.status) { p.push('分组轴「' + F.status.name + '」'); }
    if (F.sub) { p.push('次要分组「' + F.sub.name + '」'); }
    if (F.user) { p.push('人员「' + F.user.name + '」'); }
    if (F.tag) { p.push('标签「' + F.tag.name + '」'); }
    if (F.date) { p.push('日期「' + F.date.name + '」'); }
    if (F.num) { p.push('数值「' + F.num.name + '」'); }
    return p.length ? '字段角色自动识别：' + p.join(' · ') : '';
  }
  function pieDef(items, pref) {                  // 只有一个取值时饼/玫瑰就是一块色，不如条形直白
    return items.length > 1 ? pref : 'bar';
  }
  function oneHint(items) {
    return items.length === 1 ? ' · 只有 1 个取值在用' : '';
  }
  function curKind(s) {                           // 记着的图形若已不在本图的候选里（换表/改字段），退回默认
    var k = kinds[s.id], i;
    for (i = 0; i < s.kinds.length; i++) { if (s.kinds[i][0] === k) { return k; } }
    return s.def;
  }
  function chartSpecs(rows) {
    var out = [], n = rows.length, it, done = bucketByHints(DONE_HINTS), rate;
    var suffix = kw ? ' · 已按搜索过滤' : '';

    if (F.status) {
      it = tallySelect(F.status, rows);
      if (it.length) {
        out.push({
          id: 'status', title: F.status.name + ' 分布', def: pieDef(it, 'donut'), data: it,
          note: 'select 字段「' + F.status.name + '」· ' + n + ' 条' + oneHint(it) + suffix,
          kinds: [['donut', '环形'], ['bar', '条形'], ['rose', '玫瑰']],
          build: function (k, d) { return k === 'bar' ? optHBar(d) : optPie(d, k); }
        });
      }
    }
    if (F.user) {
      it = tallyPeople(F.user, rows);
      if (it.length) {
        out.push({
          id: 'user', title: F.user.name + ' 任务量', def: 'bar', data: it,
          note: 'user 字段「' + F.user.name + '」· 多处理人取第一个' + suffix,
          kinds: [['bar', '条形'], ['pie', '环形']],
          build: function (k, d) { return k === 'bar' ? optHBar(d) : optPie(d, 'donut'); }
        });
      }
    }
    if (F.sub) {
      it = tallySelect(F.sub, rows);
      if (it.length) {
        out.push({
          id: 'sub', title: F.sub.name + ' 分布', def: pieDef(it, 'rose'), data: it,
          note: '次要 select 字段「' + F.sub.name + '」· ' + n + ' 条' + oneHint(it) + suffix,
          kinds: [['rose', '玫瑰'], ['donut', '环形'], ['bar', '条形']],
          build: function (k, d) { return k === 'bar' ? optHBar(d) : optPie(d, k); }
        });
      }
    }
    if (F.tag) {
      it = tallyTags(F.tag, rows);
      if (it.length) {
        out.push({
          id: 'tag', title: F.tag.name + ' 分布', def: 'bar', data: it,
          note: 'multiSelect 字段「' + F.tag.name + '」· 一条记录可计入多个' + suffix,
          kinds: [['bar', '条形'], ['donut', '环形']],
          build: function (k, d) { return k === 'bar' ? optHBar(d) : optPie(d, 'donut'); }
        });
      }
    }
    if (F.date) {
      var tl = tallyDates(F.date, rows);
      if (tl) {
        out.push({
          id: 'date', title: F.date.name + ' 趋势', def: 'line', data: tl.items, tall: 1,
          note: 'date 字段「' + F.date.name + '」· 按' + (tl.byMonth ? '月' : '天') + '汇总' + suffix,
          kinds: [['line', '折线'], ['area', '面积'], ['bar', '柱状']],
          build: function (k, d) { return k === 'bar' ? optVBar(d) : optLine(d, '#6b8cff', k === 'area'); }
        });
      }
    }
    if (F.num && F.status) {
      var sum = tallyNumber(F.num, F.status, rows, 'sum'), avg = tallyNumber(F.num, F.status, rows, 'avg');
      if (sum.length) {
        out.push({
          id: 'num', title: F.num.name + ' 聚合', def: 'sum', data: sum, dataAvg: avg,
          note: 'number 字段「' + F.num.name + '」· 按「' + F.status.name + '」' + suffix,
          kinds: [['sum', '求和'], ['avg', '均值']],
          build: function (k, d, sp) { return optVBar(k === 'avg' ? sp.dataAvg : d); }
        });
      }
    }
    rate = (F.status && done && n) ? Math.round(tallySelect(F.status, rows).reduce(function (s, x) {
      return s + (x.name === done.name ? x.value : 0);
    }, 0) / n * 1000) / 10 : null;
    if (rate != null) {
      out.push({
        id: 'rate', title: '完成率', def: 'gauge', data: [{ value: rate }], tall: 1,
        note: '「' + done.name + '」占全部 ' + n + ' 条的比例' + suffix,
        kinds: [],
        build: function (k, d) { return optGauge(d[0].value, done.color, done.name); }
      });
    }
    return out;
  }

  function renderCharts() {
    var host = $('charts');
    gcharts.forEach(function (c) { try { c.dispose(); } catch (e) {} });
    gcharts = [];
    if (!records.length) {
      host.innerHTML = '<div class="empty" style="margin:22px auto"><b>这张数据表还没有记录</b>先在多维表格里添加记录，或点右上角「新建记录」</div>';
      return;
    }
    var specs = chartSpecs(visible());
    if (!specs.length) {
      host.innerHTML = '<div class="empty" style="margin:22px auto;text-align:left;max-width:620px">'
        + '<b>这张表暂时画不出图表</b>图表是按字段类型自动适配的：select → 分布环形/条形，user → 人员任务量，'
        + 'multiSelect → 标签分布，date → 时间趋势，number → 按分组求和/均值。<br>'
        + '给数据表加一个上述类型的字段并填上值，刷新本页就会出现对应的图。</div>';
      return;
    }
    var html = specs.map(function (s) {
      var kind = curKind(s);
      var btns = s.kinds.length ? '<div class="ctype" role="group" aria-label="图形">' + s.kinds.map(function (k) {
        return '<button type="button" data-ck="' + s.id + '" data-kind="' + k[0] + '" aria-pressed="'
          + (k[0] === kind ? 'true' : 'false') + '">' + k[1] + '</button>';
      }).join('') + '</div>' : '';
      return '<section class="ccard"><div class="ccard-hd"><div class="ccard-tt"><b>' + esc(s.title) + '</b>'
        + '<span>' + esc(s.note) + '</span></div>' + btns + '</div>'
        + '<div class="cbox' + (s.tall ? ' cbox--tall' : '') + '" id="ck-' + s.id + '"></div></section>';
    }).join('');
    host.innerHTML = '<div class="cg-head"><b>' + specs.length + ' 个图表</b><span>' + esc(roleLine()) + '</span></div>'
      + '<div class="cgrid">' + html + '</div>';

    if (typeof echarts === 'undefined') { return; }
    specs.forEach(function (s) {
      var el = $('ck-' + s.id);
      if (!el) { return; }
      var merged = echBase(), o = s.build(curKind(s), s.data, s), k;
      for (k in o) { merged[k] = o[k]; }
      var ch = echarts.init(el);
      ch.setOption(merged);
      gcharts.push(ch);
    });
  }

  /* ── 抽屉（详情 / 编辑）─────────────────────── */
  function chipRow(f, value, canEdit) {
    var bs = bucketsOf(f);
    var nl = noneLabelFor(f);
    var html = bs.map(function (b, i) {
      var on = (value === b.key) ? ' on' : '';
      var nm = (i === 0) ? nl : b.name;
      return '<button type="button" class="chip' + on + '" data-set="' + f.col + '" data-val="' + esc(b.key) + '"'
        + (canEdit ? '' : ' disabled')
        + ' style="--chip-bg:' + tint(b.color, .16) + ';--chip-bd:' + tint(b.color, .5) + ';--chip-fg:' + darken(b.color, .35) + '">'
        + esc(nm) + '</button>';
    }).join('');
    return '<div class="chips">' + html + '</div>' + (canEdit ? '<div class="hint">点击即时同步到数据表</div>' : '');
  }
  function tagChips(f, value, canEdit) {
    var ids = value ? value.split(',') : [];
    var os = (f.schema && f.schema.options) || [];
    var html = os.map(function (o) {
      var on = ids.indexOf(o.id) >= 0 ? ' on' : '';
      return '<button type="button" class="chip' + on + '" data-tag="' + f.col + '" data-val="' + esc(o.id) + '"'
        + (canEdit ? '' : ' disabled')
        + ' style="--chip-bg:' + tint(o.color || '#8c8c8c', .16) + ';--chip-bd:' + tint(o.color || '#8c8c8c', .5) + ';--chip-fg:' + darken(o.color || '#8c8c8c', .35) + '">'
        + esc(o.name) + '</button>';
    }).join('');
    return '<div class="chips">' + (html || '<span class="hint">该字段还没有定义选项</span>') + '</div>'
      + (canEdit && os.length ? '<div class="hint">可多选，点击即时同步</div>' : '');
  }

  function renderDrawer() {
    if (drawerRow == null) { return; }
    var r = null, i;
    for (i = 0; i < records.length; i++) { if (records[i].row === drawerRow) { r = records[i]; } }
    if (!r) { closeDrawer(); return; }
    $('dRow').textContent = '记录 #' + pad(r.row) + (editable ? '' : ' · 只读');
    $('dTitle').textContent = valOf(r, F.title) || '（未填标题）';
    var html = '';
    if (editable && F.title) {
      html += '<div class="fld"><label>' + esc(F.title.name) + '</label><input type="text" id="dInputTitle" value="' + esc(valOf(r, F.title)) + '"></div>';
    }
    if (F.status) { html += '<div class="fld"><label>' + esc(F.status.name) + '</label>' + chipRow(F.status, valOf(r, F.status), editable) + '</div>'; }
    if (F.sub) { html += '<div class="fld"><label>' + esc(F.sub.name) + '</label>' + chipRow(F.sub, valOf(r, F.sub), editable) + '</div>'; }
    if (F.user) {
      html += '<div class="fld"><label>' + esc(F.user.name) + '</label>';
      if (editable) { html += '<input type="text" id="dInputWho" value="' + esc(valOf(r, F.user)) + '" placeholder="多个用英文逗号分隔">'; }
      else { html += '<div class="t-people">' + peopleHtml(valOf(r, F.user), true) + '</div>'; }
      html += '</div>';
    }
    if (F.tag) { html += '<div class="fld"><label>' + esc(F.tag.name) + '</label>' + tagChips(F.tag, valOf(r, F.tag), editable) + '</div>'; }
    var rest = fields.filter(function (f) { return [F.title, F.status, F.sub, F.user, F.tag].indexOf(f) < 0; });
    if (rest.length) {
      html += '<div class="fld"><label>其余字段</label><div class="hint">'
        + rest.map(function (f) { return esc(f.name) + '：' + (esc(valOf(r, f)) || '—'); }).join('<br>') + '</div></div>';
    }
    $('dBody').innerHTML = html;
    $('dDel').style.display = editable ? '' : 'none';
    if (editable) {
      var ti = $('dInputTitle'), wi = $('dInputWho');
      if (ti) {
        ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { ti.blur(); } });
        ti.addEventListener('blur', function () {
          if (ti.value !== valOf(r, F.title)) { write(F.title.col, r.row, ti.value); }
        });
      }
      if (wi) {
        wi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { wi.blur(); } });
        wi.addEventListener('blur', function () {
          if (wi.value !== valOf(r, F.user)) { write(F.user.col, r.row, wi.value); }
        });
      }
    }
    $('dBody').onclick = function (e) {
      var el = e.target.closest ? e.target.closest('[data-set],[data-tag]') : null;
      if (!el || !editable) { return; }
      var col = Number(el.getAttribute('data-set') || el.getAttribute('data-tag'));
      var val = el.getAttribute('data-val') || '';
      if (el.hasAttribute('data-set')) {
        write(col, drawerRow, val === '' ? null : val);
      } else {
        var cur = '', j;
        for (j = 0; j < records.length; j++) { if (records[j].row === drawerRow) { cur = String(records[j].values[col] || ''); } }
        var ids = cur ? cur.split(',') : [];
        var at = ids.indexOf(val);
        if (at >= 0) { ids.splice(at, 1); } else { ids.push(val); }
        write(col, drawerRow, ids.join(','));
      }
    };
  }
  function openDrawer(row) {
    drawerRow = row;
    $('mask').style.display = 'block';
    $('drawer').className = 'drawer on';
    $('drawer').setAttribute('aria-hidden', 'false');
    renderDrawer();
  }
  function closeDrawer() {
    drawerRow = null;
    $('drawer').className = 'drawer';
    $('drawer').setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.on')) { $('mask').style.display = 'none'; }
  }

  /* ── 弹层 ───────────────────────────────────── */
  function openModal(id) { $('mask').style.display = 'block'; $(id).className = 'modal on'; }
  function closeModal(id) { $(id).className = 'modal'; if (!document.querySelector('.modal.on') && drawerRow == null) { $('mask').style.display = 'none'; } }
  function fillSelect(sel, f, preset) {
    var bs = bucketsOf(f), html = '', i;
    var nl = f ? noneLabelFor(f) : NONE_LABEL;
    for (i = 0; i < bs.length; i++) {
      if (i === 0) { html += '<option value="">' + esc(nl) + '</option>'; continue; }
      html += '<option value="' + esc(bs[i].key) + '">' + esc(bs[i].name) + '</option>';
    }
    sel.innerHTML = html;
    sel.value = preset || '';
  }

  /* 「新建记录」弹层：标题、字段名、显隐全部跟着真实字段走 —— 换一张表不用改代码 */
  function syncNewForm(preset) {
    var map = [['fTitle', 'lblTitle', F.title, '标题'],
               ['fStatus', 'lblStatus', F.status, '状态'],
               ['fWho', 'lblWho', F.user, '人员'],
               ['fPri', 'lblPri', F.sub, '次要分组']];
    var i, m;
    for (i = 0; i < map.length; i++) {
      m = map[i];
      $(m[0]).style.display = m[2] ? '' : 'none';
      $(m[1]).textContent = m[2] ? m[2].name : m[3];
    }
    if (F.status) { fillSelect($('nStatus'), F.status, preset || ''); }
    if (F.sub) { fillSelect($('nPri'), F.sub, ''); }
  }

  /* 分组维度选择器：列的全是 select 字段，选中项 = 当前生效的分组轴 */
  function syncGroupPicker() {
    var ss = selectFields(), i, html = '', auto, autoPick;
    if (!F.status) {                               // 一个 select 字段都没有 → 没有可分组的东西
      $('pickGroup').style.display = 'none';
      return;
    }
    for (i = 0; i < ss.length; i++) { html += '<option value="' + esc(ss[i].name) + '">' + esc(ss[i].name) + '</option>'; }
    $('groupBy').innerHTML = html;
    $('groupBy').value = F.status.name;
    $('pickGroup').style.display = '';
    $('groupBy').disabled = ss.length <= 1;        // 只有一个可选字段时没得挑，仍显示当前分组轴
    /* 提示这一轴是自动认出来的还是用户手选的 —— 别让人以为系统猜错了 */
    auto = pickGroupField();
    autoPick = !groupPref || (auto && auto.col === F.status.col);
    $('pickHint').textContent = (ss.length <= 1 || autoPick) ? '自动' : '手选';
  }

  /* ── 视图切换：看板 / 表格 / 图表 ─────────────
     三个视图共用一份数据与一个搜索词；切换只动显隐，不重新拉数据。 */
  var VIEWS = ['board', 'table', 'chart'];
  function viewBtn(v) {
    var cap = v.charAt(0).toUpperCase() + v.slice(1);
    return $('v' + cap);
  }
  function applyView() {
    var i, b;
    for (i = 0; i < VIEWS.length; i++) {
      b = viewBtn(VIEWS[i]);
      if (b) { b.setAttribute('aria-pressed', view === VIEWS[i] ? 'true' : 'false'); }
    }
    $('board').style.display = view === 'board' ? 'flex' : 'none';
    $('sheet').style.display = view === 'table' ? 'block' : 'none';
    $('charts').style.display = view === 'chart' ? 'block' : 'none';
    $('metrics').style.display = view === 'table' ? 'none' : 'flex';   // 表格视图要宽度，让出指标条
    if (view === 'board') { renderBoard(); }
    else if (view === 'table') { renderTable(); }
    else { renderCharts(); }
  }
  function rerender() {                          // 搜索词变化后重画当前视图
    if (view === 'board') { renderBoard(true); }
    else if (view === 'table') { renderTable(); }
    else { renderCharts(); }
    fixCharts();
  }
  function setView(v) {
    if (view === v) { return; }
    view = v;
    savePref(PREF_VIEW, v);                   // 停在哪个视图是页面级习惯，不按数据表分
    applyView();
    fixCharts();
    setTimeout(fixCharts, 60);
  }
  function saveKinds() {
    savePref(prefKey(PREF_KINDS), JSON.stringify(kinds));
  }

  /* ── 数据读写 ───────────────────────────────── */
  /* 一个多维表格（= 一个 workbook）里可以有多张数据表（sheet）：read() 返回的 \`tables\`
     就是全部；旧后端没有这个字段时按单表回落，行为与从前完全一致。
     切表是纯前端的事 —— read 不接受参数，换表只是换用哪一份 fields / records 重画。 */
  function buildTables(s) {
    if (s && s.tables && s.tables.length) { return s.tables; }
    return [{
      sheetId: (s && s.sheetId) || null, name: '', viewMeta: s ? s.viewMeta : null,
      fields: (s && s.fields) || [], records: (s && s.records) || []
    }];
  }
  function tableName(i) {
    var t = tables[i];
    return (t && t.name) || ('数据表 ' + (i + 1));
  }
  function useTable(i) {                          // 把某张表的字段与记录接到视图层（不改数据）
    activeIdx = i;
    var t = tables[i] || snap || {};
    fields = t.fields || [];
    records = t.records || [];
    resolveFields();
  }
  /* 写指令定位：首表就是后端认的默认表（sheetOrder[0]），不带 sheetId 走原路；
     其余表必须带，否则会写回首表 —— 改的是 A 表、动的是 B 表。 */
  function curSheetId() {
    if (tables.length <= 1 || activeIdx === 0) { return null; }
    return (tables[activeIdx] && tables[activeIdx].sheetId) || null;
  }
  /* 分组轴 / 图形选择按数据表隔离：两张表的字段与选项完全不同，串着用会得到一张错图。
     键尾拼 sheetId（宿主偏好键上限 64 字符，超长就退回页面级 —— 宁可不记也不串味）。 */
  function prefKey(base) {
    var t = tables.length > 1 ? tables[activeIdx] : null;
    var sid = t ? String(t.sheetId || '') : '';
    return (sid && (base + '.' + sid).length <= 64) ? base + '.' + sid : base;
  }
  async function loadTablePrefs() {
    groupPref = null; kinds = {};
    if (!(window.repoHost && window.repoHost.getPref)) { return; }
    try { groupPref = (await window.repoHost.getPref(prefKey(PREF_GROUP))) || null; } catch (e) { groupPref = null; }
    try {
      var kk = await window.repoHost.getPref(prefKey(PREF_KINDS));
      if (kk) { kinds = JSON.parse(kk) || {}; }
    } catch (e) { kinds = {}; }
  }
  function savePref(key, val) {
    try { if (window.repoHost && window.repoHost.setPref) { window.repoHost.setPref(key, val); } } catch (e) { /* 偏好写失败不影响本次渲染 */ }
  }
  function renderTabs() {
    var host = $('tabs');
    if (tables.length <= 1) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML = tables.map(function (t, i) {
      return '<button type="button" class="tab" data-idx="' + i + '" aria-pressed="' + (i === activeIdx ? 'true' : 'false') + '">'
        + esc(tableName(i)) + '<span class="n">' + ((t.records || []).length) + '</span></button>';
    }).join('');
  }
  async function enterTable(i, silent) {          // 换表：换数据 → 换偏好 → 整套重画
    useTable(i);
    await loadTablePrefs();
    resolveFields();                              // groupPref 变了，字段角色跟着重认
    renderTabs();
    render();
    rerender();
    if (!silent) { toast('已切到「' + tableName(i) + '」'); }
  }
  function switchTable(i) {
    if (i === activeIdx || !tables[i]) { return; }
    kw = ''; $('q').value = ''; $('qClr').style.display = 'none';   // 搜索词属于上一张表
    pendingDelete = null;
    closeDrawer();                                                  // 抽屉里的行号也属于上一张表
    savePref(PREF_TABLE, String(tables[i].sheetId || ''));
    enterTable(i);
  }
  function render() {
    $('btnNew').style.display = editable ? '' : 'none';
    syncGroupPicker();
    renderMetrics();
    applyView();
    if (drawerRow != null) { renderDrawer(); }
    var t = stripSite(document.title);
    var d = new Date();
    var tm = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    $('pageTitle').textContent = t;
    /* 搜索覆盖所有字段，占位文案就写成通用的，不写死字段名 */
    $('q').placeholder = '搜索' + fields.length + ' 个字段的任意内容';
    $('meta').innerHTML = (tables.length > 1 ? '数据表「' + esc(tableName(activeIdx)) + '」<i>·</i>' : '')
      + '<b>' + records.length + '</b> 条记录<i>·</i><b>' + fields.length + '</b> 个字段<i>·</i>'
      + (editable ? '可编辑' : '只读') + '<i>·</i>同步于 ' + esc(tm);
    $('footSrc').textContent = '数据源 · ' + t;
    $('footSync').textContent = (editable ? '可编辑' : '只读')
      + (canDrag() ? ' · 拖拽卡片可改' + F.status.name : '') + ' · 已同步 ' + tm;
  }
  async function reload() {
    snap = await api.read();
    editable = snap.editable !== false;
    tables = buildTables(snap);
    if (pendingSheetId) {                         // 首次读：回到上次看的那张表（还在的话）
      for (var i = 0; i < tables.length; i++) { if (tables[i].sheetId === pendingSheetId) { activeIdx = i; } }
      pendingSheetId = null;
    }
    if (activeIdx >= tables.length) { activeIdx = Math.max(0, tables.length - 1); }
    useTable(activeIdx);
    renderTabs();
    render();
  }
  async function write(col, row, value, okMsg) {
    try {
      await api.setCellValue(row, col, value, curSheetId());
      await reload();
      toast(okMsg || '已同步到数据表');
    } catch (e) {
      toast('写入失败：' + (e && e.message ? e.message : e), true);
    }
  }

  /* ── 事件绑定 ───────────────────────────────── */
  $('q').addEventListener('input', function () {
    kw = this.value.trim();
    $('qClr').style.display = kw ? 'block' : 'none';
    rerender();
  });
  $('qClr').addEventListener('click', function () {
    $('q').value = ''; kw = ''; this.style.display = 'none'; $('q').focus();
    rerender();
  });
  $('vBoard').addEventListener('click', function () { setView('board'); });
  $('vTable').addEventListener('click', function () { setView('table'); });
  $('vChart').addEventListener('click', function () { setView('chart'); });
  $('tabs').addEventListener('click', function (e) {   // 切换多维表格里的哪张数据表
    var b = e.target.closest ? e.target.closest('.tab') : null;
    if (!b) { return; }
    switchTable(Number(b.getAttribute('data-idx')));
  });
  $('charts').addEventListener('click', function (e) {   // 每张卡片右上角的图形切换
    var b = e.target.closest ? e.target.closest('[data-kind]') : null;
    if (!b) { return; }
    var ck = b.getAttribute('data-ck');
    if (!ck) { return; }
    kinds[ck] = b.getAttribute('data-kind');
    saveKinds();
    renderCharts();
    fixCharts();
  });
  $('board').addEventListener('click', function (e) {
    if (Date.now() - justDragged < 260) { return; }   /* 拖完那一下不当作点击，免得顺手弹抽屉 */
    var el = e.target.closest ? e.target.closest('[data-add]') : null;
    if (el) {
      syncNewForm(el.getAttribute('data-add'));
      $('nTitle').value = ''; $('nWho').value = '';
      $('nTitle').placeholder = '写一句能看懂的话';
      openModal('mNew');
      (F.title ? $('nTitle') : (F.status ? $('nStatus') : $('nOk'))).focus();
      return;
    }
    var card = e.target.closest ? e.target.closest('.card[data-row]') : null;
    if (card) { openDrawer(Number(card.getAttribute('data-row'))); }
  });
  $('board').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') { return; }
    var card = e.target.closest ? e.target.closest('.card[data-row]') : null;
    if (card) { openDrawer(Number(card.getAttribute('data-row'))); }
  });

  /* ── 拖拽卡片改状态 ─────────────────────────── */
  var dragRow = null, dragFrom = '', dragName = '', dropCol = null, justDragged = 0;

  function colAt(e) {
    var el = document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : e.target;
    return el && el.closest ? el.closest('.col[data-bucket]') : null;
  }
  function markCol(col) {
    if (dropCol === col) { return; }
    if (dropCol) { dropCol.classList.remove('drop-on'); }
    dropCol = col;
    if (col) { col.classList.add('drop-on'); }
  }
  function dragCleanup() {
    var d = $('board').querySelector('.card.dragging');
    if (d) { d.classList.remove('dragging'); }
    if (dropCol) { dropCol.classList.remove('drop-on'); }
    dropCol = null; dragRow = null; dragFrom = '';
    document.body.classList.remove('dragging');
  }

  $('board').addEventListener('dragstart', function (e) {
    var card = e.target.closest ? e.target.closest('.card[data-row]') : null;
    if (!card) { return; }
    if (!canDrag()) { e.preventDefault(); return; }
    var r = findRecord(Number(card.getAttribute('data-row')));
    if (!r) { e.preventDefault(); return; }
    dragRow = r.row;
    dragFrom = bucketKeyOf(r, F.status);
    dragName = valOf(r, F.title) || ('#' + pad(r.row));
    card.classList.add('dragging');
    document.body.classList.add('dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'row-' + r.row); } catch (x) {}
    }
  });
  $('board').addEventListener('dragover', function (e) {
    if (dragRow == null) { return; }
    var host = $('board');
    e.preventDefault();                                   /* 不 preventDefault 就不会触发 drop */
    if (e.dataTransfer) { e.dataTransfer.dropEffect = 'move'; }
    var box = host.getBoundingClientRect();               /* 贴边自动横向滚动，列多时不用先手动滚 */
    if (e.clientX < box.left + 56) { host.scrollLeft -= 18; }
    else if (e.clientX > box.right - 56) { host.scrollLeft += 18; }
    markCol(colAt(e));
  });
  $('board').addEventListener('dragleave', function (e) {
    if (dragRow == null) { return; }
    if (!e.relatedTarget || !$('board').contains(e.relatedTarget)) { markCol(null); }
  });
  $('board').addEventListener('drop', function (e) {
    if (dragRow == null) { return; }
    e.preventDefault();
    var col = colAt(e);
    var row = dragRow, from = dragFrom, nm = dragName;
    var key = col ? col.getAttribute('data-bucket') : null;
    var to = col ? col.getAttribute('data-bname') : '';
    dragCleanup();
    justDragged = Date.now();
    if (key == null) { return; }                          /* 丢在列外（工具栏/空白），当没发生 */
    if (key === from) { toast('「' + nm + '」已在「' + to + '」列'); return; }
    write(F.status.col, row, key === '' ? null : key, '「' + nm + '」已移到「' + to + '」');
  });
  $('board').addEventListener('dragend', function () { dragCleanup(); justDragged = Date.now(); });
  $('sheet').addEventListener('click', function (e) {
    var tr = e.target.closest ? e.target.closest('tr') : null;
    if (!tr || !tr.parentNode || tr.parentNode.tagName !== 'TBODY') { return; }
    var rows = visible(), i = Array.prototype.indexOf.call(tr.parentNode.children, tr);
    if (rows[i]) { openDrawer(rows[i].row); }
  });
  $('btnNew').addEventListener('click', function () {
    var bs = F.status ? bucketsOf(F.status) : [];
    syncNewForm(bs.length > 1 ? bs[1].key : '');
    $('nTitle').value = ''; $('nWho').value = '';
    openModal('mNew');
    (F.title ? $('nTitle') : (F.status ? $('nStatus') : $('nOk'))).focus();
  });
  $('nCancel').addEventListener('click', function () { closeModal('mNew'); });
  $('nOk').addEventListener('click', async function () {
    var t = F.title ? $('nTitle').value.trim() : '';
    if (F.title && !t) { toast('请先填写' + F.title.name, true); $('nTitle').focus(); return; }
    var values = {};
    if (F.title) { values[F.title.col] = t; }
    if (F.status && $('nStatus').value) { values[F.status.col] = $('nStatus').value; }
    if (F.sub && $('nPri').value) { values[F.sub.col] = $('nPri').value; }
    if (F.user && $('nWho').value.trim()) { values[F.user.col] = $('nWho').value.trim(); }
    try {
      await api.appendRecord(values, curSheetId());
      closeModal('mNew');
      await reload();
      toast('已新增 1 条记录');
    } catch (e) { toast('新增失败：' + (e && e.message ? e.message : e), true); }
  });
  $('groupBy').addEventListener('change', function () {
    groupPref = this.value || null;
    savePref(prefKey(PREF_GROUP), groupPref || '');
    resolveFields();
    render();
    rerender();                                  // 看板要回到第一列，图表轴也跟着换
    toast('已按「' + (F.status ? F.status.name : '') + '」分组');
  });
  $('dClose').addEventListener('click', closeDrawer);
  $('dDone').addEventListener('click', closeDrawer);
  $('mask').addEventListener('click', function () {
    if (document.querySelector('.modal.on')) {
      closeModal(document.querySelector('.modal.on').id);
    } else { closeDrawer(); }
  });
  $('dDel').addEventListener('click', function () {
    if (drawerRow == null) { return; }
    var r = null, i;
    for (i = 0; i < records.length; i++) { if (records[i].row === drawerRow) { r = records[i]; } }
    if (!r) { return; }
    pendingDelete = drawerRow;
    $('delText').textContent = '「' + (valOf(r, F.title) || '未命名记录') + '」将从数据表中移除，此操作不可撤销。';
    openModal('mDel');
  });
  $('delCancel').addEventListener('click', function () { pendingDelete = null; closeModal('mDel'); });
  $('delOk').addEventListener('click', async function () {
    if (pendingDelete == null) { return; }
    try {
      await api.removeRecordAt(pendingDelete, curSheetId());
      pendingDelete = null;
      closeModal('mDel');
      closeDrawer();
      await reload();
      toast('记录已删除');
    } catch (e) { toast('删除失败：' + (e && e.message ? e.message : e), true); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    var m = document.querySelector('.modal.on');
    if (m) { closeModal(m.id); } else { closeDrawer(); }
  });

  /* ── 启动 ───────────────────────────────────── */
  window.repoHost && window.repoHost.onTitle(function () { $('pageTitle').textContent = stripSite(); });
  if (!api) {
    $('meta').textContent = '未绑定数据表';
    $('board').innerHTML = '<div class="empty" style="flex:1;text-align:left;max-width:640px;margin:0 auto">'
      + '<b>这一页需要挂在一张多维表格下打开</b>'
      + '<span style="display:block;margin-top:10px;line-height:1.9">'
      + '· 已挂在表格下：检查 HTML 头部 repo-datatable-source 那一行的 content（应填数据表 slugId）是否填对'
      + '<br>· 想复用到别的表：把上面那个 content 换成目标数据表的 slugId，或在本页所在表格下新建一个 HTML 页面并粘贴本页代码'
      + '<br>· 列的角色（标题 / 分组 / 人员 / 标签）由字段类型与字段名自动识别，无需改代码</span></div>';
    return;
  }
  $('meta').textContent = '正在读取数据表…';
  (async function () {
    if (window.repoHost && window.repoHost.getPref) {
      try {                                   // 上次停在哪一屏（页面级）
        var v = await window.repoHost.getPref(PREF_VIEW);
        if (v === 'board' || v === 'table' || v === 'chart') { view = v; }
      } catch (e) { /* 读不到就用默认看板 */ }
      try {                                   // 上次看的是哪张数据表（多表时才有意义）
        pendingSheetId = (await window.repoHost.getPref(PREF_TABLE)) || null;
      } catch (e) { pendingSheetId = null; }
    }
    await reload();                           // 先拿到数据与表清单
    await loadTablePrefs();                   // 再按激活的那张表读分组轴 / 图形偏好
    resolveFields();                          // 两件事都定了才认字段角色，然后重画一遍
    renderTabs();
    render();
    rerender();
  })().catch(function (e) {
    $('board').innerHTML = '<div class="empty" style="flex:1"><b>加载失败</b>' + esc(e && e.message ? e.message : e) + '</div>';
    $('meta').textContent = '读取失败';
  });
})();
<\/script>
</body>
</html>
`,X=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});function t(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}e.default=function e(n,r){t(this,e),this.data=n,this.text=r.text||n,this.options=r}})),nt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.CODE39=void 0;var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(X());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var s=function(e){o(n,e);function n(e,t){return i(this,n),e=e.toUpperCase(),t.mod43&&(e+=f(m(e))),a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t))}return t(n,[{key:`encode`,value:function(){for(var e=u(`*`),t=0;t<this.data.length;t++)e+=u(this.data[t])+`0`;return e+=u(`*`),{data:e,text:this.text}}},{key:`valid`,value:function(){return this.data.search(/^[0-9A-Z\-\.\ \$\/\+\%]+$/)!==-1}}]),n}(n.default),c=`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*`.split(``),l=[20957,29783,23639,30485,20951,29813,23669,20855,29789,23645,29975,23831,30533,22295,30149,24005,21623,29981,23837,22301,30023,23879,30545,22343,30161,24017,21959,30065,23921,22385,29015,18263,29141,17879,29045,18293,17783,29021,18269,17477,17489,17681,20753,35770];function u(e){return d(p(e))}function d(e){return l[e].toString(2)}function f(e){return c[e]}function p(e){return c.indexOf(e)}function m(e){for(var t=0,n=0;n<e.length;n++)t+=p(e[n]);return t%=43,t}e.CODE39=s})),rt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t;function n(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var r=e.SET_A=0,i=e.SET_B=1,a=e.SET_C=2;e.SHIFT=98;var o=e.START_A=103,s=e.START_B=104,c=e.START_C=105;e.MODULO=103,e.STOP=106,e.FNC1=207,e.SET_BY_CODE=(t={},n(t,o,r),n(t,s,i),n(t,c,a),t),e.SWAP={101:r,100:i,99:a},e.A_START_CHAR=`Ð`,e.B_START_CHAR=`Ñ`,e.C_START_CHAR=`Ò`,e.A_CHARS=`[\0-_È-Ï]`,e.B_CHARS=`[ -È-Ï]`,e.C_CHARS=`(Ï*[0-9]{2}Ï*)`,e.BARS=[11011001100,11001101100,11001100110,10010011e3,10010001100,10001001100,10011001e3,10011000100,10001100100,11001001e3,11001000100,11000100100,10110011100,10011011100,10011001110,10111001100,10011101100,10011100110,11001110010,11001011100,11001001110,11011100100,11001110100,11101101110,11101001100,11100101100,11100100110,11101100100,11100110100,11100110010,11011011e3,11011000110,11000110110,10100011e3,10001011e3,10001000110,10110001e3,10001101e3,10001100010,11010001e3,11000101e3,11000100010,10110111e3,10110001110,10001101110,10111011e3,10111000110,10001110110,11101110110,11010001110,11000101110,11011101e3,11011100010,11011101110,11101011e3,11101000110,11100010110,11101101e3,11101100010,11100011010,11101111010,11001000010,11110001010,1010011e4,10100001100,1001011e4,10010000110,10000101100,10000100110,1011001e4,10110000100,1001101e4,10011000010,10000110100,10000110010,11000010010,1100101e4,11110111010,11000010100,10001111010,10100111100,10010111100,10010011110,10111100100,10011110100,10011110010,11110100100,11110010100,11110010010,11011011110,11011110110,11110110110,10101111e3,10100011110,10001011110,10111101e3,10111100010,11110101e3,11110100010,10111011110,10111101110,11101011110,11110101110,11010000100,1101001e4,11010011100,1100011101011]})),it=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(X()),r=rt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(n,e);function n(e,t){a(this,n);var r=o(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e.substring(1),t));return r.bytes=e.split(``).map(function(e){return e.charCodeAt(0)}),r}return t(n,[{key:`valid`,value:function(){return/^[\x00-\x7F\xC8-\xD3]+$/.test(this.data)}},{key:`encode`,value:function(){var e=this.bytes,t=e.shift()-105,i=r.SET_BY_CODE[t];if(i===void 0)throw RangeError(`The encoding does not start with a start character.`);this.shouldEncodeAsEan128()===!0&&e.unshift(r.FNC1);var a=n.next(e,1,i);return{text:this.text===this.data?this.text.replace(/[^\x20-\x7E]/g,``):this.text,data:n.getBar(t)+a.result+n.getBar((a.checksum+t)%r.MODULO)+n.getBar(r.STOP)}}},{key:`shouldEncodeAsEan128`,value:function(){var e=this.options.ean128||!1;return typeof e==`string`&&(e=e.toLowerCase()===`true`),e}}],[{key:`getBar`,value:function(e){return r.BARS[e]?r.BARS[e].toString():``}},{key:`correctIndex`,value:function(e,t){if(t===r.SET_A){var n=e.shift();return n<32?n+64:n-32}return t===r.SET_B?e.shift()-32:(e.shift()-48)*10+e.shift()-48}},{key:`next`,value:function(e,t,i){if(!e.length)return{result:``,checksum:0};var a=void 0,o=void 0;if(e[0]>=200){o=e.shift()-105;var s=r.SWAP[o];s===void 0?((i===r.SET_A||i===r.SET_B)&&o===r.SHIFT&&(e[0]=i===r.SET_A?e[0]>95?e[0]-96:e[0]:e[0]<32?e[0]+96:e[0]),a=n.next(e,t+1,i)):a=n.next(e,t+1,s)}else o=n.correctIndex(e,i),a=n.next(e,t+1,i);var c=n.getBar(o),l=o*t;return{result:c+a.result,checksum:l+a.checksum}}}]),n}(n.default)})),at=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=rt(),n=function(e){return e.match(RegExp(`^`+t.A_CHARS+`*`))[0].length},r=function(e){return e.match(RegExp(`^`+t.B_CHARS+`*`))[0].length},i=function(e){return e.match(RegExp(`^`+t.C_CHARS+`*`))[0]};function a(e,n){var r=n?t.A_CHARS:t.B_CHARS,i=e.match(RegExp(`^(`+r+`+?)(([0-9]{2}){2,})([^0-9]|$)`));if(i)return i[1]+`Ì`+o(e.substring(i[1].length));var s=e.match(RegExp(`^`+r+`+`))[0];return s.length===e.length?e:s+String.fromCharCode(n?205:206)+a(e.substring(s.length),!n)}function o(e){var t=i(e),o=t.length;if(o===e.length)return e;e=e.substring(o);var s=n(e)>=r(e);return t+String.fromCharCode(s?206:205)+a(e,s)}e.default=function(e){var s=void 0;if(i(e).length>=2)s=t.C_START_CHAR+o(e);else{var c=n(e)>r(e);s=(c?t.A_START_CHAR:t.B_START_CHAR)+a(e,c)}return s.replace(/[\xCD\xCE]([^])[\xCD\xCE]/,function(e,t){return`Ë`+t})}})),ot=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(it()),n=r(at());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(t,e);function t(e,r){if(i(this,t),/^[\x00-\x7F\xC8-\xD3]+$/.test(e))var o=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,(0,n.default)(e),r));else var o=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,r));return a(o)}return t}(t.default)})),st=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(it()),r=rt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(n,e);function n(e,t){return a(this,n),o(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,r.A_START_CHAR+e,t))}return t(n,[{key:`valid`,value:function(){return RegExp(`^`+r.A_CHARS+`+$`).test(this.data)}}]),n}(n.default)})),ct=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(it()),r=rt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(n,e);function n(e,t){return a(this,n),o(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,r.B_START_CHAR+e,t))}return t(n,[{key:`valid`,value:function(){return RegExp(`^`+r.B_CHARS+`+$`).test(this.data)}}]),n}(n.default)})),lt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(it()),r=rt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(n,e);function n(e,t){return a(this,n),o(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,r.C_START_CHAR+e,t))}return t(n,[{key:`valid`,value:function(){return RegExp(`^`+r.C_CHARS+`+$`).test(this.data)}}]),n}(n.default)})),ut=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.CODE128C=e.CODE128B=e.CODE128A=e.CODE128=void 0;var t=a(ot()),n=a(st()),r=a(ct()),i=a(lt());function a(e){return e&&e.__esModule?e:{default:e}}e.CODE128=t.default,e.CODE128A=n.default,e.CODE128B=r.default,e.CODE128C=i.default})),Z=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.SIDE_BIN=`101`,e.MIDDLE_BIN=`01010`,e.BINARIES={L:[`0001101`,`0011001`,`0010011`,`0111101`,`0100011`,`0110001`,`0101111`,`0111011`,`0110111`,`0001011`],G:[`0100111`,`0110011`,`0011011`,`0100001`,`0011101`,`0111001`,`0000101`,`0010001`,`0001001`,`0010111`],R:[`1110010`,`1100110`,`1101100`,`1000010`,`1011100`,`1001110`,`1010000`,`1000100`,`1001000`,`1110100`],O:[`0001101`,`0011001`,`0010011`,`0111101`,`0100011`,`0110001`,`0101111`,`0111011`,`0110111`,`0001011`],E:[`0100111`,`0110011`,`0011011`,`0100001`,`0011101`,`0111001`,`0000101`,`0010001`,`0001001`,`0010111`]},e.EAN2_STRUCTURE=[`LL`,`LG`,`GL`,`GG`],e.EAN5_STRUCTURE=[`GGLLL`,`GLGLL`,`GLLGL`,`GLLLG`,`LGGLL`,`LLGGL`,`LLLGG`,`LGLGL`,`LGLLG`,`LLGLG`],e.EAN13_STRUCTURE=[`LLLLLL`,`LLGLGG`,`LLGGLG`,`LLGGGL`,`LGLLGG`,`LGGLLG`,`LGGGLL`,`LGLGLG`,`LGLGGL`,`LGGLGL`]})),dt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=Z();e.default=function(e,n,r){var i=e.split(``).map(function(e,r){return t.BINARIES[n[r]]}).map(function(t,n){return t?t[e[n]]:``});if(r){var a=e.length-1;i=i.map(function(e,t){return t<a?e+r:e})}return i.join(``)}})),ft=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=Z(),r=a(dt()),i=a(X());function a(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function s(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function c(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){c(i,e);function i(e,t){o(this,i);var n=s(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,e,t));return n.fontSize=!t.flat&&t.fontSize>t.width*10?t.width*10:t.fontSize,n.guardHeight=t.height+n.fontSize/2+t.textMargin,n}return t(i,[{key:`encode`,value:function(){return this.options.flat?this.encodeFlat():this.encodeGuarded()}},{key:`leftText`,value:function(e,t){return this.text.substr(e,t)}},{key:`leftEncode`,value:function(e,t){return(0,r.default)(e,t)}},{key:`rightText`,value:function(e,t){return this.text.substr(e,t)}},{key:`rightEncode`,value:function(e,t){return(0,r.default)(e,t)}},{key:`encodeGuarded`,value:function(){var e={fontSize:this.fontSize},t={height:this.guardHeight};return[{data:n.SIDE_BIN,options:t},{data:this.leftEncode(),text:this.leftText(),options:e},{data:n.MIDDLE_BIN,options:t},{data:this.rightEncode(),text:this.rightText(),options:e},{data:n.SIDE_BIN,options:t}]}},{key:`encodeFlat`,value:function(){return{data:[n.SIDE_BIN,this.leftEncode(),n.MIDDLE_BIN,this.rightEncode(),n.SIDE_BIN].join(``),text:this.text}}}]),i}(i.default)})),pt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=function e(t,n,r){t===null&&(t=Function.prototype);var i=Object.getOwnPropertyDescriptor(t,n);if(i===void 0){var a=Object.getPrototypeOf(t);return a===null?void 0:e(a,n,r)}if(`value`in i)return i.value;var o=i.get;return o===void 0?void 0:o.call(r)},r=Z(),i=a(ft());function a(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function s(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function c(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var l=function(e){return(10-e.substr(0,12).split(``).map(function(e){return+e}).reduce(function(e,t,n){return n%2?e+t*3:e+t},0)%10)%10};e.default=function(e){c(i,e);function i(e,t){o(this,i),e.search(/^[0-9]{12}$/)!==-1&&(e+=l(e));var n=s(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,e,t));return n.lastChar=t.lastChar,n}return t(i,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{13}$/)!==-1&&+this.data[12]===l(this.data)}},{key:`leftText`,value:function(){return n(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),`leftText`,this).call(this,1,6)}},{key:`leftEncode`,value:function(){var e=this.data.substr(1,6),t=r.EAN13_STRUCTURE[this.data[0]];return n(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),`leftEncode`,this).call(this,e,t)}},{key:`rightText`,value:function(){return n(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),`rightText`,this).call(this,7,6)}},{key:`rightEncode`,value:function(){var e=this.data.substr(7,6);return n(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),`rightEncode`,this).call(this,e,`RRRRRR`)}},{key:`encodeGuarded`,value:function(){var e=n(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),`encodeGuarded`,this).call(this);return this.options.displayValue&&(e.unshift({data:`000000000000`,text:this.text.substr(0,1),options:{textAlign:`left`,fontSize:this.fontSize}}),this.options.lastChar&&(e.push({data:`00`}),e.push({data:`00000`,text:this.options.lastChar,options:{fontSize:this.fontSize}}))),e}}]),i}(i.default)})),mt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=function e(t,n,r){t===null&&(t=Function.prototype);var i=Object.getOwnPropertyDescriptor(t,n);if(i===void 0){var a=Object.getPrototypeOf(t);return a===null?void 0:e(a,n,r)}if(`value`in i)return i.value;var o=i.get;return o===void 0?void 0:o.call(r)},r=i(ft());function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var c=function(e){return(10-e.substr(0,7).split(``).map(function(e){return+e}).reduce(function(e,t,n){return n%2?e+t:e+t*3},0)%10)%10};e.default=function(e){s(r,e);function r(e,t){return a(this,r),e.search(/^[0-9]{7}$/)!==-1&&(e+=c(e)),o(this,(r.__proto__||Object.getPrototypeOf(r)).call(this,e,t))}return t(r,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{8}$/)!==-1&&+this.data[7]===c(this.data)}},{key:`leftText`,value:function(){return n(r.prototype.__proto__||Object.getPrototypeOf(r.prototype),`leftText`,this).call(this,0,4)}},{key:`leftEncode`,value:function(){var e=this.data.substr(0,4);return n(r.prototype.__proto__||Object.getPrototypeOf(r.prototype),`leftEncode`,this).call(this,e,`LLLL`)}},{key:`rightText`,value:function(){return n(r.prototype.__proto__||Object.getPrototypeOf(r.prototype),`rightText`,this).call(this,4,4)}},{key:`rightEncode`,value:function(){var e=this.data.substr(4,4);return n(r.prototype.__proto__||Object.getPrototypeOf(r.prototype),`rightEncode`,this).call(this,e,`RRRR`)}}]),r}(r.default)})),ht=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=Z(),r=a(dt()),i=a(X());function a(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function s(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function c(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var l=function(e){return e.split(``).map(function(e){return+e}).reduce(function(e,t,n){return n%2?e+t*9:e+t*3},0)%10};e.default=function(e){c(i,e);function i(e,t){return o(this,i),s(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,e,t))}return t(i,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{5}$/)!==-1}},{key:`encode`,value:function(){var e=n.EAN5_STRUCTURE[l(this.data)];return{data:`1011`+(0,r.default)(this.data,e,`01`),text:this.text}}}]),i}(i.default)})),gt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=Z(),r=a(dt()),i=a(X());function a(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function s(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function c(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){c(i,e);function i(e,t){return o(this,i),s(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,e,t))}return t(i,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{2}$/)!==-1}},{key:`encode`,value:function(){var e=n.EAN2_STRUCTURE[parseInt(this.data)%4];return{data:`1011`+(0,r.default)(this.data,e,`01`),text:this.text}}}]),i}(i.default)})),_t=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();e.checksum=l;var n=i(dt()),r=i(X());function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var c=function(e){s(r,e);function r(e,t){a(this,r),e.search(/^[0-9]{11}$/)!==-1&&(e+=l(e));var n=o(this,(r.__proto__||Object.getPrototypeOf(r)).call(this,e,t));return n.displayValue=t.displayValue,n.fontSize=t.fontSize>t.width*10?t.width*10:t.fontSize,n.guardHeight=t.height+n.fontSize/2+t.textMargin,n}return t(r,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{12}$/)!==-1&&this.data[11]==l(this.data)}},{key:`encode`,value:function(){return this.options.flat?this.flatEncoding():this.guardedEncoding()}},{key:`flatEncoding`,value:function(){var e=``;return e+=`101`,e+=(0,n.default)(this.data.substr(0,6),`LLLLLL`),e+=`01010`,e+=(0,n.default)(this.data.substr(6,6),`RRRRRR`),e+=`101`,{data:e,text:this.text}}},{key:`guardedEncoding`,value:function(){var e=[];return this.displayValue&&e.push({data:`00000000`,text:this.text.substr(0,1),options:{textAlign:`left`,fontSize:this.fontSize}}),e.push({data:`101`+(0,n.default)(this.data[0],`L`),options:{height:this.guardHeight}}),e.push({data:(0,n.default)(this.data.substr(1,5),`LLLLL`),text:this.text.substr(1,5),options:{fontSize:this.fontSize}}),e.push({data:`01010`,options:{height:this.guardHeight}}),e.push({data:(0,n.default)(this.data.substr(6,5),`RRRRR`),text:this.text.substr(6,5),options:{fontSize:this.fontSize}}),e.push({data:(0,n.default)(this.data[11],`R`)+`101`,options:{height:this.guardHeight}}),this.displayValue&&e.push({data:`00000000`,text:this.text.substr(11,1),options:{textAlign:`right`,fontSize:this.fontSize}}),e}}]),r}(r.default);function l(e){var t=0,n;for(n=1;n<11;n+=2)t+=parseInt(e[n]);for(n=0;n<11;n+=2)t+=parseInt(e[n])*3;return(10-t%10)%10}e.default=c})),vt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=a(dt()),r=a(X()),i=_t();function a(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function s(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function c(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var l=[`XX00000XXX`,`XX10000XXX`,`XX20000XXX`,`XXX00000XX`,`XXXX00000X`,`XXXXX00005`,`XXXXX00006`,`XXXXX00007`,`XXXXX00008`,`XXXXX00009`],u=[[`EEEOOO`,`OOOEEE`],[`EEOEOO`,`OOEOEE`],[`EEOOEO`,`OOEEOE`],[`EEOOOE`,`OOEEEO`],[`EOEEOO`,`OEOOEE`],[`EOOEEO`,`OEEOOE`],[`EOOOEE`,`OEEEOO`],[`EOEOEO`,`OEOEOE`],[`EOEOOE`,`OEOEEO`],[`EOOEOE`,`OEEOEO`]],d=function(e){c(r,e);function r(e,t){o(this,r);var n=s(this,(r.__proto__||Object.getPrototypeOf(r)).call(this,e,t));if(n.isValid=!1,e.search(/^[0-9]{6}$/)!==-1)n.middleDigits=e,n.upcA=f(e,`0`),n.text=t.text||``+n.upcA[0]+e+n.upcA[n.upcA.length-1],n.isValid=!0;else if(e.search(/^[01][0-9]{7}$/)!==-1){if(n.middleDigits=e.substring(1,e.length-1),n.upcA=f(n.middleDigits,e[0]),n.upcA[n.upcA.length-1]===e[e.length-1])n.isValid=!0;else return s(n)}else return s(n);return n.displayValue=t.displayValue,n.fontSize=t.fontSize>t.width*10?t.width*10:t.fontSize,n.guardHeight=t.height+n.fontSize/2+t.textMargin,n}return t(r,[{key:`valid`,value:function(){return this.isValid}},{key:`encode`,value:function(){return this.options.flat?this.flatEncoding():this.guardedEncoding()}},{key:`flatEncoding`,value:function(){var e=``;return e+=`101`,e+=this.encodeMiddleDigits(),e+=`010101`,{data:e,text:this.text}}},{key:`guardedEncoding`,value:function(){var e=[];return this.displayValue&&e.push({data:`00000000`,text:this.text[0],options:{textAlign:`left`,fontSize:this.fontSize}}),e.push({data:`101`,options:{height:this.guardHeight}}),e.push({data:this.encodeMiddleDigits(),text:this.text.substring(1,7),options:{fontSize:this.fontSize}}),e.push({data:`010101`,options:{height:this.guardHeight}}),this.displayValue&&e.push({data:`00000000`,text:this.text[7],options:{textAlign:`right`,fontSize:this.fontSize}}),e}},{key:`encodeMiddleDigits`,value:function(){var e=this.upcA[0],t=this.upcA[this.upcA.length-1],r=u[parseInt(t)][parseInt(e)];return(0,n.default)(this.middleDigits,r)}}]),r}(r.default);function f(e,t){for(var n=l[parseInt(e[e.length-1])],r=``,a=0,o=0;o<n.length;o++){var s=n[o];r+=s===`X`?e[a++]:s}return r=``+t+r,``+r+(0,i.checksum)(r)}e.default=d})),yt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.UPCE=e.UPC=e.EAN2=e.EAN5=e.EAN8=e.EAN13=void 0;var t=s(pt()),n=s(mt()),r=s(ht()),i=s(gt()),a=s(_t()),o=s(vt());function s(e){return e&&e.__esModule?e:{default:e}}e.EAN13=t.default,e.EAN8=n.default,e.EAN5=r.default,e.EAN2=i.default,e.UPC=a.default,e.UPCE=o.default})),bt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.START_BIN=`1010`,e.END_BIN=`11101`,e.BINARIES=[`00110`,`10001`,`01001`,`11000`,`00101`,`10100`,`01100`,`00011`,`10010`,`01010`]})),xt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=bt(),r=i(X());function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(r,e);function r(){return a(this,r),o(this,(r.__proto__||Object.getPrototypeOf(r)).apply(this,arguments))}return t(r,[{key:`valid`,value:function(){return this.data.search(/^([0-9]{2})+$/)!==-1}},{key:`encode`,value:function(){var e=this,t=this.data.match(/.{2}/g).map(function(t){return e.encodePair(t)}).join(``);return{data:n.START_BIN+t+n.END_BIN,text:this.text}}},{key:`encodePair`,value:function(e){var t=n.BINARIES[e[1]];return n.BINARIES[e[0]].split(``).map(function(e,n){return(e===`1`?`111`:`1`)+(t[n]===`1`?`000`:`0`)}).join(``)}}]),r}(r.default)})),St=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(xt());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var s=function(e){var t=e.substr(0,13).split(``).map(function(e){return parseInt(e,10)}).reduce(function(e,t,n){return e+t*(3-n%2*2)},0);return Math.ceil(t/10)*10-t};e.default=function(e){o(n,e);function n(e,t){return i(this,n),e.search(/^[0-9]{13}$/)!==-1&&(e+=s(e)),a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t))}return t(n,[{key:`valid`,value:function(){return this.data.search(/^[0-9]{14}$/)!==-1&&+this.data[13]===s(this.data)}}]),n}(n.default)})),Q=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.ITF14=e.ITF=void 0;var t=r(xt()),n=r(St());function r(e){return e&&e.__esModule?e:{default:e}}e.ITF=t.default,e.ITF14=n.default})),Ct=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(X());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var s=function(e){o(n,e);function n(e,t){return i(this,n),a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t))}return t(n,[{key:`encode`,value:function(){for(var e=`110`,t=0;t<this.data.length;t++){var n=parseInt(this.data[t]).toString(2);n=c(n,4-n.length);for(var r=0;r<n.length;r++)e+=n[r]==`0`?`100`:`110`}return e+=`1001`,{data:e,text:this.text}}},{key:`valid`,value:function(){return this.data.search(/^[0-9]+$/)!==-1}}]),n}(n.default);function c(e,t){for(var n=0;n<t;n++)e=`0`+e;return e}e.default=s})),wt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.mod10=t,e.mod11=n;function t(e){for(var t=0,n=0;n<e.length;n++){var r=parseInt(e[n]);(n+e.length)%2==0?t+=r:t+=r*2%10+Math.floor(r*2/10)}return(10-t%10)%10}function n(e){for(var t=0,n=[2,3,4,5,6,7],r=0;r<e.length;r++){var i=parseInt(e[e.length-1-r]);t+=n[r%n.length]*i}return(11-t%11)%11}})),Tt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(Ct()),n=wt();function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(t,e);function t(e,r){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e+(0,n.mod10)(e),r))}return t}(t.default)})),Et=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(Ct()),n=wt();function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(t,e);function t(e,r){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e+(0,n.mod11)(e),r))}return t}(t.default)})),Dt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(Ct()),n=wt();function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(t,e);function t(e,r){return i(this,t),e+=(0,n.mod10)(e),e+=(0,n.mod10)(e),a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,r))}return t}(t.default)})),Ot=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(Ct()),n=wt();function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(t,e);function t(e,r){return i(this,t),e+=(0,n.mod11)(e),e+=(0,n.mod10)(e),a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,r))}return t}(t.default)})),kt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.MSI1110=e.MSI1010=e.MSI11=e.MSI10=e.MSI=void 0;var t=o(Ct()),n=o(Tt()),r=o(Et()),i=o(Dt()),a=o(Ot());function o(e){return e&&e.__esModule?e:{default:e}}e.MSI=t.default,e.MSI10=n.default,e.MSI11=r.default,e.MSI1010=i.default,e.MSI1110=a.default})),At=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.pharmacode=void 0;var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(X());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.pharmacode=function(e){o(n,e);function n(e,t){i(this,n);var r=a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t));return r.number=parseInt(e,10),r}return t(n,[{key:`encode`,value:function(){for(var e=this.number,t=``;!isNaN(e)&&e!=0;)e%2==0?(t=`11100`+t,e=(e-2)/2):(t=`100`+t,e=(e-1)/2);return t=t.slice(0,-2),{data:t,text:this.text}}},{key:`valid`,value:function(){return this.number>=3&&this.number<=131070}}]),n}(n.default)})),jt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.codabar=void 0;var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(X());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.codabar=function(e){o(n,e);function n(e,t){i(this,n),e.search(/^[0-9\-\$\:\.\+\/]+$/)===0&&(e=`A`+e+`A`);var r=a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e.toUpperCase(),t));return r.text=r.options.text||r.text.replace(/[A-D]/g,``),r}return t(n,[{key:`valid`,value:function(){return this.data.search(/^[A-D][0-9\-\$\:\.\+\/]+[A-D]$/)!==-1}},{key:`encode`,value:function(){for(var e=[],t=this.getEncodings(),n=0;n<this.data.length;n++)e.push(t[this.data.charAt(n)]),n!==this.data.length-1&&e.push(`0`);return{text:this.text,data:e.join(``)}}},{key:`getEncodings`,value:function(){return{0:`101010011`,1:`101011001`,2:`101001011`,3:`110010101`,4:`101101001`,5:`110101001`,6:`100101011`,7:`100101101`,8:`100110101`,9:`110100101`,"-":`101001101`,$:`101100101`,":":`1101011011`,"/":`1101101011`,".":`1101101101`,"+":`1011011011`,A:`1011001001`,B:`1001001011`,C:`1010010011`,D:`1010011001`}}}]),n}(n.default)})),Mt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.SYMBOLS=`0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,-,., ,$,/,+,%,($),(%),(/),(+),ÿ`.split(`,`),e.BINARIES=`100010100.101001000.101000100.101000010.100101000.100100100.100100010.101010000.100010010.100001010.110101000.110100100.110100010.110010100.110010010.110001010.101101000.101100100.101100010.100110100.100011010.101011000.101001100.101000110.100101100.100010110.110110100.110110010.110101100.110100110.110010110.110011010.101101100.101100110.100110110.100111010.100101110.111010100.111010010.111001010.101101110.101110110.110101110.100100110.111011010.111010110.100110010.101011110`.split(`.`),e.MULTI_SYMBOLS={"\0":[`(%)`,`U`],"":[`($)`,`A`],"":[`($)`,`B`],"":[`($)`,`C`],"":[`($)`,`D`],"":[`($)`,`E`],"":[`($)`,`F`],"\x07":[`($)`,`G`],"\b":[`($)`,`H`],"	":[`($)`,`I`],"\n":[`($)`,`J`],"\v":[`($)`,`K`],"\f":[`($)`,`L`],"\r":[`($)`,`M`],"":[`($)`,`N`],"":[`($)`,`O`],"":[`($)`,`P`],"":[`($)`,`Q`],"":[`($)`,`R`],"":[`($)`,`S`],"":[`($)`,`T`],"":[`($)`,`U`],"":[`($)`,`V`],"":[`($)`,`W`],"":[`($)`,`X`],"":[`($)`,`Y`],"":[`($)`,`Z`],"\x1B":[`(%)`,`A`],"":[`(%)`,`B`],"":[`(%)`,`C`],"":[`(%)`,`D`],"":[`(%)`,`E`],"!":[`(/)`,`A`],'"':[`(/)`,`B`],"#":[`(/)`,`C`],"&":[`(/)`,`F`],"'":[`(/)`,`G`],"(":[`(/)`,`H`],")":[`(/)`,`I`],"*":[`(/)`,`J`],",":[`(/)`,`L`],":":[`(/)`,`Z`],";":[`(%)`,`F`],"<":[`(%)`,`G`],"=":[`(%)`,`H`],">":[`(%)`,`I`],"?":[`(%)`,`J`],"@":[`(%)`,`V`],"[":[`(%)`,`K`],"\\":[`(%)`,`L`],"]":[`(%)`,`M`],"^":[`(%)`,`N`],_:[`(%)`,`O`],"`":[`(%)`,`W`],a:[`(+)`,`A`],b:[`(+)`,`B`],c:[`(+)`,`C`],d:[`(+)`,`D`],e:[`(+)`,`E`],f:[`(+)`,`F`],g:[`(+)`,`G`],h:[`(+)`,`H`],i:[`(+)`,`I`],j:[`(+)`,`J`],k:[`(+)`,`K`],l:[`(+)`,`L`],m:[`(+)`,`M`],n:[`(+)`,`N`],o:[`(+)`,`O`],p:[`(+)`,`P`],q:[`(+)`,`Q`],r:[`(+)`,`R`],s:[`(+)`,`S`],t:[`(+)`,`T`],u:[`(+)`,`U`],v:[`(+)`,`V`],w:[`(+)`,`W`],x:[`(+)`,`X`],y:[`(+)`,`Y`],z:[`(+)`,`Z`],"{":[`(%)`,`P`],"|":[`(%)`,`Q`],"}":[`(%)`,`R`],"~":[`(%)`,`S`],"":[`(%)`,`T`]}})),Nt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=Mt(),r=i(X());function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function o(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function s(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){s(r,e);function r(e,t){return a(this,r),o(this,(r.__proto__||Object.getPrototypeOf(r)).call(this,e,t))}return t(r,[{key:`valid`,value:function(){return/^[0-9A-Z\-. $/+%]+$/.test(this.data)}},{key:`encode`,value:function(){var e=this.data.split(``).flatMap(function(e){return n.MULTI_SYMBOLS[e]||e}),t=e.map(function(e){return r.getEncoding(e)}).join(``),i=r.checksum(e,20),a=r.checksum(e.concat(i),15);return{text:this.text,data:r.getEncoding(`ÿ`)+t+r.getEncoding(i)+r.getEncoding(a)+r.getEncoding(`ÿ`)+`1`}}}],[{key:`getEncoding`,value:function(e){return n.BINARIES[r.symbolValue(e)]}},{key:`getSymbol`,value:function(e){return n.SYMBOLS[e]}},{key:`symbolValue`,value:function(e){return n.SYMBOLS.indexOf(e)}},{key:`checksum`,value:function(e,t){var n=e.slice().reverse().reduce(function(e,n,i){var a=i%t+1;return e+r.symbolValue(n)*a},0);return r.getSymbol(n%47)}}]),r}(r.default)})),Pt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(Nt());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.default=function(e){o(n,e);function n(e,t){return i(this,n),a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t))}return t(n,[{key:`valid`,value:function(){return/^[\x00-\x7f]+$/.test(this.data)}}]),n}(n.default)})),Ft=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.CODE93FullASCII=e.CODE93=void 0;var t=r(Nt()),n=r(Pt());function r(e){return e&&e.__esModule?e:{default:e}}e.CODE93=t.default,e.CODE93FullASCII=n.default})),It=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.GenericBarcode=void 0;var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=r(X());function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function a(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function o(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}e.GenericBarcode=function(e){o(n,e);function n(e,t){return i(this,n),a(this,(n.__proto__||Object.getPrototypeOf(n)).call(this,e,t))}return t(n,[{key:`encode`,value:function(){return{data:`10101010101010101010101010101010101010101`,text:this.text}}},{key:`valid`,value:function(){return!0}}]),n}(n.default)})),Lt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=nt(),n=ut(),r=yt(),i=Q(),a=kt(),o=At(),s=jt(),c=Ft(),l=It();e.default={CODE39:t.CODE39,CODE128:n.CODE128,CODE128A:n.CODE128A,CODE128B:n.CODE128B,CODE128C:n.CODE128C,EAN13:r.EAN13,EAN8:r.EAN8,EAN5:r.EAN5,EAN2:r.EAN2,UPC:r.UPC,UPCE:r.UPCE,ITF14:i.ITF14,ITF:i.ITF,MSI:a.MSI,MSI10:a.MSI10,MSI11:a.MSI11,MSI1010:a.MSI1010,MSI1110:a.MSI1110,pharmacode:o.pharmacode,codabar:s.codabar,CODE93:c.CODE93,CODE93FullASCII:c.CODE93FullASCII,GenericBarcode:l.GenericBarcode}})),Rt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e};e.default=function(e,n){return t({},e,n)}})),zt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=t;function t(e){var t=[];function n(e){if(Array.isArray(e))for(var r=0;r<e.length;r++)n(e[r]);else e.text=e.text||``,e.data=e.data||``,t.push(e)}return n(e),t}})),Bt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=t;function t(e){return e.marginTop=e.marginTop||e.margin,e.marginBottom=e.marginBottom||e.margin,e.marginRight=e.marginRight||e.margin,e.marginLeft=e.marginLeft||e.margin,e}})),Vt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=t;function t(e){var t=[`width`,`height`,`textMargin`,`fontSize`,`margin`,`marginTop`,`marginBottom`,`marginLeft`,`marginRight`];for(var n in t)t.hasOwnProperty(n)&&(n=t[n],typeof e[n]==`string`&&(e[n]=parseInt(e[n],10)));return typeof e.displayValue==`string`&&(e.displayValue=e.displayValue!=`false`),e}})),Ht=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default={width:2,height:100,format:`auto`,displayValue:!0,fontOptions:``,font:`monospace`,text:void 0,textAlign:`center`,textPosition:`bottom`,textMargin:2,fontSize:20,background:`#ffffff`,lineColor:`#000000`,margin:10,marginTop:void 0,marginBottom:void 0,marginLeft:void 0,marginRight:void 0,valid:function(){}}})),Ut=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=r(Vt()),n=r(Ht());function r(e){return e&&e.__esModule?e:{default:e}}function i(e){var r={};for(var i in n.default)n.default.hasOwnProperty(i)&&(e.hasAttribute(`jsbarcode-`+i.toLowerCase())&&(r[i]=e.getAttribute(`jsbarcode-`+i.toLowerCase())),e.hasAttribute(`data-`+i.toLowerCase())&&(r[i]=e.getAttribute(`data-`+i.toLowerCase())));return r.value=e.getAttribute(`jsbarcode-value`)||e.getAttribute(`data-value`),r=(0,t.default)(r),r}e.default=i})),Wt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.getTotalWidthOfEncodings=e.calculateEncodingAttributes=e.getBarcodePadding=e.getEncodingHeight=e.getMaximumHeightOfEncodings=void 0;var t=n(Rt());function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){return t.height+(t.displayValue&&e.text.length>0?t.fontSize+t.textMargin:0)+t.marginTop+t.marginBottom}function i(e,t,n){if(n.displayValue&&t<e){if(n.textAlign==`center`)return Math.floor((e-t)/2);if(n.textAlign==`left`)return 0;if(n.textAlign==`right`)return Math.floor(e-t)}return 0}function a(e,n,a){for(var o=0;o<e.length;o++){var s=e[o],l=(0,t.default)(n,s.options),u=l.displayValue?c(s.text,l,a):0,d=s.data.length*l.width;s.width=Math.ceil(Math.max(u,d)),s.height=r(s,l),s.barcodePadding=i(u,d,l)}}function o(e){for(var t=0,n=0;n<e.length;n++)t+=e[n].width;return t}function s(e){for(var t=0,n=0;n<e.length;n++)e[n].height>t&&(t=e[n].height);return t}function c(e,t,n){var r;if(n)r=n;else if(typeof document<`u`)r=document.createElement(`canvas`).getContext(`2d`);else return 0;r.font=t.fontOptions+` `+t.fontSize+`px `+t.font;var i=r.measureText(e);return i?i.width:0}e.getMaximumHeightOfEncodings=s,e.getEncodingHeight=r,e.getBarcodePadding=i,e.calculateEncodingAttributes=a,e.getTotalWidthOfEncodings=o})),Gt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(Rt()),r=Wt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}e.default=function(){function e(t,n,r){a(this,e),this.canvas=t,this.encodings=n,this.options=r}return t(e,[{key:`render`,value:function(){if(!this.canvas.getContext)throw Error(`The browser does not support canvas.`);this.prepareCanvas();for(var e=0;e<this.encodings.length;e++){var t=(0,n.default)(this.options,this.encodings[e].options);this.drawCanvasBarcode(t,this.encodings[e]),this.drawCanvasText(t,this.encodings[e]),this.moveCanvasDrawing(this.encodings[e])}this.restoreCanvas()}},{key:`prepareCanvas`,value:function(){var e=this.canvas.getContext(`2d`);e.save(),(0,r.calculateEncodingAttributes)(this.encodings,this.options,e);var t=(0,r.getTotalWidthOfEncodings)(this.encodings),n=(0,r.getMaximumHeightOfEncodings)(this.encodings);this.canvas.width=t+this.options.marginLeft+this.options.marginRight,this.canvas.height=n,e.clearRect(0,0,this.canvas.width,this.canvas.height),this.options.background&&(e.fillStyle=this.options.background,e.fillRect(0,0,this.canvas.width,this.canvas.height)),e.translate(this.options.marginLeft,0)}},{key:`drawCanvasBarcode`,value:function(e,t){var n=this.canvas.getContext(`2d`),r=t.data,i=e.textPosition==`top`?e.marginTop+e.fontSize+e.textMargin:e.marginTop;n.fillStyle=e.lineColor;for(var a=0;a<r.length;a++){var o=a*e.width+t.barcodePadding;r[a]===`1`?n.fillRect(o,i,e.width,e.height):r[a]&&n.fillRect(o,i,e.width,e.height*r[a])}}},{key:`drawCanvasText`,value:function(e,t){var n=this.canvas.getContext(`2d`),r=e.fontOptions+` `+e.fontSize+`px `+e.font;if(e.displayValue){var i,a=e.textPosition==`top`?e.marginTop+e.fontSize-e.textMargin:e.height+e.textMargin+e.marginTop+e.fontSize;n.font=r,e.textAlign==`left`||t.barcodePadding>0?(i=0,n.textAlign=`left`):e.textAlign==`right`?(i=t.width-1,n.textAlign=`right`):(i=t.width/2,n.textAlign=`center`),n.fillText(t.text,i,a)}}},{key:`moveCanvasDrawing`,value:function(e){this.canvas.getContext(`2d`).translate(e.width,0)}},{key:`restoreCanvas`,value:function(){this.canvas.getContext(`2d`).restore()}}]),e}()})),Kt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),n=i(Rt()),r=Wt();function i(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}var o=`http://www.w3.org/2000/svg`;e.default=function(){function e(t,n,r){a(this,e),this.svg=t,this.encodings=n,this.options=r,this.document=r.xmlDocument||document}return t(e,[{key:`render`,value:function(){var e=this.options.marginLeft;this.prepareSVG();for(var t=0;t<this.encodings.length;t++){var r=this.encodings[t],i=(0,n.default)(this.options,r.options),a=this.createGroup(e,i.marginTop,this.svg);this.setGroupOptions(a,i),this.drawSvgBarcode(a,i,r),this.drawSVGText(a,i,r),e+=r.width}}},{key:`prepareSVG`,value:function(){for(;this.svg.firstChild;)this.svg.removeChild(this.svg.firstChild);(0,r.calculateEncodingAttributes)(this.encodings,this.options);var e=(0,r.getTotalWidthOfEncodings)(this.encodings),t=(0,r.getMaximumHeightOfEncodings)(this.encodings),n=e+this.options.marginLeft+this.options.marginRight;this.setSvgAttributes(n,t),this.options.background&&this.drawRect(0,0,n,t,this.svg).setAttribute(`fill`,this.options.background)}},{key:`drawSvgBarcode`,value:function(e,t,n){for(var r=n.data,i=t.textPosition==`top`?t.fontSize+t.textMargin:0,a=0,o=0,s=0;s<r.length;s++)o=s*t.width+n.barcodePadding,r[s]===`1`?a++:a>0&&(this.drawRect(o-t.width*a,i,t.width*a,t.height,e),a=0);a>0&&this.drawRect(o-t.width*(a-1),i,t.width*a,t.height,e)}},{key:`drawSVGText`,value:function(e,t,n){var r=this.document.createElementNS(o,`text`);if(t.displayValue){var i,a;r.setAttribute(`font-family`,t.font),r.setAttribute(`font-size`,t.fontSize),t.fontOptions.includes(`bold`)&&r.setAttribute(`font-weight`,`bold`),t.fontOptions.includes(`italic`)&&r.setAttribute(`font-style`,`italic`),a=t.textPosition==`top`?t.fontSize-t.textMargin:t.height+t.textMargin+t.fontSize,t.textAlign==`left`||n.barcodePadding>0?(i=0,r.setAttribute(`text-anchor`,`start`)):t.textAlign==`right`?(i=n.width-1,r.setAttribute(`text-anchor`,`end`)):(i=n.width/2,r.setAttribute(`text-anchor`,`middle`)),r.setAttribute(`x`,i),r.setAttribute(`y`,a),r.appendChild(this.document.createTextNode(n.text)),e.appendChild(r)}}},{key:`setSvgAttributes`,value:function(e,t){var n=this.svg;n.setAttribute(`width`,e+`px`),n.setAttribute(`height`,t+`px`),n.setAttribute(`x`,`0px`),n.setAttribute(`y`,`0px`),n.setAttribute(`viewBox`,`0 0 `+e+` `+t),n.setAttribute(`xmlns`,o),n.setAttribute(`version`,`1.1`)}},{key:`createGroup`,value:function(e,t,n){var r=this.document.createElementNS(o,`g`);return r.setAttribute(`transform`,`translate(`+e+`, `+t+`)`),n.appendChild(r),r}},{key:`setGroupOptions`,value:function(e,t){e.setAttribute(`fill`,t.lineColor)}},{key:`drawRect`,value:function(e,t,n,r,i){var a=this.document.createElementNS(o,`rect`);return a.setAttribute(`x`,e),a.setAttribute(`y`,t),a.setAttribute(`width`,n),a.setAttribute(`height`,r),i.appendChild(a),a}}]),e}()})),qt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();function n(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}e.default=function(){function e(t,r,i){n(this,e),this.object=t,this.encodings=r,this.options=i}return t(e,[{key:`render`,value:function(){this.object.encodings=this.encodings}}]),e}()})),Jt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=i(Gt()),n=i(Kt()),r=i(qt());function i(e){return e&&e.__esModule?e:{default:e}}e.default={CanvasRenderer:t.default,SVGRenderer:n.default,ObjectRenderer:r.default}})),Yt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});function t(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function n(e,t){if(!e)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return t&&(typeof t==`object`||typeof t==`function`)?t:e}function r(e,t){if(typeof t!=`function`&&t!==null)throw TypeError(`Super expression must either be null or a function, not `+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var i=function(e){r(i,e);function i(e,r){t(this,i);var a=n(this,(i.__proto__||Object.getPrototypeOf(i)).call(this));return a.name=`InvalidInputException`,a.symbology=e,a.input=r,a.message=`"`+a.input+`" is not a valid input for `+a.symbology,a}return i}(Error),a=function(e){r(i,e);function i(){t(this,i);var e=n(this,(i.__proto__||Object.getPrototypeOf(i)).call(this));return e.name=`InvalidElementException`,e.message=`Not supported type to render on`,e}return i}(Error),o=function(e){r(i,e);function i(){t(this,i);var e=n(this,(i.__proto__||Object.getPrototypeOf(i)).call(this));return e.name=`NoElementException`,e.message=`No element to render on.`,e}return i}(Error);e.InvalidInputException=i,e.InvalidElementException=a,e.NoElementException=o})),Xt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},n=a(Ut()),r=a(Jt()),i=Yt();function a(e){return e&&e.__esModule?e:{default:e}}function o(e){if(typeof e==`string`)return s(e);if(Array.isArray(e)){for(var a=[],l=0;l<e.length;l++)a.push(o(e[l]));return a}if(typeof HTMLCanvasElement<`u`&&e instanceof HTMLImageElement)return c(e);if(e&&e.nodeName&&e.nodeName.toLowerCase()===`svg`||typeof SVGElement<`u`&&e instanceof SVGElement)return{element:e,options:(0,n.default)(e),renderer:r.default.SVGRenderer};if(typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement)return{element:e,options:(0,n.default)(e),renderer:r.default.CanvasRenderer};if(e&&e.getContext)return{element:e,renderer:r.default.CanvasRenderer};if(e&&(e===void 0?`undefined`:t(e))===`object`&&!e.nodeName)return{element:e,renderer:r.default.ObjectRenderer};throw new i.InvalidElementException}function s(e){var t=document.querySelectorAll(e);if(t.length!==0){for(var n=[],r=0;r<t.length;r++)n.push(o(t[r]));return n}}function c(e){var t=document.createElement(`canvas`);return{element:t,options:(0,n.default)(e),renderer:r.default.CanvasRenderer,afterRender:function(){e.setAttribute(`src`,t.toDataURL())}}}e.default=o})),Zt=t((e=>{Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();function n(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}e.default=function(){function e(t){n(this,e),this.api=t}return t(e,[{key:`handleCatch`,value:function(e){if(e.name===`InvalidInputException`){if(this.api._options.valid!==this.api._defaults.valid)this.api._options.valid(!1);else throw e.message}else throw e;this.api.render=function(){}}},{key:`wrapBarcodeCall`,value:function(e){try{var t=e.apply(void 0,arguments);return this.api._options.valid(!0),t}catch(e){return this.handleCatch(e),this.api}}}]),e}()})),Qt=e(t(((e,t)=>{var n=d(Lt()),r=d(Rt()),i=d(zt()),a=d(Bt()),o=d(Xt()),s=d(Vt()),c=d(Zt()),l=Yt(),u=d(Ht());function d(e){return e&&e.__esModule?e:{default:e}}var f=function(){},p=function(e,t,n){var r=new f;if(e===void 0)throw Error(`No element to render on was provided.`);return r._renderProperties=(0,o.default)(e),r._encodings=[],r._options=u.default,r._errorHandler=new c.default(r),t!==void 0&&(n||={},n.format||(n.format=_()),r.options(n)[n.format](t,n).render()),r};for(var m in p.getModule=function(e){return n.default[e]},n.default)n.default.hasOwnProperty(m)&&h(n.default,m);function h(e,t){f.prototype[t]=f.prototype[t.toUpperCase()]=f.prototype[t.toLowerCase()]=function(n,i){var a=this;return a._errorHandler.wrapBarcodeCall(function(){i.text=i.text===void 0?void 0:``+i.text;var o=(0,r.default)(a._options,i);o=(0,s.default)(o);var c=e[t],l=g(n,c,o);return a._encodings.push(l),a})}}function g(e,t,n){e=``+e;var a=new t(e,n);if(!a.valid())throw new l.InvalidInputException(a.constructor.name,e);var o=a.encode();o=(0,i.default)(o);for(var s=0;s<o.length;s++)o[s].options=(0,r.default)(n,o[s].options);return o}function _(){return n.default.CODE128?`CODE128`:Object.keys(n.default)[0]}f.prototype.options=function(e){return this._options=(0,r.default)(this._options,e),this},f.prototype.blank=function(e){var t=Array(e+1).join(`0`);return this._encodings.push({data:t}),this},f.prototype.init=function(){if(this._renderProperties){Array.isArray(this._renderProperties)||(this._renderProperties=[this._renderProperties]);var e;for(var t in this._renderProperties){e=this._renderProperties[t];var i=(0,r.default)(this._options,e.options);i.format==`auto`&&(i.format=_()),this._errorHandler.wrapBarcodeCall(function(){var t=i.value,r=n.default[i.format.toUpperCase()],a=g(t,r,i);v(e,a,i)})}}},f.prototype.render=function(){if(!this._renderProperties)throw new l.NoElementException;if(Array.isArray(this._renderProperties))for(var e=0;e<this._renderProperties.length;e++)v(this._renderProperties[e],this._encodings,this._options);else v(this._renderProperties,this._encodings,this._options);return this},f.prototype._defaults=u.default;function v(e,t,n){t=(0,i.default)(t);for(var o=0;o<t.length;o++)t[o].options=(0,r.default)(n,t[o].options),(0,a.default)(t[o].options);(0,a.default)(n);var s=e.renderer;new s(e.element,t,n).render(),e.afterRender&&e.afterRender()}typeof window<`u`&&(window.JsBarcode=p),typeof jQuery<`u`&&(jQuery.fn.JsBarcode=function(e,t){var n=[];return jQuery(this).each(function(){n.push(this)}),p(n,e,t)}),t.exports=p}))(),1),$t=null;function en(){$t?.dispose()}function tn(e){if($t!=null){$t.img.src=e;return}let t=document.createElement(`div`);t.className=`image-lightbox`,t.setAttribute(`role`,`dialog`),t.setAttribute(`aria-modal`,`true`);let n=document.createElement(`img`);n.src=e,n.alt=``,n.draggable=!1,n.addEventListener(`click`,e=>e.stopPropagation()),t.appendChild(n);let r=document.body.style.overflow;document.body.style.overflow=`hidden`;let i=e=>{e.key===`Escape`&&en()};t.addEventListener(`click`,()=>en()),window.addEventListener(`keydown`,i),document.body.appendChild(t),$t={img:n,dispose:()=>{window.removeEventListener(`keydown`,i),document.body.style.overflow=r,t.parentNode!=null&&t.parentNode.removeChild(t),$t=null}}}var $=h(),nn={compact:32,medium:40,loose:52},rn=200,an=44,on=80,sn=600,cn=24,ln=240,un=40,dn=[73,88,140,170,180,200],fn=[23,24,32,40],pn=new Set([`multiSelect`,`multiLineText`,`user`,`group`,`attachment`,`image`,`media`,`signature`,`link`]),mn=new Set([`multiSelect`,`rating`,`progress`]),hn={},gn={count:`计数`,filled:`已填写`,empty:`未填写`,distinct:`去重计数`,sum:`求和`,avg:`平均值`,max:`最大值`,min:`最小值`},_n=[`count`,`filled`,`empty`,`distinct`,`sum`,`avg`,`max`,`min`],vn=[`sum`,`avg`,`max`,`min`],yn=new Set([`number`,`currency`,`rating`,`progress`]);function bn(e){return e==null?[]:String(e).split(`,`).map(e=>e.trim()).filter(Boolean)}function xn(e,t){return e.options?.find(e=>e.id===t)}function Sn(e){return/^(https?:|mailto:|tel:|ftp:)/i.test(e)?e:`https://${e}`}function Cn(e){return e!=null&&typeof e==`string`&&e.startsWith(`#`)&&e.endsWith(`!`)||e===`#NAME?`||e===`#ERROR`}function wn({value:e}){let t=(0,P.useRef)(null),[n,r]=(0,P.useState)(!1);return(0,P.useEffect)(()=>{if(t.current!=null&&e.length!==0)try{(0,Qt.default)(t.current,e,{format:`CODE128`,width:1.4,height:26,fontSize:11,margin:1,displayValue:!0}),r(!1)}catch{r(!0)}},[e]),n?(0,$.jsx)(`span`,{className:`dtgrid__barcodetext`,children:e}):(0,$.jsx)(`svg`,{ref:t,className:`dtgrid__barcode`})}function Tn({count:e,max:t,onChange:n}){return(0,$.jsx)(`span`,{className:`dtgrid__stars${n==null?``:` dtgrid__stars--edit`}`,children:Array.from({length:t},(t,r)=>(0,$.jsx)(`span`,{className:`dtgrid__star${r<e?` dtgrid__star--on`:``}`,onClick:n==null?void 0:t=>{t.stopPropagation(),n(r+1===e?0:r+1)},children:`★`},r))})}function En({className:e,sig:t,title:n,children:r}){let i=(0,P.useRef)(null),[a,o]=(0,P.useState)(!1);return(0,P.useLayoutEffect)(()=>{let e=i.current;if(e==null)return;let t=()=>{let t=e.scrollWidth-e.clientWidth>1;o(e=>e===t?e:t)};if(t(),typeof ResizeObserver>`u`)return;let n=new ResizeObserver(t);return n.observe(e),()=>n.disconnect()},[t]),(0,$.jsxs)(`span`,{className:`dtgrid__ovf${a?` dtgrid__ovf--more`:``}`,title:n,children:[(0,$.jsx)(`span`,{ref:i,className:e,children:r}),a?(0,$.jsx)(`span`,{className:`dtgrid__ovf-more`,"aria-hidden":`true`,children:`…`}):null]})}function Dn({names:e}){return e.length===0?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(En,{className:`dtgrid__pills dtgrid__pills--people`,sig:e.toString(),title:e.join(`、`),children:e.map((e,t)=>(0,$.jsxs)(`span`,{className:`dtgrid__user`,children:[(0,$.jsx)(`span`,{className:`dtgrid__avatar`,children:e.slice(0,1)}),(0,$.jsx)(`span`,{className:`dtgrid__username`,children:e})]},`${e}-${t}`))})}var On=/\.(mp3|wav|aac|flac|ogg|m4a|opus|wma)$/i,kn=/\.(mp4|mov|webm|mkv|avi|m4v|ogv|ts|flv|wmv)$/i;function An(e){return On.test(e)}function jn(e){return kn.test(e)}function Mn(e){return An(e)?`🎵`:jn(e)?`🎬`:`📎`}function Nn({schema:e,value:t}){let n=t==null||String(t).length===0;switch(e.type){case`checkbox`:{let e=t!=null&&(t===!0||String(t)===`1`||String(t)===`true`);return(0,$.jsx)(`span`,{className:`dtgrid__cbx${e?` dtgrid__cbx--on`:``}`,children:e?`✓`:``})}case`select`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let r=xn(e,String(t));return(0,$.jsx)(`span`,{className:`dtgrid__pill`,style:{background:r?.color??`#8c8c8c`},children:r?.name??String(t)})}case`multiSelect`:{let n=bn(t);if(n.length===0)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let r=n.map(t=>xn(e,t)?.name??t);return(0,$.jsx)(En,{className:`dtgrid__pills`,sig:n.toString(),title:r.toString(),children:n.map((t,n)=>(0,$.jsx)(`span`,{className:`dtgrid__pill`,style:{background:xn(e,t)?.color??`#8c8c8c`},children:r[n]},t))})}case`user`:return(0,$.jsx)(Dn,{names:N(t)});case`group`:return(0,$.jsx)(Dn,{names:N(t)});case`createdBy`:case`modifiedBy`:return(0,$.jsx)(Dn,{names:n?[]:[String(t)]});case`date`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__date`,children:String(t)});case`progress`:{let r=e.max??100,i=n?0:Number(t)||0,a=Math.max(0,Math.min(100,i/r*100));return(0,$.jsxs)(`span`,{className:`dtgrid__prog`,children:[(0,$.jsx)(`span`,{className:`dtgrid__prog-track`,children:(0,$.jsx)(`span`,{className:`dtgrid__prog-fill`,style:{width:`${a}%`}})}),(0,$.jsx)(`span`,{className:`dtgrid__prog-num`,children:i})]})}case`multiLineText`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__multiline`,title:String(t),children:String(t)});case`number`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__num`,children:String(t)});case`currency`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__num`,children:O(t,e.currency??`¥`,e.decimals??2)});case`rating`:return(0,$.jsx)(Tn,{count:n?0:Number(t)||0,max:e.max??5});case`url`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let e=String(t);return(0,$.jsxs)(`a`,{className:`dtgrid__anchor`,href:Sn(e),target:`_blank`,rel:`noreferrer`,onClick:e=>e.stopPropagation(),title:e,children:[`🔗 `,e]})}case`phone`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let e=String(t);return(0,$.jsxs)(`a`,{className:`dtgrid__anchor`,href:`tel:${e}`,onClick:e=>e.stopPropagation(),title:e,children:[`📞 `,e]})}case`email`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let e=String(t);return(0,$.jsxs)(`a`,{className:`dtgrid__anchor`,href:`mailto:${e}`,onClick:e=>e.stopPropagation(),title:e,children:[`✉️ `,e]})}case`location`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let e=String(t);return(0,$.jsxs)(`span`,{className:`dtgrid__loc`,children:[(0,$.jsxs)(`span`,{title:e,children:[`📍 `,e]}),(0,$.jsx)(`a`,{className:`dtgrid__loclink`,href:`https://uri.amap.com/search?keyword=${encodeURIComponent(e)}`,target:`_blank`,rel:`noreferrer`,onClick:e=>e.stopPropagation(),children:`地图`})]})}case`attachment`:{let e=M(t);return e.length===0?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__files`,children:e.map((e,t)=>e.url.length>0?(0,$.jsxs)(`a`,{className:`dtgrid__file`,href:e.url,target:`_blank`,rel:`noreferrer`,onClick:e=>e.stopPropagation(),title:`${e.name}${e.size==null?``:` · ${A(e.size)}`}`,children:[`📎 `,e.name]},`${e.url}-${t}`):(0,$.jsxs)(`span`,{className:`dtgrid__file`,title:e.name,children:[`📎 `,e.name]},`${e.name}-${t}`))})}case`image`:{let e=M(t);return e.length===0?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__imgs`,children:e.map((e,t)=>e.url.length>0?(0,$.jsx)(`img`,{className:`dtgrid__img`,src:e.url,alt:e.name,title:e.name,onClick:t=>{t.stopPropagation(),tn(e.url)}},`${e.url}-${t}`):(0,$.jsxs)(`span`,{className:`dtgrid__file`,title:e.name,children:[`🖼 `,e.name]},`${e.name}-${t}`))})}case`media`:{let e=M(t);return e.length===0?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__files`,children:e.map((e,t)=>{let n=`${e.url||e.name}-${t}`;return e.url.length===0?(0,$.jsxs)(`span`,{className:`dtgrid__file`,title:e.name,children:[Mn(e.name),` `,e.name]},n):jn(e.name)?(0,$.jsx)(`video`,{className:`dtgrid__media`,src:e.url,controls:!0,preload:`metadata`,onClick:e=>e.stopPropagation()},n):An(e.name)?(0,$.jsx)(`audio`,{className:`dtgrid__audio`,src:e.url,controls:!0,preload:`metadata`,onClick:e=>e.stopPropagation()},n):(0,$.jsxs)(`a`,{className:`dtgrid__file`,href:e.url,target:`_blank`,rel:`noreferrer`,onClick:e=>e.stopPropagation(),title:e.name,children:[Mn(e.name),` `,e.name]},n)})})}case`signature`:{if(n)return(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`});let e=String(t);return(0,$.jsx)(`img`,{className:`dtgrid__sig`,src:e,alt:`签字`,onClick:t=>{t.stopPropagation(),tn(e)}})}case`barcode`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(wn,{value:String(t)});case`link`:{let e=me(t);return e==null?n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__text`,title:String(t),children:String(t)}):(0,$.jsxs)(`a`,{className:`dtgrid__anchor dtgrid__anchor--record`,href:f(`/doc/${e.s}`),target:`_blank`,rel:`noreferrer`,onClick:e=>e.stopPropagation(),title:`打开关联记录：${e.t}`,children:[`⛓ `,e.t||`记录 ${e.r}`]})}case`formula`:case`lookup`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):Cn(t)?(0,$.jsx)(`span`,{className:`dtgrid__fxerr`,children:String(t)}):(0,$.jsx)(`span`,{className:`dtgrid__num`,children:String(t)});case`autoNumber`:case`createdTime`:case`modifiedTime`:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__date`,children:String(t)});case`button`:return(0,$.jsx)(`span`,{className:`dtgrid__cellbtn`,"data-button-col":`1`,children:e.buttonAction?.label?.trim()||`点击`});default:return n?(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`—`}):(0,$.jsx)(`span`,{className:`dtgrid__text`,title:String(t),children:String(t)})}}function Pn({value:e,pageId:t,kind:n=`attachment`,onCommit:r,onClose:i}){let a=(0,P.useRef)(null),o=(0,P.useRef)(null),[s,c]=(0,P.useState)(!1),l=(0,P.useRef)(M(e)),u=n===`image`?`image/*`:n===`media`?`video/*,audio/*`:void 0,d=e=>n===`image`?`🖼`:n===`media`?Mn(e):`📎`,f=n===`image`?`＋ 上传图片`:n===`media`?`＋ 上传媒体`:`＋ 上传文件`;(0,P.useEffect)(()=>{let e=e=>{a.current?.contains(e.target)!==!0&&i()};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[i]);let p=e=>{l.current=e,r(e.length===0?``:E(e))},h=async e=>{if(e!=null&&e.length!==0){c(!0);try{let n=[];for(let r of Array.from(e)){let e=await m(r,`page`,t);n.push({url:e.url,name:e.fileName,size:e.size})}p([...l.current,...n])}catch(e){console.warn(`[datatable] 附件上传失败`,e)}finally{c(!1),o.current!=null&&(o.current.value=``)}}};return(0,$.jsxs)(`div`,{ref:a,className:`dtgrid__editor dtgrid__editor--pop dtgrid__attach`,children:[l.current.map((e,t)=>(0,$.jsxs)(`div`,{className:`dtgrid__attachrow`,children:[(0,$.jsxs)(`span`,{className:`dtgrid__attachname`,title:e.name,children:[d(e.name),` `,e.name,e.size==null?``:` · ${A(e.size)}`]}),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__attachdel`,onClick:()=>p(l.current.filter((e,n)=>n!==t)),children:`×`})]},`${e.url}-${t}`)),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__attachadd`,disabled:s,onClick:()=>o.current?.click(),children:s?`上传中…`:f}),(0,$.jsx)(`input`,{ref:o,type:`file`,multiple:!0,accept:u,className:`dtgrid__fileinput`,onChange:e=>void h(e.target.files)})]})}function Fn({pageId:e,onCommit:t,onClose:n}){let r=(0,P.useRef)(null),i=(0,P.useRef)(null),a=(0,P.useRef)(!1),o=(0,P.useRef)(!1),[s,c]=(0,P.useState)(!1);(0,P.useEffect)(()=>{let e=e=>{r.current?.contains(e.target)!==!0&&n()};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[n]);let l=()=>i.current?.getContext(`2d`)??null,u=e=>{let t=i.current;if(t==null)return{x:0,y:0};let n=t.getBoundingClientRect();return{x:(e.clientX-n.left)*(t.width/n.width),y:(e.clientY-n.top)*(t.height/n.height)}},d=e=>{let t=l();if(t==null)return;e.preventDefault(),e.target.setPointerCapture(e.pointerId),a.current=!0,o.current=!0;let n=u(e);t.beginPath(),t.moveTo(n.x,n.y)},f=e=>{if(!a.current)return;let t=l();if(t==null)return;let n=u(e);t.lineWidth=2.5,t.lineCap=`round`,t.lineJoin=`round`,t.strokeStyle=`#1f2329`,t.lineTo(n.x,n.y),t.stroke()},p=()=>{a.current=!1},h=()=>{let e=i.current,t=l();e!=null&&t!=null&&(t.clearRect(0,0,e.width,e.height),o.current=!1)},g=async()=>{let r=i.current;if(!(r==null||!o.current||s)){c(!0);try{let i=await new Promise(e=>r.toBlob(e,`image/png`));if(i==null)return;let a=new File([i],`signature-${Date.now()}.png`,{type:`image/png`});t((await m(a,`page`,e)).url),n()}catch(e){console.warn(`[datatable] 签字上传失败`,e)}finally{c(!1)}}};return(0,$.jsxs)(`div`,{ref:r,className:`dtgrid__editor dtgrid__editor--pop dtgrid__sigpad`,children:[(0,$.jsx)(`canvas`,{ref:i,className:`dtgrid__sigcanvas`,width:320,height:120,onPointerDown:d,onPointerMove:f,onPointerUp:p,onPointerLeave:p}),(0,$.jsxs)(`div`,{className:`dtgrid__sigfoot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__sigbtn`,onClick:h,children:`清除`}),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__sigbtn dtgrid__sigbtn--primary`,disabled:s,onClick:()=>void g(),children:s?`保存中…`:`保存签字`})]})]})}function In({member:e}){let[t,n]=(0,P.useState)(!1);(0,P.useEffect)(()=>n(!1),[e.avatar]);let r=x(e.avatar),i=e.nickName||e.userName;return r===``||t?(0,$.jsx)(`span`,{className:`dtgrid__avatar`,children:i.slice(0,1)}):(0,$.jsx)(`img`,{className:`dtgrid__avatarimg`,src:r,alt:``,onError:()=>n(!0)})}function Ln({value:e,spaceId:t,onCommit:n,onClose:r}){let i=(0,P.useRef)(null),[a,o]=(0,P.useState)(null),[s,c]=(0,P.useState)(e==null?``:String(e)),[u,d]=(0,P.useState)(``),f=N(e),p=u.replace(/^@+/,``).trim().toLowerCase(),m=e=>p===``||e.toLowerCase().includes(p);(0,P.useEffect)(()=>{if(t==null){o([]);return}let e=!1;return l(t).then(t=>{e||o(t)}).catch(()=>{e||o([])}),()=>{e=!0}},[t]),(0,P.useEffect)(()=>{let e=e=>{i.current?.contains(e.target)!==!0&&r()};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[r]);let h=e=>{n((f.includes(e)?f.filter(t=>t!==e):[...f,e]).join(`,`))};if(a!=null&&a.length===0)return(0,$.jsx)(`div`,{ref:i,className:`dtgrid__editor`,children:(0,$.jsx)(`input`,{autoFocus:!0,className:`dtgrid__input`,placeholder:`成员名，逗号分隔`,value:s,onChange:e=>c(e.target.value),onBlur:()=>{n(s),r()},onKeyDown:e=>{e.key===`Enter`&&(n(s),r())}})});let g=f.filter(e=>a!=null&&!a.some(t=>(t.nickName||t.userName)===e)&&m(e)),_=(a??[]).filter(e=>m(e.nickName||e.userName));return(0,$.jsxs)(`div`,{ref:i,className:`dtgrid__editor dtgrid__editor--pop dtgrid__members`,children:[(0,$.jsx)(`input`,{autoFocus:!0,className:`dtgrid__membersearch`,placeholder:`搜索成员，或输入 @名字 提及`,value:u,onChange:e=>d(e.target.value),onKeyDown:e=>{e.key===`Escape`&&r()}}),a==null&&(0,$.jsx)(`div`,{className:`dtgrid__members-loading`,children:`成员加载中…`}),g.map(e=>(0,$.jsxs)(`label`,{className:`dtgrid__optrow`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:!0,onChange:()=>h(e)}),(0,$.jsxs)(`span`,{className:`dtgrid__user`,children:[(0,$.jsx)(`span`,{className:`dtgrid__avatar`,children:e.slice(0,1)}),e]})]},e)),_.map(e=>{let t=e.nickName||e.userName;return(0,$.jsxs)(`label`,{className:`dtgrid__optrow`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:f.includes(t),onChange:()=>h(t)}),(0,$.jsxs)(`span`,{className:`dtgrid__user`,children:[(0,$.jsx)(In,{member:e}),t]})]},e.userId)}),a!=null&&a.length===0&&g.length===0&&p===``&&(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`暂无可选成员`}),a!=null&&_.length===0&&g.length===0&&p!==``&&(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`无匹配成员`})]})}function Rn({schema:e,value:t,shareToken:n,onCommit:r,onClose:i}){let a=(0,P.useRef)(null),o=e.linkTable,[s,c]=(0,P.useState)(null),[l,u]=(0,P.useState)(``),d=me(t);return(0,P.useEffect)(()=>{if(o==null)return;let e=!1;return c(null),u(``),Ie(o.slugId,n).then(t=>{e||c(t)}).catch(t=>{e||u(t instanceof Error?t.message:`读取失败`)}),()=>{e=!0}},[o?.slugId,n]),(0,P.useEffect)(()=>{let e=e=>{a.current?.contains(e.target)!==!0&&i()};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[i]),o==null?(0,$.jsx)(`div`,{ref:a,className:`dtgrid__editor dtgrid__editor--pop`,children:(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`请先在字段配置中选择关联的目标表`})}):(0,$.jsxs)(`div`,{ref:a,className:`dtgrid__editor dtgrid__editor--pop dtgrid__linkpick`,children:[(0,$.jsx)(`div`,{className:`dtgrid__linkpick-head`,children:o.title}),l.length>0&&(0,$.jsx)(`div`,{className:`dtgrid__fxerr`,children:l}),s==null&&l.length===0&&(0,$.jsx)(`div`,{className:`dtgrid__members-loading`,children:`记录加载中…`}),d!=null&&(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__linkpick-clear`,onClick:()=>{r(``),i()},children:`清除关联`}),(s?.records??[]).map(e=>{let t=d?.r===e.row;return(0,$.jsxs)(`button`,{type:`button`,className:`dtgrid__linkpick-row${t?` dtgrid__linkpick-row--on`:``}`,onClick:()=>{r(oe({s:o.slugId,r:e.row,t:e.title})),i()},children:[(0,$.jsx)(`span`,{className:`dtgrid__linkpick-idx`,children:e.row}),(0,$.jsx)(`span`,{className:`dtgrid__linkpick-title`,children:e.title}),t&&(0,$.jsx)(`span`,{className:`dtgrid__linkpick-check`,children:`✓`})]},e.row)}),s!=null&&s.records.length===0&&(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`目标表暂无记录`})]})}function zn({schema:e,wrapRef:t,initial:n,multiline:r,inputType:i,step:a,placeholder:o,transform:s,onCommit:c,onClose:l}){let[u,d]=(0,P.useState)(n),[f,p]=(0,P.useState)(!1),[m,h]=(0,P.useState)(!1),g=(0,P.useRef)(null),_=(0,P.useRef)(null),v=()=>{let t=Ye(e,u);if(t!=null){p(!0),h(!1),g.current!=null&&window.clearTimeout(g.current),g.current=window.setTimeout(()=>h(!0),20),_.current?.focus(),S(t,`error`);return}c(s==null?u:s(u)),l()},y=e=>{if(e.key===`Escape`){l();return}e.key===`Enter`&&(r&&e.shiftKey||(e.preventDefault(),v()))};(0,P.useLayoutEffect)(()=>{let e=_.current;e instanceof HTMLTextAreaElement&&(e.style.height=`auto`,e.style.height=`${e.scrollHeight}px`)},[u]);let b=r?`dtgrid__textarea`:`dtgrid__input`,x=`${f?` dtgrid__cellinput--invalid`:``}${m?` dtgrid__cellinput--shake`:``}`,ee=()=>h(!1),te=e=>{d(e.target.value),f&&p(!1)};return r?(0,$.jsx)(`div`,{ref:t,className:`dtgrid__editor dtgrid__editor--multi`,children:(0,$.jsx)(`textarea`,{autoFocus:!0,rows:1,ref:_,className:`${b}${x}`,placeholder:o,value:u,onChange:te,onBlur:v,onKeyDown:y,onAnimationEnd:ee})}):(0,$.jsx)(`div`,{ref:t,className:`dtgrid__editor`,children:(0,$.jsx)(`input`,{autoFocus:!0,ref:_,type:i,step:a,className:`${b}${x}`,placeholder:o,value:u,onChange:te,onBlur:v,onKeyDown:y,onAnimationEnd:ee})})}function Bn({schema:e,value:t,readOnly:n,spaceId:r,pageId:i,shareToken:a,onCommit:o,onClose:s}){let[c,l]=(0,P.useState)(t==null?``:String(t)),u=(0,P.useRef)(null);if((0,P.useEffect)(()=>{if(!mn.has(e.type))return;let t=e=>{u.current?.contains(e.target)!==!0&&s()};return document.addEventListener(`mousedown`,t),()=>document.removeEventListener(`mousedown`,t)},[e.type,s]),n)return null;switch(e.type){case`checkbox`:return null;case`multiLineText`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,multiline:!0,placeholder:`多行文本`,onCommit:o,onClose:s});case`select`:return(0,$.jsx)(`div`,{ref:u,className:`dtgrid__editor`,children:(0,$.jsxs)(`select`,{autoFocus:!0,className:`dtgrid__select`,value:t==null?``:String(t),onChange:e=>{o(e.target.value),s()},onBlur:s,children:[(0,$.jsx)(`option`,{value:``,children:`（空）`}),(e.options??[]).map(e=>(0,$.jsx)(`option`,{value:e.id,children:e.name},e.id))]})});case`multiSelect`:{let n=bn(t),r=e=>{o((n.includes(e)?n.filter(t=>t!==e):[...n,e]).join(`,`))};return(0,$.jsxs)(`div`,{ref:u,className:`dtgrid__editor dtgrid__editor--pop`,children:[(e.options??[]).map(e=>(0,$.jsxs)(`label`,{className:`dtgrid__optrow`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:n.includes(e.id),onChange:()=>r(e.id)}),(0,$.jsx)(`span`,{className:`dtgrid__pill`,style:{background:e.color??`#8c8c8c`},children:e.name})]},e.id)),(e.options??[]).length===0&&(0,$.jsx)(`span`,{className:`dtgrid__empty`,children:`暂无选项`})]})}case`date`:return(0,$.jsx)(`div`,{ref:u,className:`dtgrid__editor`,children:(0,$.jsx)(`input`,{autoFocus:!0,type:`date`,className:`dtgrid__input`,value:c,onChange:e=>l(e.target.value),onBlur:()=>{o(c),s()},onKeyDown:e=>{e.key===`Enter`&&(o(c),s())}})});case`progress`:{let t=e.max??100,n=Number(c)||0;return(0,$.jsxs)(`div`,{ref:u,className:`dtgrid__editor`,children:[(0,$.jsx)(`input`,{autoFocus:!0,type:`range`,min:0,max:t,value:n,onChange:e=>{l(e.target.value),o(Number(e.target.value))}}),(0,$.jsx)(`span`,{className:`dtgrid__prog-num`,children:n})]})}case`rating`:{let n=e.max??5,r=Number(t)||0;return(0,$.jsxs)(`div`,{ref:u,className:`dtgrid__editor`,children:[(0,$.jsx)(Tn,{count:r,max:n,onChange:e=>{o(e===0?``:e),e===0&&s()}}),(0,$.jsx)(`span`,{className:`dtgrid__prog-num`,children:r})]})}case`currency`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,inputType:`number`,step:`0.01`,transform:e=>e===``?``:Number(e),onCommit:o,onClose:s});case`user`:return(0,$.jsx)(Ln,{value:t,spaceId:r,onCommit:o,onClose:s});case`group`:return(0,$.jsx)(Ln,{value:t,spaceId:r,onCommit:o,onClose:s});case`attachment`:return(0,$.jsx)(Pn,{value:t,pageId:i,onCommit:o,onClose:s});case`image`:return(0,$.jsx)(Pn,{kind:`image`,value:t,pageId:i,onCommit:o,onClose:s});case`media`:return(0,$.jsx)(Pn,{kind:`media`,value:t,pageId:i,onCommit:o,onClose:s});case`signature`:return(0,$.jsx)(Fn,{pageId:i,onCommit:o,onClose:s});case`link`:return(0,$.jsx)(Rn,{schema:e,value:t,shareToken:a,onCommit:o,onClose:s});case`phone`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,inputType:`tel`,placeholder:`电话号码`,onCommit:o,onClose:s});case`email`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,inputType:`email`,placeholder:`name@example.com`,onCommit:o,onClose:s});case`location`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,placeholder:`地址（如：成都市天府大道）`,onCommit:o,onClose:s});case`barcode`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,placeholder:`条码内容（字母/数字）`,onCommit:o,onClose:s});case`url`:return(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,placeholder:`https://…`,onCommit:o,onClose:s});default:return ue(e.type)?null:(0,$.jsx)(zn,{schema:e,wrapRef:u,initial:c,onCommit:o,onClose:s})}}function Vn({schema:e}){let t=fe[e.type]??fe.text;return(0,$.jsx)(`span`,{className:`dtgrid__ftype`,style:{color:t},title:k[e.type]??`文本`,children:{text:`Aa`,multiLineText:`¶`,number:`#`,select:`▾`,multiSelect:`▾▾`,date:`📅`,user:`👤`,checkbox:`☑`,progress:`▰`,url:`🔗`,group:`👥`,attachment:`📎`,image:`🖼`,media:`🎬`,phone:`📞`,email:`✉️`,currency:`¥`,rating:`★`,autoNumber:`№`,barcode:`▮▮`,signature:`✍️`,location:`📍`,button:`🔘`,formula:`fx`,link:`⛓`,lookup:`🔎`,createdTime:`🕐`,modifiedTime:`🕑`,createdBy:`👤`,modifiedBy:`✏️`}[e.type]??`Aa`})}function Hn({title:e,fields:t,row:n,readCell:r,readOnly:i,spaceId:a,pageId:o,shareToken:s,comments:c,onCommit:l,onClose:u}){let[d,f]=(0,P.useState)(null),p=e=>{if(i!==!0){if(e.schema.type===`checkbox`){let t=r(n,e.col),i=t!=null&&(t===!0||String(t)===`1`||String(t)===`true`);l(n,e.col,i?``:`1`);return}ue(e.schema.type)||f(e.col)}};return(0,$.jsxs)(`div`,{className:`dtgrid__drawer`,children:[(0,$.jsxs)(`div`,{className:`dtgrid__drawer-head`,children:[(0,$.jsx)(`span`,{className:`dtgrid__drawer-title`,children:e}),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__drawer-close`,onClick:u,children:`×`})]}),(0,$.jsx)(`div`,{className:`dtgrid__drawer-body`,children:t.map(e=>(0,$.jsxs)(`div`,{className:`dtgrid__drawer-row`,children:[(0,$.jsxs)(`label`,{className:`dtgrid__drawer-label`,children:[(0,$.jsx)(Vn,{schema:e.schema}),` `,e.name]}),(0,$.jsx)(`div`,{className:`dtgrid__drawer-value`,children:d===e.col?(0,$.jsx)(Bn,{schema:e.schema,value:r(n,e.col,e.schema.type),readOnly:i,spaceId:a,pageId:o,shareToken:s,onCommit:t=>l(n,e.col,t),onClose:()=>f(null)}):(0,$.jsx)(`div`,{className:`dtgrid__drawer-edit${i===!0?` dtgrid__drawer-edit--ro`:``}`,role:i===!0?void 0:`button`,tabIndex:i===!0?void 0:0,onClick:()=>p(e),onKeyDown:t=>{t.key===`Enter`&&p(e)},children:(0,$.jsx)(Nn,{schema:e.schema,value:r(n,e.col,e.schema.type)})})})]},e.col))}),c!=null&&(0,$.jsx)(`div`,{className:`dtgrid__drawer-comments`,children:c.renderPanel(n)})]})}function Un(e){let t=e.getBoundingClientRect(),r=n(t);return{top:r.top,left:r.left,bottom:r.bottom,width:t.width,height:t.height}}var Wn=220,Gn=8;function Kn(e,t){let n=r().height;if(t===`multiLineText`){let t=Math.max(n-e.top-Gn,120);return{top:e.top-2,left:e.left-2,width:e.width+4,minHeight:e.height+4,maxHeight:t,overflowY:`auto`,"--dtgrid-multi-max":`${t}px`}}let i=n-e.bottom-Gn,a=e.top-Gn;return i<Wn&&a>i?{bottom:n-e.top+2,left:e.left,maxHeight:Math.max(a,120),overflowY:`auto`}:{top:e.bottom+2,left:e.left,maxHeight:Math.max(i,120),overflowY:`auto`}}var qn=(0,P.memo)(function({row:e,displayIndex:t,selected:n,dragging:r,dropBefore:i,height:a,editingCol:o,editingAnchor:c,readOnly:l,fields:u,values:d,colStyles:f,frozenCount:p,frozenOffsets:m,cellColor:h,canMoveRow:g,onDragStart:_,onDragClick:v,onToggleSelect:y,onOpenRecord:b,onRowResize:x,onContextMenu:S,onCloseEditor:ee,onCommit:te,onCellClick:ne,spaceId:C,pageId:re,shareToken:ie,commentCount:w}){return(0,$.jsxs)(`div`,{className:`dtgrid__row${n?` dtgrid__row--sel`:``}${r?` dtgrid__row--dragging`:``}${i?` dtgrid__row--dropbefore`:``}`,style:{height:`${a}px`},onContextMenu:t=>S(t,e),children:[(0,$.jsxs)(`div`,{className:`dtgrid__gut`,children:[g&&(0,$.jsx)(`span`,{className:`dtgrid__drag`,title:`拖拽调整行序`,onPointerDown:e=>_(e,t),onClick:v,children:`⠿`}),!l&&(0,$.jsx)(`input`,{type:`checkbox`,className:`dtgrid__sel`,checked:n,onChange:()=>y(e)}),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__rownum`,onClick:()=>b(e),title:`展开记录`,children:t+1}),!l&&(0,$.jsx)(`span`,{className:`dtgrid__rowresize`,onPointerDown:t=>x(t,e),onClick:e=>e.stopPropagation()})]}),u.map((t,n)=>{let r=o===t.col,i=d[n],a=r?(0,$.jsx)(Bn,{schema:t.schema,value:i,readOnly:l,spaceId:C,pageId:re,shareToken:ie,onCommit:n=>te(e,t.col,n),onClose:ee}):(0,$.jsx)(Nn,{schema:t.schema,value:i}),u=r?c:void 0,g=u!=null&&pn.has(t.schema.type)?(0,ge.createPortal)((0,$.jsx)(`div`,{className:`dtgrid__pop-host`,style:Kn(u,t.schema.type),children:a}),s()):a,_=h?.get(`${e}:${t.col}`),v=n<p;return(0,$.jsx)(`div`,{className:`dtgrid__cell${v?` dtgrid__cell--frozen`:``}${v&&n===p-1?` dtgrid__cell--frozen-last`:``}`,style:{...f[n],...v?{left:`${m[n]}px`}:{},..._==null?{}:{backgroundImage:`linear-gradient(${_}14, ${_}14)`}},onClick:n=>ne(e,t,Un(n.currentTarget)),children:g},t.col)}),(0,$.jsxs)(`div`,{className:`dtgrid__cell dtgrid__cell--pad`,children:[w>0&&(0,$.jsxs)(`button`,{type:`button`,className:`dtgrid__rowcomment`,onClick:()=>b(e),title:`${w} 条评论，点击查看`,children:[(0,$.jsx)(`span`,{"aria-hidden":`true`,children:`💬`}),` `,w]}),(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__rowexpand`,onClick:()=>b(e),title:`展开记录`,children:`⤢`})]})]})});function Jn({api:e,fields:t,rows:r,groups:i,cellColor:a,readOnly:o,rowHeight:l,rowHeightSeq:u,footStats:f,onFootStatsChange:p,onChanged:m,onEditField:h,onAddField:g,onAddRecord:_,frozenCount:v=0,onInsertFieldAt:y,onFieldOrderChange:b,onFreezeChange:x,onRemoveField:ee,computed:te,onRowWrite:ne,onInsertRowAt:C,onRemoveRowAt:re,onMoveRow:ie,spaceId:w,pageId:ae,shareToken:T,comments:oe}){let[E,se]=(0,P.useState)(null),[ce,D]=(0,P.useState)(new Set),[O,le]=(0,P.useState)(null),[de,fe]=(0,P.useState)(new Set),A=f??hn,[j,pe]=(0,P.useState)(null),[M,N]=(0,P.useState)({}),[me,he]=(0,P.useState)({}),F=(0,P.useRef)(null),_e=(0,P.useRef)(null),ve=(0,P.useRef)(null),[I,L]=(0,P.useState)(null),[R,z]=(0,P.useState)(null),[B,V]=(0,P.useState)(null),[H,U]=(0,P.useState)(null),[W,G]=(0,P.useState)(null),K=(0,P.useRef)(null),q=(0,P.useRef)(null),ye=(0,P.useRef)(null),be=(0,P.useRef)(null),xe=(0,P.useRef)(!1),Se=nn[l],Ce=(0,P.useRef)(E);Ce.current=E;let we=(0,P.useRef)(me);we.current=me;let Te=(0,P.useRef)(Se);Te.current=Se,(0,P.useEffect)(()=>{if(E==null)return;let e=()=>se(null),t=F.current;return t?.addEventListener(`scroll`,e),window.addEventListener(`resize`,e),()=>{t?.removeEventListener(`scroll`,e),window.removeEventListener(`resize`,e)}},[E]),(0,P.useEffect)(()=>{if(j==null)return;let e=e=>{let t=e.target;(t==null||t.closest(`.dt-pop--footstat`)==null)&&pe(null)},t=()=>pe(null);document.addEventListener(`mousedown`,e,!0);let n=F.current;return n?.addEventListener(`scroll`,t),window.addEventListener(`resize`,t),()=>{document.removeEventListener(`mousedown`,e,!0),n?.removeEventListener(`scroll`,t),window.removeEventListener(`resize`,t)}},[j]),(0,P.useEffect)(()=>{if(B==null)return;let e=e=>{let t=e.target;(t==null||t.closest(`.dt-pop--rowmenu`)==null)&&V(null)},t=()=>V(null);document.addEventListener(`mousedown`,e,!0);let n=F.current;return n?.addEventListener(`scroll`,t),window.addEventListener(`resize`,t),()=>{document.removeEventListener(`mousedown`,e,!0),n?.removeEventListener(`scroll`,t),window.removeEventListener(`resize`,t)}},[B]),(0,P.useEffect)(()=>{if(H==null)return;let e=e=>{let t=e.target;(t==null||t.closest(`.dt-pop--headmenu`)==null)&&U(null)},t=()=>U(null);document.addEventListener(`mousedown`,e,!0);let n=F.current;return n?.addEventListener(`scroll`,t),window.addEventListener(`resize`,t),()=>{document.removeEventListener(`mousedown`,e,!0),n?.removeEventListener(`scroll`,t),window.removeEventListener(`resize`,t)}},[H]),(0,P.useEffect)(()=>{he(t=>{if(e!=null&&o!==!0)for(let n of Object.keys(t))e.setRowHeight(Number(n),un);return{}})},[u]),(0,P.useEffect)(()=>{if(e==null||_e.current!=null||ve.current!=null)return;let n={};for(let r of t){let t=e.getColumnWidth(r.col);t<=0||Math.abs(t-rn)<.5||dn.some(e=>Math.abs(t-e)<.5)||(n[r.col]=t)}let i={};for(let t of r){let n=e.getRowHeight(t);n>0&&!fn.some(e=>Math.abs(n-e)<.5)&&(i[t]=n)}N(n),he(i)},[e,t,r]);let Ee=(0,P.useCallback)((t,n,r)=>{if(r===`formula`||r===`lookup`){let e=te?.get(`${t}:${n}`);if(e!==void 0)return e}return e?.readCell(t,n)??null},[e,te]),De=(0,P.useMemo)(()=>{let e=new Map;for(let n of t){let t=A[n.col];if(t==null)continue;let i=r.map(e=>Ee(e,n.col,n.schema.type)).filter(e=>!Be(e));if(t===`count`){e.set(n.col,`计数 ${r.length}`);continue}if(t===`filled`){e.set(n.col,`已填写 ${i.length}`);continue}if(t===`empty`){e.set(n.col,`未填写 ${r.length-i.length}`);continue}if(t===`distinct`){e.set(n.col,`去重计数 ${new Set(i.map(e=>Ve(e))).size}`);continue}let a=i.map(e=>typeof e==`number`?e:Number(String(e).replace(/[,¥$%\s]/g,``))).filter(e=>Number.isFinite(e)),o=e=>String(Math.round(e*100)/100),s=a.reduce((e,t)=>e+t,0);t===`sum`?e.set(n.col,`求和 ${o(s)}`):t===`avg`?e.set(n.col,`平均值 ${a.length>0?o(s/a.length):`0`}`):t===`max`?e.set(n.col,`最大值 ${a.length>0?o(Math.max(...a)):`0`}`):e.set(n.col,`最小值 ${a.length>0?o(Math.min(...a)):`0`}`)}return e},[t,r,Ee,A]),Oe=(0,P.useCallback)((n,r,i)=>{let a=t.find(e=>e.col===r);if(a!=null){let e=Ye(a.schema,i);if(e!=null){S(`${a.name}：${e}`,`error`);return}}e?.writeCell(n,r,i),ne?.(n),m()},[e,ne,m,t]),ke=(0,P.useCallback)((t,n)=>{let r=e?.readCell(t,n);Oe(t,n,r!=null&&(r===!0||String(r)===`1`||String(r)===`true`)?``:`1`)},[e,Oe]),Ae=(0,P.useCallback)((e,t)=>{let n=t.schema.buttonAction;if(n!=null){if(n.kind===`openUrl`){(n.url??``).length>0&&window.open(Sn(n.url),`_blank`,`noopener`);return}n.kind===`setValue`&&n.targetCol!=null&&o!==!0&&Oe(e,n.targetCol,n.value??``)}},[Oe,o]),je=(0,P.useCallback)(e=>{D(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n})},[]),Me=r.length>0&&r.every(e=>ce.has(e)),Ne=(0,P.useCallback)((e,t,n)=>{if(t.schema.type===`checkbox`){o!==!0&&ke(e,t.col);return}if(t.schema.type===`button`){Ae(e,t);return}o!==!0&&(ue(t.schema.type)||se({row:e,col:t.col,anchor:n}))},[ke,Ae,o]),Pe=(t,n)=>{t.preventDefault(),t.stopPropagation();let r=t.currentTarget.parentElement,i=M[n]??r?.getBoundingClientRect().width??rn;_e.current={col:n,startX:t.clientX,startW:i};let a=e=>{let t=_e.current;if(t==null)return;let n=Math.max(on,Math.min(sn,t.startW+(e.clientX-t.startX)));t.lastW=n,N(e=>({...e,[t.col]:n}))},o=()=>{let t=_e.current;_e.current=null,document.removeEventListener(`pointermove`,a),document.removeEventListener(`pointerup`,o),t!=null&&t.lastW!=null&&e?.setColumnWidth(t.col,t.lastW)};document.addEventListener(`pointermove`,a),document.addEventListener(`pointerup`,o)},J=(0,P.useCallback)((t,n)=>{t.preventDefault(),t.stopPropagation();let r=we.current[n]??Te.current;ve.current={row:n,startY:t.clientY,startH:r};let i=e=>{let t=ve.current;if(t==null)return;let n=Math.max(cn,Math.min(ln,t.startH+(e.clientY-t.startY)));t.lastH=n,he(e=>({...e,[t.row]:n}))},a=()=>{let t=ve.current;ve.current=null,document.removeEventListener(`pointermove`,i),document.removeEventListener(`pointerup`,a),t!=null&&t.lastH!=null&&e?.setRowHeight(t.row,t.lastH)};document.addEventListener(`pointermove`,i),document.addEventListener(`pointerup`,a)},[e]),Fe=(0,P.useCallback)((e,t)=>{if(o===!0||ie==null||e.button!==0)return;xe.current=!1;let n=e.clientY;ye.current={displayIndex:t,startY:n,engaged:!1};let i=e=>{let n=F.current;if(n==null)return t;let r=n.querySelectorAll(`.dtgrid__row`);for(let t=0;t<r.length;t++){let n=r[t].getBoundingClientRect();if(e<n.top+n.height/2)return t}return r.length},a=e=>{let t=ye.current;if(t==null)return;if(!t.engaged){if(Math.abs(e.clientY-t.startY)<6)return;t.engaged=!0,L(r[t.displayIndex])}e.preventDefault();let n=i(e.clientY);be.current!==n&&(be.current=n,z(n))},s=e=>{document.removeEventListener(`pointermove`,a),document.removeEventListener(`pointerup`,s);let t=ye.current,n=be.current;if(ye.current=null,be.current=null,L(null),z(null),t==null||!t.engaged)return;xe.current=!0;let o=t.displayIndex,c=n??i(e.clientY),l=c<=o?c:c-1;l===o||l<0||l>=r.length||o<0||o>=r.length||ie(r[o],r[l])};document.addEventListener(`pointermove`,a),document.addEventListener(`pointerup`,s)},[o,ie,r]),Ie=(0,P.useCallback)((e,n)=>{if(o===!0||b==null||e.button!==0||t.length<2)return;xe.current=!1;let r=e.clientX,i=t[n]?.col;if(i==null)return;K.current={col:i,startX:r,engaged:!1};let a=e=>{let t=F.current?.querySelector(`.dtgrid__head`);if(t==null)return n;let r=t.querySelectorAll(`.dtgrid__hcell`);for(let t=0;t<r.length;t++){let n=r[t].getBoundingClientRect();if(e<n.left+n.width/2)return t}return r.length},s=e=>{let t=K.current;if(t==null)return;if(!t.engaged){if(Math.abs(e.clientX-t.startX)<6)return;t.engaged=!0,q.current=n,G({col:t.col,gap:n})}e.preventDefault();let r=a(e.clientX);q.current!==r&&(q.current=r,G({col:t.col,gap:r}))},c=e=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c);let r=K.current,i=q.current;if(K.current=null,q.current=null,G(null),r==null||!r.engaged)return;xe.current=!0;let o=n,l=i??a(e.clientX),u=l<=o?l:l-1;if(u===o||u<0||u>=t.length||o<0||o>=t.length)return;let d=t.map(e=>e.col),[f]=d.splice(o,1);d.splice(u,0,f),b(d)};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)},[o,b,t]),Le=(0,P.useCallback)((e,n)=>{if(b==null)return;let r=e+n;if(r<0||r>=t.length)return;let i=t.map(e=>e.col),a=i[e];i[e]=i[r],i[r]=a,b(i)},[t,b]),Re=(0,P.useCallback)((e,t)=>{if(o===!0||Ce.current!=null)return;e.preventDefault();let n=d(e.clientX,e.clientY);U({col:t,top:c(n.top,320,`y`),left:c(n.left,190,`x`)})},[o]),Y=(0,P.useMemo)(()=>t.map(e=>{let t=M[e.col];return t==null?{flex:`0 0 ${rn}px`,minWidth:rn,maxWidth:sn}:{flex:`0 0 ${t}px`,minWidth:t,maxWidth:t}}),[t,M]),ze=(0,P.useMemo)(()=>{let e=[],n=an;for(let r of t)e.push(n),n+=M[r.col]??rn;return e},[t,M]),He=(0,P.useMemo)(()=>{let e=new Map;for(let n of r)e.set(n,t.map(e=>Ee(n,e.col,e.schema.type)));return e},[r,t,Ee]),Ue=(0,P.useCallback)(e=>le(e),[]),We=(0,P.useCallback)(()=>se(null),[]),Ge=(0,P.useCallback)(e=>{xe.current&&(xe.current=!1,e.stopPropagation())},[]),Ke=(0,P.useCallback)((e,t)=>{if(o===!0||Ce.current!=null||C==null)return;e.preventDefault();let n=d(e.clientX,e.clientY);V({row:t,top:c(n.top,140,`y`),left:c(n.left,170,`x`)})},[o,C]),qe=(e,n)=>(0,$.jsx)(qn,{row:e,displayIndex:n,selected:ce.has(e),dragging:I===e,dropBefore:I!=null&&R===n,height:me[e]??Se,editingCol:E?.row===e?E.col:null,editingAnchor:E?.row===e?E.anchor:void 0,readOnly:o,fields:t,values:He.get(e)??[],colStyles:Y,frozenCount:v,frozenOffsets:ze,cellColor:a,commentCount:oe?.countOf(e)??0,canMoveRow:ie!=null&&o!==!0,onDragStart:Fe,onDragClick:Ge,onToggleSelect:je,onOpenRecord:Ue,onRowResize:J,onContextMenu:Ke,onCloseEditor:We,onCommit:Oe,onCellClick:Ne,spaceId:w,pageId:ae,shareToken:T},e),Je=e=>{fe(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n})};return e==null?(0,$.jsx)(`div`,{className:`dtgrid dtgrid--loading`,children:`多维表格加载中…`}):(0,$.jsxs)(`div`,{className:`dtgrid${o?``:` dtgrid--selectable`}${ce.size>0?` dtgrid--hassel`:``}${I==null?``:` dtgrid--rowdrag`}`,style:{"--dt-row-h":`${Se}px`},children:[(0,$.jsxs)(`div`,{className:`dtgrid__body`,ref:F,children:[(0,$.jsxs)(`div`,{className:`dtgrid__head`,children:[(0,$.jsx)(`div`,{className:`dtgrid__gut dtgrid__gut--head`,children:!o&&(0,$.jsx)(`input`,{type:`checkbox`,className:`dtgrid__selall`,checked:Me,ref:e=>{e!=null&&(e.indeterminate=ce.size>0&&!Me)},onChange:()=>D(Me?new Set:new Set(r))})}),t.map((e,t)=>{let n=t<v;return(0,$.jsxs)(`button`,{type:`button`,"data-field-col":e.col,className:`dtgrid__hcell${n?` dtgrid__hcell--frozen`:``}${n&&t===v-1?` dtgrid__hcell--frozen-last`:``}${W!=null&&W.col===e.col?` dtgrid__hcell--dragging`:``}${W!=null&&W.col!==e.col&&W.gap===t?` dtgrid__hcell--dropbefore`:``}`,style:{...Y[t],...n?{left:`${ze[t]}px`}:{}},onClick:()=>{if(xe.current){xe.current=!1;return}h(e.col)},onContextMenu:t=>Re(t,e.col),onPointerDown:e=>Ie(e,t),title:`${k[e.schema.type]??`文本`} · 点击配置 · 右键更多（插入/移动/固定）`,children:[(0,$.jsx)(Vn,{schema:e.schema}),(0,$.jsx)(`span`,{className:`dtgrid__hname`,children:e.name}),!o&&(0,$.jsx)(`span`,{className:`dtgrid__colresize`,onPointerDown:t=>{t.stopPropagation(),Pe(t,e.col)},onClick:e=>e.stopPropagation()})]},e.col)}),!o&&(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__addcol`,onClick:g,title:`添加字段`,children:`＋`}),(0,$.jsx)(`div`,{className:`dtgrid__hcelltail${W!=null&&W.gap===t.length?` dtgrid__hcelltail--dropbefore`:``}`})]}),i!=null&&i.length>0?i.map(e=>{let t=de.has(e.key);return(0,$.jsxs)(P.Fragment,{children:[(0,$.jsxs)(`div`,{className:`dtgrid__group`,onClick:()=>Je(e.key),children:[(0,$.jsx)(`span`,{className:`dtgrid__group-arrow${t?` dtgrid__group-arrow--collapsed`:``}`,children:`▸`}),e.color!=null&&(0,$.jsx)(`span`,{className:`dtgrid__group-dot`,style:{background:e.color}}),(0,$.jsx)(`span`,{className:`dtgrid__group-label`,children:e.label}),(0,$.jsxs)(`span`,{className:`dtgrid__group-count`,children:[e.rows.length,` 条`]})]}),!t&&e.rows.map((e,t)=>qe(e,t))]},e.key)}):r.map((e,t)=>qe(e,t)),(0,$.jsxs)(`div`,{className:`dtgrid__foot${I!=null&&R===r.length?` dtgrid__foot--dropbefore`:``}`,children:[(0,$.jsx)(`div`,{className:`dtgrid__gut dtgrid__gut--foot`,children:!o&&(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__footadd`,onClick:_,title:`添加记录`,children:`＋`})}),t.map((e,t)=>{let r=t<v;return(0,$.jsx)(`button`,{type:`button`,className:`dtgrid__footcell${A[e.col]==null?``:` dtgrid__footcell--on`}${r?` dtgrid__footcell--frozen`:``}${r&&t===v-1?` dtgrid__footcell--frozen-last`:``}`,style:{...Y[t],...r?{left:`${ze[t]}px`}:{}},title:`点击设置该列统计`,onClick:t=>{let r=n(t.currentTarget.getBoundingClientRect());pe({col:e.col,top:r.top-4,left:r.left})},children:De.get(e.col)??``},e.col)}),(0,$.jsx)(`div`,{className:`dtgrid__cell dtgrid__cell--pad`})]}),r.length===0&&(0,$.jsxs)(`div`,{className:`dtgrid__emptyrow`,children:[`暂无记录`,!o&&`，点击左下角「＋」添加`]})]}),O!=null&&(0,$.jsx)(Hn,{title:`记录 ${r.indexOf(O)+1}`,fields:t,row:O,readCell:Ee,readOnly:o,spaceId:w,pageId:ae,shareToken:T,comments:oe,onCommit:Oe,onClose:()=>le(null)}),j!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-pop--footstat`,style:{top:j.top,left:j.left},children:[_n.filter(e=>{if(!vn.includes(e))return!0;let n=t.find(e=>e.col===j.col);return n!=null&&yn.has(n.schema.type)}).map(e=>(0,$.jsx)(`button`,{type:`button`,className:A[j.col]===e?`dt-pop__item--on`:``,onClick:()=>{let t=j.col;p?.({...A,[t]:e}),pe(null)},children:gn[e]},e)),A[j.col]!=null&&(0,$.jsx)(`button`,{type:`button`,className:`dt-pop--footstat__clear`,onClick:()=>{let e=j.col,t={...A};delete t[e],p?.(t),pe(null)},children:`不展示`})]}),s()),B!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-pop--rowmenu`,style:{top:B.top,left:B.left},children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let e=B.row;V(null),C?.(e)},children:`在上方插入记录`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let e=B.row;V(null),C?.(e+1)},children:`在下方插入记录`}),(0,$.jsx)(`div`,{className:`dt-pop--rowmenu__sep`}),(0,$.jsx)(`button`,{type:`button`,className:`dt-pop--rowmenu__danger`,onClick:()=>{let e=B.row;V(null),D(t=>{if(!t.has(e))return t;let n=new Set(t);return n.delete(e),n}),le(t=>t===e?null:t),re?.(e)},children:`删除记录`})]}),s()),H!=null&&(()=>{let e=t.findIndex(e=>e.col===H.col);if(e<0)return null;let n=e===0,r=e===t.length-1,i=v===e+1;return(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-pop--headmenu`,style:{top:H.top,left:H.left},children:[y!=null&&(0,$.jsxs)(P.Fragment,{children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{U(null),y(e)},children:`在左侧插入字段`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{U(null),y(e+1)},children:`在右侧插入字段`}),(0,$.jsx)(`div`,{className:`dt-pop--headmenu__sep`})]}),b!=null&&(0,$.jsxs)(P.Fragment,{children:[(0,$.jsx)(`button`,{type:`button`,disabled:n,onClick:()=>{U(null),Le(e,-1)},children:`左移一列`}),(0,$.jsx)(`button`,{type:`button`,disabled:r,onClick:()=>{U(null),Le(e,1)},children:`右移一列`}),(0,$.jsx)(`div`,{className:`dt-pop--headmenu__sep`})]}),x!=null&&(0,$.jsx)(`button`,{type:`button`,onClick:()=>{U(null),x(i?0:e+1)},children:i?`取消固定`:v>0?`固定到此处`:`固定列到此处`}),(0,$.jsx)(`div`,{className:`dt-pop--headmenu__sep`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{U(null),h(H.col)},children:`编辑字段`}),ee!=null&&(0,$.jsx)(`button`,{type:`button`,className:`dt-pop--headmenu__danger`,onClick:()=>{U(null),ee(H.col)},children:`删除字段`})]}),s())})()]})}var Yn=`__none__`,Xn=`未分组`,Zn=50,Qn=new Set([`user`,`group`,`createdBy`,`modifiedBy`]),$n=new Set([`createdTime`,`modifiedTime`,`date`]),er=new Set([`text`,`number`,`currency`,`phone`,`email`,`formula`,`autoNumber`]),tr=new Set([`button`]),nr=[`#3370ff`,`#34b37e`,`#f59a23`,`#8f5cf7`,`#e0433f`,`#00b5c8`,`#646a73`];function rr(e){let t=0;for(let n=0;n<e.length;n+=1)t=(t*31+e.charCodeAt(n))%9973;return nr[t%nr.length]}function ir(e){let t=e.trim(),n=864e5;if(/^\d{4}-\d{2}-\d{2}$/.test(t)){let[e,r,i]=t.split(`-`).map(Number),a=new Date,o=Math.round((new Date(e,r-1,i).getTime()-new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime())/n);return o===0?`今天`:o===1?`明天`:o===-1?`昨天`:o>1&&o<=30?`${o} 天后`:o<-1&&o>=-30?`${-o} 天前`:t}let r=Date.parse(t.replace(` `,`T`));if(Number.isNaN(r))return e;let i=Date.now()-r,a=Math.abs(i),o=6e4,s=36e5;if(a<o)return`刚刚`;let c,l;return a<s?(c=Math.floor(a/o),l=`分钟`):a<n?(c=Math.floor(a/s),l=`小时`):a<30*n?(c=Math.floor(a/n),l=`天`):a<365*n?(c=Math.floor(a/(30*n)),l=`个月`):(c=Math.floor(a/(365*n)),l=`年`),i>=0?`${c} ${l}前`:`${c} ${l}后`}function ar(e,t,n,r){let i=e.readCell(t,n);if(i==null)return``;let a=String(i).trim();if(a.length===0||a===`[]`)return``;if(r===`user`){for(let e of a.split(`,`)){let t=e.trim();if(t.length>0)return t}return``}return a}function or(e){if(e==null)return[];let t=String(e).trim();return t.length===0||t===`[]`?[]:t.split(`,`).map(e=>e.trim()).filter(e=>e.length>0)}function sr(e,t){return or(t).map(t=>({id:t,opt:(e.options??[]).find(e=>e.id===t)}))}function cr({api:e,row:t,fields:n,cellColor:r,draggable:i,dragging:a,commentCount:o,onOpenComments:s,onDragStart:c,onDragEnd:l,onOpen:u}){if(n.length===0)return(0,$.jsx)(`article`,{className:`dtkanban__card${a?` dtkanban__card--dragging`:``}`,draggable:i,onDragStart:c,onDragEnd:l,onClick:u,children:(0,$.jsx)(`div`,{className:`dtkanban__card-none`,children:`（未配置显示字段）`})});let d=n[0],f=n.slice(1).filter(e=>!tr.has(e.schema.type)),p=f.find(n=>$n.has(n.schema.type)&&String(e.readCell(t,n.col)??``).trim().length>0),m=f.filter(e=>e!==p&&!Qn.has(e.schema.type)),h=f.filter(e=>Qn.has(e.schema.type)),g=e=>r?.get(`${t}:${e}`),_=[];m.forEach(n=>{let r=e.readCell(t,n.col),i=n.schema.type;if(i===`select`||i===`multiSelect`){let e=sr(n.schema,r);if(e.length===0){_.push((0,$.jsx)(`span`,{className:`dtkanban__chip dtkanban__chip--none`,children:`无`},n.col));return}e.forEach(({id:e,opt:t},r)=>_.push((0,$.jsxs)(`span`,{className:`dtkanban__chip`,title:n.name,style:t?.color==null?void 0:{color:t.color},children:[(0,$.jsx)(`i`,{className:`dtkanban__chip-dot`,style:{background:t?.color??`#8f959e`}}),t?.name??e]},`${n.col}-${r}`)));return}if(i===`checkbox`){let e=r==null?``:String(r);(e===`1`||e===`true`)&&_.push((0,$.jsx)(`span`,{className:`dtkanban__chip dtkanban__chip--none`,title:n.name,children:`✓`},n.col));return}let a=r==null?``:String(r).trim();if(a.length!==0){if(er.has(i)){_.push((0,$.jsx)(`span`,{className:`dtkanban__chip dtkanban__chip--plain`,title:`${n.name}: ${a}`,style:g(n.col)==null?void 0:{color:g(n.col)},children:a},n.col));return}_.push((0,$.jsx)(`span`,{className:`dtkanban__card-rich`,title:n.name,children:(0,$.jsx)(Nn,{schema:n.schema,value:r})},n.col))}});let v=p==null?``:String(e.readCell(t,p.col)??``).trim(),y=h.map(n=>({f:n,names:or(e.readCell(t,n.col))})).filter(e=>e.names.length>0);return(0,$.jsxs)(`article`,{className:`dtkanban__card${a?` dtkanban__card--dragging`:``}`,draggable:i,onDragStart:c,onDragEnd:l,onClick:u,title:i?`点击查看详情，拖到其它列可改分组值`:`点击查看详情`,children:[(0,$.jsx)(`div`,{className:`dtkanban__card-title`,style:g(d.col)==null?void 0:{color:g(d.col)},children:(0,$.jsx)(Nn,{schema:d.schema,value:e.readCell(t,d.col)})}),_.length>0&&(0,$.jsx)(`div`,{className:`dtkanban__card-chips`,children:_}),(y.length>0||v.length>0||o>0)&&(0,$.jsxs)(`div`,{className:`dtkanban__card-foot`,children:[o>0&&(0,$.jsxs)(`button`,{type:`button`,className:`dtkanban__card-comment`,title:`${o} 条评论，点击查看`,onClick:e=>{e.stopPropagation(),s()},children:[(0,$.jsx)(`span`,{"aria-hidden":`true`,children:`💬`}),` `,o]}),y.map(({f:e,names:t})=>(0,$.jsx)(`span`,{className:`dtkanban__people`,title:`${e.name}: ${t.join(`、`)}`,children:t.map((e,t)=>(0,$.jsx)(`span`,{className:`dtkanban__avatar`,style:{background:rr(e)},children:e.slice(0,1)},`${e}-${t}`))},e.col)),v.length>0&&(0,$.jsx)(`span`,{className:`dtkanban__card-time`,title:`${p?.name}: ${v}`,children:ir(v)})]})]})}function lr({api:e,fields:t,rows:r,groupField:i,cardFields:a,cellColor:o,readOnly:l,spaceId:u,pageId:d,shareToken:f,comments:p,onWriteCell:m,onAddCard:h,onEditField:g,onPickGroup:_}){let[v,y]=(0,P.useState)(null),[b,x]=(0,P.useState)(null),[S,ee]=(0,P.useState)([]),[te,ne]=(0,P.useState)(null),[C,re]=(0,P.useState)(null),ie=(0,P.useRef)(0),w=(0,P.useRef)(null),ae=(0,P.useRef)(null),T=(0,P.useRef)(0),oe=(0,P.useRef)(0),E=()=>{ae.current!=null&&(cancelAnimationFrame(ae.current),ae.current=null)},se=()=>{if(ae.current!=null)return;let e=()=>{let t=w.current;if(t==null||T.current===0||Date.now()-oe.current>200){ae.current=null;return}t.scrollLeft+=T.current,ae.current=requestAnimationFrame(e)};ae.current=requestAnimationFrame(e)},ce=e=>{oe.current=Date.now();let t=w.current;if(t==null||v==null){T.current=0,E();return}let n=t.getBoundingClientRect(),r=e=>Math.min(1,Math.max(0,(90-e)/90)),i=e.clientX-n.left,a=n.right-e.clientX,o=i<90?-Math.ceil(20*r(i)):a<90?Math.ceil(20*r(a)):0;T.current=o,o===0?E():se()};(0,P.useEffect)(()=>E,[]),(0,P.useEffect)(()=>{if(C==null)return;let e=e=>{let t=e.target;(t==null||t.closest(`.dt-mini-menu`)==null&&t.closest(`.dtkanban__col-more`)==null)&&re(null)},t=()=>re(null);return document.addEventListener(`pointerdown`,e,!0),window.addEventListener(`scroll`,t,!0),window.addEventListener(`resize`,t),()=>{document.removeEventListener(`pointerdown`,e,!0),window.removeEventListener(`scroll`,t,!0),window.removeEventListener(`resize`,t)}},[C]);let D=i?.schema.type,O=l!==!0&&i!=null&&D!=null&&de(D)&&!ue(D),le=(0,P.useMemo)(()=>{if(e==null||i==null||D==null)return[];let t=new Map,n={key:Yn,label:Xn,value:``,rows:[]};t.set(``,n);let a=[n];if(D===`select`)for(let e of i.schema.options??[]){if(t.has(e.id))continue;let n={key:`opt:${e.id}`,label:e.name,color:e.color,value:e.id,rows:[]};t.set(e.id,n),a.push(n)}for(let n of r){let r=ar(e,n,i.col,D),o=t.get(r);o??(o={key:`raw:${r}`,label:r,value:r,rows:[]},t.set(r,o),a.push(o)),o.rows.push(n)}return a},[e,i,D,r]),k=(0,P.useMemo)(()=>{if(i==null)return[];let e=a!=null&&a.length>0?new Set(a):null;return t.filter(t=>t.col!==i.col&&(e==null||e.has(t.col)))},[t,i,a]);if(e==null)return(0,$.jsx)(`div`,{className:`dtkanban dtkanban--state`,children:`加载中…`});if(i==null||D==null||!de(D))return(0,$.jsxs)(`div`,{className:`dtkanban dtkanban--state`,children:[(0,$.jsxs)(`div`,{className:`dtkanban__hint`,children:[`看板视图需要一个分组字段作为列（支持「单选」「人员」字段）。`,i!=null&&(0,$.jsxs)(`span`,{className:`dtkanban__hint-sub`,children:[`当前分组字段「`,i.name,`」是`,ur[D??`text`]??`该`,`类型，暂不支持看板。`]})]}),l!==!0&&(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:_,children:`选择分组字段`})]});let fe=t=>{v==null||!O||(ar(e,v,i.col,D)!==t.value&&m(v,i.col,t.value),y(null),x(null))},A=e=>{Date.now()-ie.current<300||ne(e)};return(0,$.jsxs)(`div`,{className:`dtkanban`,children:[(0,$.jsx)(`div`,{className:`dtkanban__board`,ref:w,onDragOver:ce,onDrop:E,children:le.map(t=>{let r=t.rows.length,i=S.includes(t.key)?t.rows:t.rows.slice(0,Zn),a=r-i.length;return(0,$.jsxs)(`section`,{className:`dtkanban__col${b===t.key&&O?` dtkanban__col--over`:``}`,onDragOver:e=>{v==null||!O||(e.preventDefault(),e.dataTransfer.dropEffect=`move`,b!==t.key&&x(t.key))},onDragLeave:e=>{e.currentTarget.contains(e.relatedTarget)||x(e=>e===t.key?null:e)},onDrop:e=>{e.preventDefault(),fe(t)},children:[(0,$.jsxs)(`header`,{className:`dtkanban__col-head`,children:[t.color!=null&&(0,$.jsx)(`span`,{className:`dtkanban__col-dot`,style:{background:t.color}}),(0,$.jsx)(`span`,{className:`dtkanban__col-name`,title:t.label,children:t.label}),(0,$.jsx)(`span`,{className:`dtkanban__col-count`,children:r}),l!==!0&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(`button`,{type:`button`,className:`dtkanban__col-add`,title:`在此列新增记录`,onClick:()=>h(t.value),children:`＋`}),(0,$.jsx)(`button`,{type:`button`,className:`dtkanban__col-more`,title:`列操作`,onClick:e=>{let r=n(e.currentTarget.getBoundingClientRect());re({key:t.key,x:Math.max(8,c(r.right-168,184,`x`)),y:c(r.bottom+4,96,`y`)})},children:`⋮`})]})]}),(0,$.jsxs)(`div`,{className:`dtkanban__col-body`,children:[i.map(t=>(0,$.jsx)(cr,{api:e,row:t,fields:k,cellColor:o,draggable:O,dragging:v===t,commentCount:p?.countOf(t)??0,onOpenComments:()=>A(t),onDragStart:e=>{y(t),e.dataTransfer.effectAllowed=`move`,e.dataTransfer.setData(`text/plain`,String(t))},onDragEnd:()=>{ie.current=Date.now(),y(null),x(null)},onOpen:()=>A(t)},t)),a>0&&(0,$.jsxs)(`button`,{type:`button`,className:`dtkanban__more`,onClick:()=>ee(e=>e.includes(t.key)?e:[...e,t.key]),children:[`显示更多（还有 `,a,` 条）`]}),r===0&&(0,$.jsx)(`div`,{className:`dtkanban__col-empty`,children:`暂无事项`})]})]},t.key)})}),C!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-mini-menu`,style:{left:C.x,top:C.y},children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let e=le.find(e=>e.key===C.key);re(null),e!=null&&h(e.value)},children:`在此列新增记录`}),g!=null&&i!=null&&(0,$.jsxs)(`button`,{type:`button`,onClick:()=>{let e=i.col;re(null),g(e)},children:[`编辑字段「`,i.name,`」`]})]}),s()),te!=null&&(0,$.jsx)(Hn,{title:(t=>{let n=k[0],i=n==null?``:String(e.readCell(t,n.col)??``).trim();return i.length>0&&i.length<=30?i:`记录 ${r.indexOf(t)+1}`})(te),fields:t,row:te,readCell:(t,n)=>e.readCell(t,n),readOnly:l,spaceId:u,pageId:d,shareToken:f,comments:p,onCommit:m,onClose:()=>ne(null)})]})}var ur={multiSelect:`多选`,checkbox:`复选框`,text:`文本`,multiLineText:`多行文本`,number:`数字`,date:`日期`,formula:`公式`,lookup:`查找引用`},dr=(0,P.lazy)(()=>v(()=>import(`./SheetEditor-BbnchVV9.js`).then(e=>({default:e.default})),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]))),fr=1e3,pr=60,mr=[`名称`,`状态`,`负责人`,`开始日期`];function hr(e){let t=[],n=Math.min(e.getColumnCount(),pr);for(let r=0;r<n;r++){if(Be(e.readCell(0,r)))continue;let n=e.readField(r);t.push({col:r,name:n?.name??`字段${r+1}`,schema:n?.schema??{type:`text`}})}return t}function gr(e,t){let n=[];if(t.length===0)return n;let r=Math.min(e.getRowCount(),fr);for(let i=1;i<r;i++)for(let r of t)if(!Be(e.readCell(i,r.col))){n.push(i);break}return n}function _r(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function vr(e,t){let n=tt.replaceAll(`{{SLUG_ID}}`,_r(e)).replaceAll(`{{TITLE}}`,_r(t));return n.includes(`content="${e}"`)||console.warn(`透视页模板占位符替换异常，新页面可能读不到数据`),n}var yr={contains:`包含`,equals:`等于`,notEquals:`不等于`,gt:`大于`,gte:`大于等于`,lt:`小于`,lte:`小于等于`,empty:`为空`,notEmpty:`不为空`},br=[`number`,`currency`,`rating`,`progress`,`autoNumber`,`date`,`createdTime`,`modifiedTime`],xr=[`text`,`multiLineText`,`number`,`currency`,`phone`,`email`,`url`,`barcode`,`location`,`select`,`multiSelect`];function Sr(e){return br.includes(e)?[`equals`,`notEquals`,`gt`,`gte`,`lt`,`lte`,`empty`,`notEmpty`]:[`contains`,`equals`,`notEquals`,`empty`,`notEmpty`]}function Cr(e,t){let n=Number(e),r=Number(t);return e.length>0&&t.length>0&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t)}var wr=[`#1677ff`,`#2f54eb`,`#722ed1`,`#c41d7f`,`#eb2f96`,`#fa8c16`,`#fadb14`,`#a0d911`,`#52c41a`,`#13c2c2`,`#14a7b8`,`#8c8c8c`],Tr=[{label:`文本`,types:[`text`,`multiLineText`,`url`,`phone`,`email`,`location`,`barcode`,`autoNumber`]},{label:`数字`,types:[`number`,`currency`,`progress`,`rating`]},{label:`日期`,types:[`date`,`createdTime`,`modifiedTime`]},{label:`人员`,types:[`user`,`group`,`createdBy`,`modifiedBy`]},{label:`关联·查找`,types:[`link`,`lookup`,`formula`]}],Er=new Set(Tr.flatMap(e=>e.types)),Dr=new Set([`compact`,`medium`,`loose`]);function Or(e,t,n=`grid`,r=null){return{id:e,name:t,filter:null,sort:null,groupBy:r,color:null,rowHeight:`medium`,footStats:{},fieldOrder:[],frozenCount:0,type:n,cardFields:[]}}function kr(e){if(!Array.isArray(e))return[];let t=[],n=new Set;for(let r of e){let e=Number(r);!Number.isInteger(e)||e<0||n.has(e)||(n.add(e),t.push(e))}return t}function Ar(e,t){if(t.length===0)return e;let n=new Map;t.forEach((e,t)=>{n.has(e)||n.set(e,t)});let r=e.filter(e=>n.has(e.col)).sort((e,t)=>(n.get(e.col)??0)-(n.get(t.col)??0)),i=e.filter(e=>!n.has(e.col));return[...r,...i]}function jr(e){let t=[],n=new Set;if(Array.isArray(e))for(let r of e){if(r==null||typeof r.id!=`string`||r.id.length===0||n.has(r.id))continue;n.add(r.id);let e={};if(r.footStats!=null&&typeof r.footStats==`object`)for(let[t,n]of Object.entries(r.footStats)){let r=Number(t);Number.isFinite(r)&&typeof n==`string`&&(e[r]=n)}let i=kr(r.fieldOrder),a=Number.isFinite(Number(r.frozenCount))?Math.max(0,Math.trunc(Number(r.frozenCount))):0;t.push({id:r.id,name:typeof r.name==`string`&&r.name.length>0?r.name:r.id===`view-0`?`表格`:`视图`,filter:r.filter!=null&&Array.isArray(r.filter.conditions)?r.filter:null,sort:r.sort!=null&&typeof r.sort.col==`number`?r.sort:null,groupBy:typeof r.groupBy==`number`?r.groupBy:null,color:r.color!=null&&Array.isArray(r.color.rules)?r.color:null,rowHeight:typeof r.rowHeight==`string`&&Dr.has(r.rowHeight)?r.rowHeight:`medium`,footStats:e,fieldOrder:i,frozenCount:Math.min(a,i.length),type:r.type===`kanban`?`kanban`:`grid`,cardFields:kr(r.cardFields)})}return n.has(`view-0`)||t.unshift(Or(`view-0`,`表格`)),t}function Mr(){return`view-${Math.random().toString(36).slice(2,10)}`}var Nr=JSON.stringify({v:1,views:[Or(`view-0`,`表格`)]});function Pr(){return(0,$.jsxs)(`svg`,{className:`dt-toolbar__icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.4`,strokeLinecap:`round`,"aria-hidden":`true`,children:[(0,$.jsx)(`path`,{d:`M3.2 2.8v10.4`}),(0,$.jsx)(`path`,{d:`M6.4 4.2h6.8M6.4 8h6.8M6.4 11.8h6.8`})]})}function Fr(){return(0,$.jsxs)(`svg`,{className:`dt-toolbar__icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.3`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,children:[(0,$.jsx)(`rect`,{x:`2.2`,y:`2.6`,width:`11.6`,height:`10.8`,rx:`1.4`}),(0,$.jsx)(`path`,{d:`M2.2 6.1h11.6`}),(0,$.jsx)(`path`,{d:`M4.6 8.6h4.2M4.6 10.8h6.6`})]})}function Ir(){return(0,$.jsxs)(`svg`,{className:`dt-toolbar__icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.3`,strokeLinecap:`round`,strokeLinejoin:`round`,"aria-hidden":`true`,children:[(0,$.jsx)(`path`,{d:`M6.6 1.9L2.5 6a1.1 1.1 0 000 1.6l3.3 3.3a1.1 1.1 0 001.6 0l4.1-4.1a1.1 1.1 0 000-1.6L8.2 1.9a1.1 1.1 0 00-1.6 0z`}),(0,$.jsx)(`path`,{d:`M4.6 6.3h6.3`}),(0,$.jsx)(`path`,{d:`M13.7 9.6c.6.9.9 1.5.9 1.9a.9.9 0 11-1.8 0c0-.4.3-1 .9-1.9z`,fill:`currentColor`,stroke:`none`})]})}function Lr(e,t,n){let r=Ve(e.readCell(t,n.col));if(r.length===0)return``;if(n.schema.type===`select`||n.schema.type===`multiSelect`)return Ve(r.split(`,`).map(e=>n.schema.options?.find(t=>t.id===e.trim())?.name??e.trim()).filter(Boolean).join(`,`));if(n.schema.type===`link`){let e=me(r);return e==null?r:Ve(e.t||`记录 ${e.r}`)}return r}function Rr(e){return e.op===`empty`||e.op===`notEmpty`||!ze(e.value)}function zr(e,t){return e.filter(e=>Rr(e)&&t.some(t=>t.col===e.col))}function Br(e,t){return e!=null&&e.paused!==!0&&zr(e.conditions,t).length>0}function Vr(e,t){return e!=null&&e.paused!==!0&&e.enabled!==!1&&t.some(t=>t.col===e.col)}function Hr(e,t){return e!=null&&e.paused!==!0&&zr(e.rules,t).length>0}function Ur(e,t,n,r){let i=n.find(e=>e.col===r.col);if(i==null)return!1;let a=Lr(e,t,i),o=Ve(r.value);switch(r.op){case`empty`:return a.length===0;case`notEmpty`:return a.length>0;case`contains`:return a.length>0&&o.length>0&&a.toLowerCase().includes(o.toLowerCase());case`equals`:return a.length>0&&a===o;case`notEquals`:return a.length>0&&a!==o;case`gt`:return a.length>0&&o.length>0&&Cr(a,o)>0;case`gte`:return a.length>0&&o.length>0&&Cr(a,o)>=0;case`lt`:return a.length>0&&o.length>0&&Cr(a,o)<0;case`lte`:return a.length>0&&o.length>0&&Cr(a,o)<=0;default:return!1}}function Wr(e,t,n,r){let i=zr(r.conditions,n);return i.length===0?!0:r.conjunction===`and`?i.every(r=>Ur(e,t,n,r)):i.some(r=>Ur(e,t,n,r))}function Gr(e,t,n,r){return n.some(e=>e.col===r.col)?Ur(e,t,n,r):!1}function Kr(e,t){let n=Number(e),r=Number(t);return e.length>0&&t.length>0&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.length===0&&t.length===0?0:e.length===0?1:t.length===0?-1:e.localeCompare(t,`zh-CN`)}var qr={value:`引用值`,sum:`求和`,count:`计数`,avg:`平均值`,max:`最大值`,min:`最小值`},Jr=new Map;function Yr({api:e,row:t,pageId:n,spaceId:r,shareToken:i,userMap:a,membersLoaded:o,canComment:s}){let[c,l]=(0,P.useState)(null);return(0,P.useEffect)(()=>{if(e==null){l(null);return}let n=e.readRecordId(t);l(n??(s?e.ensureRecordId(t):null))},[e,t,s]),c==null?null:(0,$.jsx)(he,{pageId:n,spaceId:r,userMap:a,membersLoaded:o,editable:s,shareToken:i,recordId:c})}function Xr({pageId:e,slugId:t,title:r,initialDataTable:a,initialSheets:l,standalone:d,initialWorkbookData:f,readOnly:m,onStatusChange:h,onAwarenessUsers:_,onContentReady:v,spaceId:x,commentOpen:ee,onToggleComment:te,registerExportExcel:C,registerImportExcel:ie,shareToken:w,userMap:T,membersLoaded:oe=!1,commentable:E=!0,hideTables:ce=!1}){let[O,ue]=(0,P.useState)(null),[k,fe]=(0,P.useState)([]),[A,j]=(0,P.useState)([]),[M,N]=(0,P.useState)([]),[he,F]=(0,P.useState)(0),[_e,ve]=(0,P.useState)(`medium`),[I,L]=(0,P.useState)(null),[R,z]=(0,P.useState)(null),[B,V]=(0,P.useState)(null),[H,U]=(0,P.useState)(null),[W,G]=(0,P.useState)(`grid`),[K,q]=(0,P.useState)([]),[be,xe]=(0,P.useState)({}),Se=T!=null,[Ce,we]=(0,P.useState)(Jr),Te=(0,P.useCallback)(()=>{Se&&g(e,w).then(e=>{let t=new Map;for(let n of e){let e=ae(n.comment.anchor);e!=null&&t.set(e,(t.get(e)??0)+1+n.replies.length)}we(t)}).catch(()=>{})},[Se,e,w]);(0,P.useEffect)(()=>{Te()},[Te]),(0,P.useEffect)(()=>{if(Se)return window.addEventListener(`repo:comment-synced`,Te),window.addEventListener(`repo:comment-reload-record`,Te),window.addEventListener(`repo:comment-reload`,Te),()=>{window.removeEventListener(`repo:comment-synced`,Te),window.removeEventListener(`repo:comment-reload-record`,Te),window.removeEventListener(`repo:comment-reload`,Te)}},[Se,Te]);let Ee=(0,P.useMemo)(()=>{let e=new Map;if(O==null||Ce.size===0)return e;for(let t of A){let n=O.readRecordId(t);if(n==null)continue;let r=Ce.get(n);r!=null&&r>0&&e.set(t,r)}return e},[O,A,Ce,he]),De=(0,P.useCallback)(e=>Ee.get(e)??0,[Ee]),Oe=(0,P.useMemo)(()=>{if(!Se)return;let t=m!==!0&&E;return{countOf:De,canComment:t,renderPanel:n=>(0,$.jsx)(Yr,{api:O,row:n,pageId:e,spaceId:x,shareToken:w,userMap:T,membersLoaded:oe,canComment:t})}},[Se,De,m,E,O,e,x,w,T,oe]),[ke,Ae]=(0,P.useState)([]),[je,Me]=(0,P.useState)(0),[Ne,Pe]=(0,P.useState)(0),[J,Fe]=(0,P.useState)(()=>[Or(`view-0`,`表格`)]),[Le,Re]=(0,P.useState)(`view-0`),Y=(0,P.useRef)(`view-0`);Y.current=Le;let[ze,He]=(0,P.useState)([]),[Ue,We]=(0,P.useState)(null),[Ge,Ke]=(0,P.useState)(!1),[qe,Je]=(0,P.useState)(null),[Xe,Ze]=(0,P.useState)(null),tt=(0,P.useRef)(!1),[X,nt]=(0,P.useState)(null),[rt,it]=(0,P.useState)(null),[at,ot]=(0,P.useState)([]),[st,ct]=(0,P.useState)(0),lt=y(),[ut,Z]=(0,P.useState)(null),[dt,ft]=(0,P.useState)(null),[pt,mt]=(0,P.useState)(null),ht=(0,P.useRef)(null),gt=(0,P.useRef)(null),_t=(0,P.useRef)(null),vt=(0,P.useRef)(a),yt=(0,P.useRef)(!1),bt=(0,P.useRef)(``);(0,P.useEffect)(()=>{let e=!1;return o(!0).then(t=>{if(e)return;let n=t.nickName||t.userName||``;bt.current=n}).catch(()=>{}),()=>{e=!0}},[]);let xt=(0,P.useCallback)(e=>{try{let t=hr(e);fe(t),j(gr(e,t));let n=e.listTables();He(n);let r=e.getActiveTableId();We(r!=null&&n.some(e=>e.id===r)?r:n[0]?.id??null)}catch(e){console.warn(`[datatable] 刷新字段失败`,e)}},[]);(0,P.useEffect)(()=>{N(e=>e.some(e=>A.includes(e))?e.filter(e=>!A.includes(e)):e)},[A]);let St=(0,P.useCallback)(e=>ue(e),[]),Q=(0,P.useCallback)(()=>F(e=>e+1),[]),Ct=(0,P.useRef)(!1),wt=(0,P.useRef)(null),Tt=(0,P.useRef)(null),Et=(0,P.useRef)(null),Dt=(0,P.useRef)(0),Ot=(0,P.useCallback)(e=>{L(e.filter!=null&&Array.isArray(e.filter.conditions)?e.filter:null),z(e.sort!=null&&typeof e.sort.col==`number`?e.sort:null),V(typeof e.groupBy==`number`?e.groupBy:null),U(e.color!=null&&Array.isArray(e.color.rules)?e.color:null),ve(typeof e.rowHeight==`string`&&Dr.has(e.rowHeight)?e.rowHeight:`medium`),xe(e.footStats??{}),Ae(kr(e.fieldOrder)),Me(Number.isFinite(Number(e.frozenCount))?Math.max(0,Math.trunc(Number(e.frozenCount))):0),G(e.type===`kanban`?`kanban`:`grid`),q(kr(e.cardFields))},[]),kt=(0,P.useCallback)(()=>{Ct.current=!1,wt.current=null,Tt.current=null,Et.current=null;let e=Or(`view-0`,`表格`);Fe([e]),Re(`view-0`),Y.current=`view-0`,Ot(e),N([])},[Ot]);(0,P.useEffect)(()=>{if(O!=null){let e=O.listTables(),t=O.getActiveTableId();e.length>0&&(t==null||!e.some(e=>e.id===t))&&(O.setActiveTable(e[0].id),kt()),xt(O)}else fe([]),j([]),N([]),He([]),We(null)},[O,he,xt,kt]);let At=(0,P.useCallback)(e=>{let t=Y.current;return e.map(e=>e.id===t?{...e,filter:I,sort:R,groupBy:B,color:H,rowHeight:_e,footStats:be,fieldOrder:ke,frozenCount:je,type:W,cardFields:K}:e)},[I,R,B,H,_e,be,ke,je,W,K]),jt=(0,P.useCallback)(()=>{let e={v:1,views:At(J)};return JSON.stringify(e)},[J,At]);(0,P.useEffect)(()=>{if(O==null)return;let t=O.getActiveTableId(),n=O.readViewMeta();if(n==null){Ct.current||(Ct.current=!0,wt.current=t,Tt.current=Nr);return}let r=Et.current;if(r!=null){if(n===r)Et.current=null;else if(Date.now()-Dt.current<4e3)return;else Et.current=null}if(n===Tt.current)return;Tt.current=n;let i=!Ct.current;Ct.current=!0,wt.current=t;try{let r=jr(JSON.parse(n)?.views);Fe(r);let a=i?Qe(e,t):null,o=a!=null&&r.some(e=>e.id===a)?a:r.some(e=>e.id===Y.current)?Y.current:r[0].id;Re(o),Y.current=o;let s=r.find(e=>e.id===o);s!=null&&Ot(s)}catch(e){console.warn(`[datatable] 视图配置解析失败，保持本地状态`,e)}},[O,he,Ot]),(0,P.useEffect)(()=>{Ue!=null&&Ue!==``&&wt.current===Ue&&$e(e,Ue,Le)},[Le,Ue,e]),(0,P.useEffect)(()=>{if(O==null||m===!0||!Ct.current)return;let e=jt();if(e===Tt.current)return;Et.current=e,Dt.current=Date.now();let t=!1,n=window.setTimeout(()=>{if(t=!0,e===Tt.current){Et.current=null;return}Tt.current=e,O.writeViewMeta(e)||(Et.current=null)},350);return()=>{window.clearTimeout(n),!t&&Et.current===e&&(Et.current=null)}},[O,m,jt]),(0,P.useEffect)(()=>{if(O==null||k.length===0)return;let e=k.find(e=>e.schema.type===`select`)??k.find(e=>e.schema.type===`user`);if(e==null)return;let t=J.filter(e=>e.type===`kanban`&&!(typeof e.groupBy==`number`&&k.some(t=>t.col===e.groupBy&&de(t.schema.type))));t.length!==0&&(console.info(`[datatable] 看板分列字段失效，已自愈为`,e.name),Fe(J.map(n=>t.some(e=>e.id===n.id)?{...n,groupBy:e.col}:n)),t.some(e=>e.id===Y.current)&&V(e.col))},[O,k,J]);let Mt=e=>{if(e===Le)return;let t=At(J),n=t.find(t=>t.id===e);n!=null&&(Fe(t),Re(e),Y.current=e,Ot(n))},Nt=()=>(k.find(e=>e.schema.type===`select`)??k.find(e=>e.schema.type===`user`))?.col??null,Pt=(e=`grid`)=>{if(m)return;let t=At(J),n=e===`kanban`?`看板`:`视图`,r=1;for(;t.some(e=>e.name===`${n}${r}`);)r+=1;let i=Or(Mr(),`${n}${r}`,e,e===`kanban`?Nt():null);Fe([...t,i]),Re(i.id),Y.current=i.id,Ot(i)},Ft=(e,t)=>{if(m)return;let n=At(J),r=n.find(t=>t.id===e);if(r==null||(r.type??`grid`)===t)return;let i={...r,type:t};t===`kanban`&&typeof i.groupBy!=`number`&&(i.groupBy=Nt()),Fe(n.map(t=>t.id===e?i:t)),e===Y.current&&(G(t),t===`kanban`&&typeof i.groupBy==`number`&&V(i.groupBy))},It=e=>{let t=Rn.current.filter(e=>e.col!==B).map(e=>e.col),n=K.length>0?K.filter(e=>t.includes(e)):t,r=n.includes(e)?n.filter(t=>t!==e):t.filter(t=>t===e||n.includes(t));if(r.length===0){S(`至少保留一个显示字段`);return}q(r.length===t.length?[]:r)},Lt=async e=>{if(m)return;let t=J.find(t=>t.id===e);if(t==null)return;let n=await re({title:`重命名视图`,initialValue:t.name,placeholder:`请输入视图名称`,validate:t=>{let n=t.trim();return n===``?`名称不能为空`:n.length>31?`名称不能超过 31 个字符`:J.some(t=>t.id!==e&&t.name===n)?`已存在同名视图`:null}});n!=null&&Fe(At(J).map(t=>t.id===e?{...t,name:n.trim()}:t))},Rt=async e=>{if(m||e===`view-0`)return;let t=J.find(t=>t.id===e);if(t==null||!await ne({title:`删除视图`,description:`确定删除视图「${t.name}」吗？仅删除视图配置，表格数据不受影响。`,confirmText:`删除`,danger:!0}))return;let n=At(J).filter(t=>t.id!==e);if(Fe(n),Le===e){let e=n[0];Re(e.id),Y.current=e.id,Ot(e)}},zt=e=>{O!=null&&e!==Ue&&O.setActiveTable(e)&&(kt(),Q())},Bt=()=>{if(O==null||m)return;let e=1;for(;ze.some(t=>t.name===`数据表 ${e}`);)e+=1;let t=O.addTable(`数据表 ${e}`);if(t==null){S(`新建数据表失败`,`error`);return}O.setActiveTable(t),D().forEach((e,t)=>{O.writeField(t,mr[t]??`字段${t+1}`,e)}),kt(),Q()};(0,P.useEffect)(()=>{if(x==null){ot([]);return}let t=!1,n=0,r=0,a=()=>{i(x,!0).then(n=>{if(t)return;let r=[],i=t=>{for(let n of t){let t=n.page;t.parentId===e&&t.pageType!==`folder`&&r.push({slugId:t.slugId,title:t.title,kind:t.sourceExt===`html`?`html`:t.pageType===`datatable`||t.pageType===`sheet`?`table`:`doc`}),n.children!=null&&n.children.length>0&&i(n.children)}};i(n),ot(r)}).catch(e=>{if(t)return;let i=e?.code;if(i===`4010`||i===`4011`){ot([]);return}if(n+=1,n<=2){r=window.setTimeout(a,n*2e3);return}ot([])})};return a(),()=>{t=!0,window.clearTimeout(r)}},[x,e,st]),(0,P.useEffect)(()=>{let e=e=>{let t=e.detail?.spaceId;t!=null&&t===x&&ct(e=>e+1)};return window.addEventListener(`repo:tree-changed`,e),window.addEventListener(`repo:tree-remote-changed`,e),()=>{window.removeEventListener(`repo:tree-changed`,e),window.removeEventListener(`repo:tree-remote-changed`,e)}},[x]);let Vt=async n=>{if(x==null){S(`缺少空间上下文，无法创建`,`error`);return}try{let r=n===`html`,i=r?`未命名页面`:`未命名文档`,a=await p(x,i,e,`doc`,r?`html`:null);if(window.dispatchEvent(new CustomEvent(`repo:tree-changed`,{detail:{spaceId:x}})),window.dispatchEvent(new CustomEvent(`repo:sheet-flush`)),r){let e=vr(t,i);b(a.slugId,e),u(a.id,e,`{}`).catch(e=>console.warn(`透视页初始快照写入失败`,e)),lt(`/doc/${a.slugId}`,{state:{importHtmlRaw:e}})}else lt(`/doc/${a.slugId}`)}catch(e){S(`创建失败：${e instanceof Error?e.message:e}`,`error`)}},Ht=e=>{Je(null),nt(null);let t=n(e.getBoundingClientRect());it({x:c(t.right-148,164,`x`),y:c(t.bottom+4,132,`y`)})},Ut=(e,t)=>{if(O==null||m)return!1;let n=t.trim();return n===``||n.length>31||ze.some(t=>t.id!==e&&t.name===n)?!1:n===ze.find(t=>t.id===e)?.name?!0:O.renameTable(e,n)?(Q(),!0):(S(`重命名失败`,`error`),!1)},Wt=async(e,t)=>{let n=await re({title:`重命名数据表`,initialValue:t,placeholder:`请输入数据表名称`,validate:t=>{let n=t.trim();return n===``?`名称不能为空`:n.length>31?`名称不能超过 31 个字符`:ze.some(t=>t.id!==e&&t.name===n)?`已存在同名数据表`:null}});n!=null&&Ut(e,n)},Gt=async(t,n)=>{if(!(O==null||m)){if(ze.length<=1){S(`至少需要保留一个数据表`);return}if(await ne({title:`删除数据表`,description:`确定删除「${n}」吗？表内全部记录将一并删除。`,confirmText:`删除`,danger:!0})){if(!O.removeTable(t)){S(`删除失败`,`error`);return}et(e,t),t===Ue&&kt(),Q()}}};(0,P.useEffect)(()=>{if(qe==null&&X==null&&rt==null&&dt==null)return;let e=e=>{let t=e.target;(t==null||t.closest(`.dt-mini-menu`)==null&&t.closest(`.dt-mini`)==null&&t.closest(`.dt-tables__plus`)==null&&t.closest(`.dt-views__add`)==null)&&(Je(null),nt(null),it(null),ft(null))};return window.addEventListener(`mousedown`,e),()=>window.removeEventListener(`mousedown`,e)},[qe,X,rt,dt]);let Kt=e=>{mt(null),Z(t=>t===e?null:e)},qt=()=>({conjunction:`and`,conditions:[],enabled:!1}),Jt=(e,t)=>{L(n=>{let r=n??qt();return{...r,conditions:r.conditions.map((n,r)=>r===e?{...n,...t}:n)}})},Yt=()=>{k.length!==0&&L(e=>{let t=e??qt();return{...t,conditions:[...t.conditions,{col:k[0].col,op:`contains`,value:``}]}})},Xt=e=>{L(t=>{if(t==null)return null;let n=t.conditions.filter((t,n)=>n!==e);return n.length===0?null:{...t,conditions:n}})},Zt=()=>({rules:[],enabled:!1}),Qt=(e,t)=>{U(n=>{let r=n??Zt();return{...r,rules:r.rules.map((n,r)=>r===e?{...n,...t}:n)}})},$t=()=>{k.length!==0&&U(e=>{let t=e??Zt(),n=wr[t.rules.length%wr.length];return{...t,rules:[...t.rules,{col:k[0].col,op:`equals`,value:``,color:n}]}})},en=e=>{U(t=>{if(t==null)return null;let n=t.rules.filter((t,n)=>n!==e);return n.length===0?null:{...t,rules:n}})};(0,P.useEffect)(()=>{if(!(O==null||!vt.current||yt.current)&&!(k.length>0)){yt.current=!0;try{let e=O.getActiveTableId();e!=null&&O.renameTable(e,`数据表 1`);let t=D(),n=!1;if(t.forEach((e,t)=>{O.writeField(t,mr[t]??`字段${t+1}`,e)||(n=!0)}),n){yt.current=!1;return}xt(O)}catch(e){yt.current=!1,console.warn(`[datatable] 播种默认字段失败`,e)}}},[O,k.length,xt]);let tn=e=>{if(O==null||m)return;let t=k.reduce((e,t)=>Math.max(e,t.col),-1)+1;if(t>=pr){S(`字段列已达上限 ${pr} 列`,`warn`);return}if(O.writeField(t,`字段${t+1}`,{type:`text`}),e!=null&&e>=0){let n=Rn.current.map(e=>e.col);n.splice(Math.min(e,n.length),0,t),Ae(n)}xt(O)},nn=e=>{if(O==null||m)return;O.writeField(e,``,{type:`text`});let t=Math.min(O.getRowCount(),fr);for(let n=1;n<t;n++)O.writeCell(n,e,``);Ae(t=>t.filter(t=>t!==e)),xt(O)},rn=(0,P.useRef)(new Map),an=(e,t)=>{if(O==null)return;let n=O.readField(t.col),r=n!=null&&n.schema.type===`autoNumber`?n.schema:t.schema,i=r.seq??0,a=Math.max(i,rn.current.get(t.col)??0)+1;O.writeCell(e,t.col,`${r.prefix??``}${a}`),rn.current.set(t.col,a),O.writeField(t.col,n?.name??t.name,{...r,seq:a})},on=e=>{if(O==null||e<1)return;let t=le();for(let n of k){let r=n.schema.type;r===`createdTime`?O.writeCell(e,n.col,t):r===`createdBy`?bt.current.length>0&&O.writeCell(e,n.col,bt.current):r===`autoNumber`&&an(e,n)}},sn=e=>{if(O==null||e<1)return;let t=le();for(let n of k){let r=n.schema.type;if(r===`modifiedTime`)O.writeCell(e,n.col,t);else if(r===`modifiedBy`)bt.current.length>0&&O.writeCell(e,n.col,bt.current);else if(r===`createdTime`||r===`createdBy`){let i=O.readCell(e,n.col);if(i==null||String(i).length===0){let i=r===`createdTime`?t:bt.current;i.length>0&&O.writeCell(e,n.col,i)}}else if(r===`autoNumber`){let t=O.readCell(e,n.col);(t==null||String(t).length===0)&&an(e,n)}}},cn=(e,t=!0)=>{if(O==null||e<1||!Br(I,k))return!0;let n=I,r=zr(n.conditions,k),i=n.conjunction===`and`?r:r.slice(0,1);for(let t of i){if(t.op!==`equals`&&t.op!==`contains`)continue;let n=k.find(e=>e.col===t.col);if(n==null)continue;let i=n.schema.type;if(!xr.includes(i))continue;let a=Ve(t.value);if(a.length===0||r.some(e=>e.col===t.col&&e.op===`empty`))continue;let o=a;if(i===`select`||i===`multiSelect`){let e=n.schema.options?.find(e=>e.name===a);if(e==null)continue;o=e.id}try{O.writeCell(e,t.col,o)}catch(e){console.warn(`[datatable] 新记录按筛选预填失败`,e)}}let a=Wr(O,e,k,n);return!a&&t&&S(`当前筛选条件下这条新记录不满足显示条件，已隐藏；调整或清除筛选后可见`,`info`),a},ln=()=>{if(O==null||m)return-1;let e=O.appendRecord();if(e<0)return-1;let t=new Set([...A,...M]);return t.has(e)&&(e=Math.max(...t)+1),on(e),cn(e),N(t=>t.includes(e)?t:[...t,e]),e},un=(e,t,n)=>{if(O==null||m)return;let r=Ln.find(e=>e.col===t);if(r!=null){let e=Ye(r.schema,n);if(e!=null){S(`${r.name}：${e}`,`error`);return}}O.writeCell(e,t,n)&&(sn(e),Q())},dn=e=>{if(O==null||m||B==null)return;let t=ln();t<0||(e.length>0&&(O.writeCell(t,B,e),sn(t)),Q())},fn=async e=>{if(O==null||m||e<1)return;let t=await re({title:`插入记录`,initialValue:`1`,placeholder:`请输入插入的行数`,validate:e=>{let t=e.trim();if(t===``)return`请输入行数`;if(!/^\d+$/.test(t))return`请输入正整数`;let n=Number(t);return n<1?`行数不能小于 1`:n>500?`一次最多插入 500 行`:null}});if(t==null)return;let n=Number(t.trim());if(!Number.isFinite(n)||n<1)return;for(let t=0;t<n;t++)if(!O.insertRecordAt(e+t))return;N(t=>{let r=t.map(t=>t>=e?t+n:t),i=[];for(let t=0;t<n;t++)i.push(e+t);return[...r,...i]});let r=0;for(let t=0;t<n;t++)on(e+t),cn(e+t,!1)||(r+=1);r>0&&S(`当前筛选条件下有 ${r} 条新记录不满足显示条件，已隐藏；调整或清除筛选后可见`,`info`),Q()},pn=e=>{O==null||m||e<1||O.removeRecordAt(e)&&(N(t=>t.filter(t=>t!==e).map(t=>t>e?t-1:t)),Q())},mn=(e,t)=>{O==null||m||e<1||t<1||e===t||O.moveRow(e,t)&&(N(n=>n.map(n=>n===e?t:e<t?n>e&&n<=t?n-1:n:n>=t&&n<e?n+1:n)),Q())},hn=(e,t,n)=>{if(O==null)return;let r=le(),i=O.readField(e),a=i!=null&&i.hasSchema?i.schema:n,o=Math.max(a.seq??0,rn.current.get(e)??0),s=Math.min(O.getRowCount(),fr);for(let t=1;t<s;t++){let i=O.readCell(t,e);if(i!=null&&String(i).length>0)continue;let s=!1;for(let n of k){if(n.col===e)continue;let r=O.readCell(t,n.col);if(r!=null&&String(r).length>0){s=!0;break}}s&&(n.type===`createdTime`||n.type===`modifiedTime`?O.writeCell(t,e,r):n.type===`createdBy`||n.type===`modifiedBy`?bt.current.length>0&&O.writeCell(t,e,bt.current):n.type===`autoNumber`&&(o+=1,O.writeCell(t,e,`${a.prefix??``}${o}`)))}n.type===`autoNumber`&&(rn.current.set(e,Math.max(o,rn.current.get(e)??0)),o!==(a.seq??0)&&O.writeField(e,t,{...a,seq:o}))},gn=(e,t,n)=>{if(O==null)return{done:0,kept:0,odd:0};let r=0,i=0,a=0,o=Math.min(O.getRowCount(),fr);for(let s=1;s<o;s++){let o=O.readCell(s,e);if(Be(o))continue;let c=String(o).trim();if(c.startsWith(n)&&/^\d+$/.test(c.slice(n.length)))continue;let l=/^(.*?)(\d+)$/.exec(c);if(l==null){i+=1;continue}l[1]!==t&&(a+=1),O.writeCell(s,e,`${n}${l[2]}`),r+=1}return{done:r,kept:i,odd:a}},_n=(e,t,n)=>{if(O==null||m)return;let r=t.trim()||`字段${e+1}`,i=O.readField(e),a=i!=null&&i.hasSchema&&i.schema.type===`autoNumber`?i.schema.prefix??``:null,o=n;if(n.type===`autoNumber`){let t=i,r=Math.max(t!=null&&t.hasSchema?t.schema.seq??0:0,rn.current.get(e)??0,n.seq??0);o={...n,seq:r}}if(O.writeField(e,r,o),o.type===`autoNumber`&&a!=null){let t=o.prefix??``;if(t!==a){let{done:n,kept:r,odd:i}=gn(e,a,t);if(n>0||r>0){let e=[`已按新前缀重写 ${n} 个编号`];i>0&&e.push(`${i} 个原前缀与配置不符已一并纠正`),r>0&&e.push(`${r} 个非编号格式保留原值`),S(e.join(`，`),r>0?`info`:`success`)}}}(pe.includes(o.type)||se.includes(o.type))&&hn(e,r,o),xt(O)},vn=e=>{let t=ht.current?.querySelector(`[data-field-col="${e}"]`),n=ht.current?.getBoundingClientRect(),r=120;if(t!=null&&n!=null){let e=t.getBoundingClientRect();r=Math.max(8,Math.min(e.left-n.left,n.width-330))}mt({col:e,left:r}),Z(null)},yn=pt==null?void 0:k.find(e=>e.col===pt.col);(0,P.useEffect)(()=>{if(pt==null&&ut==null)return;let e=e=>{let t=e.target;gt.current?.contains(t)!==!0&&_t.current?.contains(t)!==!0&&ht.current?.querySelector(`[data-field-col]`)?.contains(t)!==!0&&(mt(null),Z(null))};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[pt,ut]);let[bn,xn]=(0,P.useState)(new Map),[Sn,Cn]=(0,P.useState)(new Map),[wn,Tn]=(0,P.useState)(0),En=(0,P.useMemo)(()=>{let e=new Set;for(let t of k){let n=t.schema.linkTable?.slugId;t.schema.type===`link`&&n!=null&&n.length>0&&e.add(n)}return[...e].sort().join(`,`)},[k]);(0,P.useEffect)(()=>{let e=()=>Tn(e=>e+1);return window.addEventListener(`focus`,e),()=>window.removeEventListener(`focus`,e)},[]),(0,P.useEffect)(()=>{if(En.length===0){Cn(e=>e.size===0?e:new Map);return}let e=!1;return(async()=>{let t=new Map;for(let e of En.split(`,`))try{t.set(e,await Ie(e,w))}catch(t){console.warn(`[datatable] 读取关联目标表失败`,e,t)}e||Cn(t)})(),()=>{e=!0}},[En,w,wn]),(0,P.useEffect)(()=>{if(O==null)return;let e=k.filter(e=>e.schema.type===`formula`),t=k.filter(e=>e.schema.type===`lookup`);if(e.length===0&&t.length===0){xn(e=>e.size===0?e:new Map);return}let n=new Map;for(let r of A){for(let t of e){let e=(t.schema.formula??``).trim();e.length!==0&&n.set(`${r}:${t.col}`,ye(e,e=>{let t=k.find(t=>t.name===e);return t==null?void 0:O.readCell(r,t.col)??null}))}for(let e of t){let t=e.schema;if(t.lookupLink==null||t.lookupCol==null)continue;let i=me(O.readCell(r,t.lookupLink));if(i==null)continue;let a=(Sn.get(i.s)?.records.find(e=>e.row===i.r))?.values[t.lookupCol]??``,o=t.lookupAgg??`value`;if(o===`value`)n.set(`${r}:${e.col}`,a);else if(o===`count`)n.set(`${r}:${e.col}`,+(a.length>0));else{let t=Number(a);n.set(`${r}:${e.col}`,a.length>0&&!Number.isNaN(t)?t:0)}}}if(xn(n),m!==!0&&d!==!0)try{n.forEach((e,t)=>{let[n,r]=t.split(`:`).map(Number),i=O.readCell(n,r);(i==null?``:String(i))!==(e==null?``:String(e))&&O.writeCell(n,r,e)})}catch(e){console.warn(`[datatable] 计算值回写失败`,e)}},[O,k,A,Sn,m,d,he]);let Dn=(0,P.useMemo)(()=>M.filter(e=>!A.includes(e)),[M,A]),On=(0,P.useMemo)(()=>{if(O==null)return[];let e=[...A,...Dn];if(Br(I,k)){let t=I;e=e.filter(e=>Wr(O,e,k,t))}if(Vr(R,k)){let t=R,n=k.find(e=>e.col===t.col);if(n!=null){let r=t.dir===`asc`?1:-1;return e.sort((e,t)=>{let i=Lr(O,e,n),a=Lr(O,t,n),o=i.length===0,s=a.length===0;return o||s?o===s?e-t:o?1:-1:r*Kr(i,a)}),e}}return e.sort((e,t)=>e-t)},[O,A,k,I,R,he,Dn]),kn=(0,P.useMemo)(()=>{if(B==null||O==null)return null;let e=k.find(e=>e.col===B);if(e==null)return null;let t=e.schema.type===`select`||e.schema.type===`multiSelect`,n=[],r=new Map;for(let i of On){let a=Lr(O,i,e),o=a.length===0?`未分组`:a,s;if(t&&a.length>0){let t=O.readCell(i,e.col),n=String(t??``).split(`,`)[0].trim();s=e.schema.options?.find(e=>e.id===n)?.color}r.has(o)||(r.set(o,{key:o,label:o,color:s,rows:[]}),n.push(o)),r.get(o).rows.push(i)}return n.map((e,t)=>({...r.get(e),key:`${e}#${t}`}))},[B,O,k,On]),An=(0,P.useMemo)(()=>{let e=new Map;if(O==null||!Hr(H,k))return e;let t=zr(H.rules,k);for(let n of On)for(let r of t)if(Gr(O,n,k,r)){e.set(`${n}:${r.col}`,r.color);break}return e},[H,O,k,On]),jn=Br(I,k),Mn=I!=null&&I.conditions.length>0,Nn=Vr(R,k),Pn=Hr(H,k),Fn=(H?.rules.length??0)>0,In=!m&&!jn&&!Nn&&B==null,Ln=(0,P.useMemo)(()=>Ar(k,ke).map(e=>({col:e.col,name:e.name,schema:e.schema})),[k,ke]),Rn=(0,P.useRef)(Ln);Rn.current=Ln;let zn=(0,P.useMemo)(()=>B==null?null:Ln.find(e=>e.col===B)??null,[Ln,B]);return(0,$.jsxs)(`div`,{className:`datatable-editor`,ref:ht,children:[(0,$.jsxs)(`div`,{className:`dt-body`,children:[!ce&&!Ge&&!(m&&ze.length<=1)&&(0,$.jsxs)(`aside`,{className:`dt-tables`,children:[(0,$.jsxs)(`div`,{className:`dt-tables__head`,children:[(0,$.jsx)(`span`,{className:`dt-tables__title`,children:`数据表`}),(0,$.jsxs)(`div`,{className:`dt-tables__actions`,children:[!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-tables__plus`,title:`新建`,onClick:e=>Ht(e.currentTarget),children:`＋`}),(0,$.jsx)(`button`,{type:`button`,className:`dt-tables__collapse`,title:`收起数据表列表`,onClick:()=>Ke(!0),children:`»`})]})]}),(0,$.jsxs)(`div`,{className:`dt-tables__list`,children:[ze.map(e=>(0,$.jsxs)(`div`,{className:`dt-tables__row${e.id===Ue?` dt-tables__row--on`:``}`,onClick:()=>zt(e.id),children:[(0,$.jsx)(`span`,{className:`dt-tables__icon`,"aria-hidden":`true`,children:`▦`}),Xe===e.id?(0,$.jsx)(`input`,{className:`dt-tables__name-input`,defaultValue:e.name,autoFocus:!0,onFocus:e=>e.currentTarget.select(),onClick:e=>e.stopPropagation(),onKeyDown:e=>{e.key===`Enter`?e.currentTarget.blur():e.key===`Escape`&&(tt.current=!0,e.currentTarget.blur())},onBlur:t=>{let n=tt.current;tt.current=!1,n||Ut(e.id,t.currentTarget.value),Ze(null)}}):(0,$.jsx)(`span`,{className:`dt-tables__name`,title:m?void 0:`双击重命名`,onDoubleClick:()=>{m||Ze(e.id)},children:e.name}),!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-mini`,title:`数据表选项`,onClick:t=>{t.stopPropagation();let r=n(t.currentTarget.getBoundingClientRect());nt(null),Je({id:e.id,name:e.name,x:c(r.right+4,160,`x`),y:c(r.bottom+4,96,`y`)})},children:`⋮`})]},e.id)),at.length>0&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(`div`,{className:`dt-tables__subhead`,children:`文档`}),at.map(e=>(0,$.jsxs)(`div`,{className:`dt-tables__row dt-tables__row--child`,title:e.title,onClick:()=>lt(`/doc/${e.slugId}`),children:[(0,$.jsx)(`span`,{className:`dt-tables__icon`,"aria-hidden":`true`,children:e.kind===`html`?`🌐`:e.kind===`table`?`▦`:`📄`}),(0,$.jsx)(`span`,{className:`dt-tables__name`,children:e.title})]},e.slugId))]})]}),!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-tables__add`,onClick:Bt,children:`＋ 新建数据表`})]}),(0,$.jsxs)(`div`,{className:`dt-main`,children:[!(m&&J.length<=1&&!Ge)&&(0,$.jsxs)(`div`,{className:`dt-views`,children:[Ge&&!ce&&(0,$.jsx)(`button`,{type:`button`,className:`dt-views__expand`,title:`展开数据表列表`,onClick:()=>Ke(!1),children:`▦`}),(0,$.jsxs)(`div`,{className:`dt-views__tabs`,children:[J.map(e=>(0,$.jsxs)(`div`,{className:`dt-views__tab${e.id===Le?` dt-views__tab--on`:``}`,onClick:()=>Mt(e.id),children:[(0,$.jsx)(`span`,{className:`dt-views__tabname`,children:e.name}),!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-mini`,title:`视图选项`,onClick:t=>{t.stopPropagation();let r=n(t.currentTarget.getBoundingClientRect());Je(null),nt({id:e.id,x:c(r.left,160,`x`),y:c(r.bottom+4,96,`y`)})},children:`⋮`})]},e.id)),!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-views__add`,title:`新建视图`,onClick:e=>{let t=n(e.currentTarget.getBoundingClientRect());ft({x:c(t.left,176,`x`),y:c(t.bottom+4,96,`y`)})},children:`＋`})]})]}),!m&&(0,$.jsxs)(`div`,{className:`dt-toolbar`,ref:_t,children:[(0,$.jsxs)(`div`,{className:`dt-toolbar__left`,children:[!m&&(0,$.jsx)(`button`,{type:`button`,className:`dt-toolbar__btn dt-toolbar__btn--primary`,onClick:ln,children:`＋ 添加记录`}),!m&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`button`,{type:`button`,className:`dt-toolbar__btn${jn?` dt-toolbar__btn--active`:``}${Mn&&!jn?` dt-toolbar__btn--paused`:``}`,onClick:()=>Kt(`filter`),title:Mn&&!jn?`筛选已停用（条件仍保留）`:void 0,children:[`⧩ 筛选`,Mn?` · ${I?.conditions.length??0}`:``]}),(0,$.jsx)(`button`,{type:`button`,className:`dt-toolbar__btn${Nn?` dt-toolbar__btn--active`:``}${R!=null&&!Nn?` dt-toolbar__btn--paused`:``}`,onClick:()=>Kt(`sort`),title:R!=null&&!Nn?`排序已停用（配置仍保留）`:void 0,children:`↕ 排序`}),(0,$.jsxs)(`button`,{type:`button`,className:`dt-toolbar__btn${B==null?``:` dt-toolbar__btn--active`}`,onClick:()=>Kt(`group`),title:W===`kanban`?`看板按此字段分列（支持单选/人员）`:void 0,children:[(0,$.jsx)(Pr,{}),` 分组`]}),(0,$.jsxs)(`button`,{type:`button`,className:`dt-toolbar__btn${Pn?` dt-toolbar__btn--active`:``}${Fn&&!Pn?` dt-toolbar__btn--paused`:``}`,onClick:()=>Kt(`color`),title:Fn&&!Pn?`填色已停用（规则仍保留）`:void 0,children:[(0,$.jsx)(Ir,{}),` 填色`,Fn?` · ${H?.rules.length??0}`:``]}),W===`kanban`?(0,$.jsxs)(`button`,{type:`button`,className:`dt-toolbar__btn${K.length>0?` dt-toolbar__btn--active`:``}`,onClick:()=>Kt(`cardfields`),title:`勾选卡片上显示的字段`,children:[(0,$.jsx)(Fr,{}),` 卡片字段`]}):(0,$.jsx)(`button`,{type:`button`,className:`dt-toolbar__btn`,onClick:()=>Kt(`rowheight`),children:`≡ 行高`})]})]}),(0,$.jsx)(`div`,{className:`dt-toolbar__right`,children:(0,$.jsxs)(`span`,{className:`dt-toolbar__count`,children:[k.length,` 个字段 · `,jn?`${On.length} / ${A.length+Dn.length} 条记录`:`${A.length+Dn.length} 条记录`]})}),ut===`filter`&&(0,$.jsxs)(`div`,{className:`dt-pop dt-pop--filter`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:`筛选`}),k.length===0?(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂无字段`}):(0,$.jsxs)($.Fragment,{children:[I!=null&&I.conditions.length>1&&(0,$.jsx)(`div`,{className:`dt-pop__conj`,children:(0,$.jsxs)(`select`,{className:`dt-pop__select`,value:I.conjunction,onChange:e=>L(t=>t==null?t:{...t,conjunction:e.target.value}),children:[(0,$.jsx)(`option`,{value:`and`,children:`满足所有条件（且）`}),(0,$.jsx)(`option`,{value:`or`,children:`满足任一条件（或）`})]})}),I?.conditions.map((e,t)=>(0,$.jsxs)(`div`,{className:`dt-pop__row`,children:[(0,$.jsx)(`select`,{className:`dt-pop__select`,value:e.col,onChange:n=>{let r=Number(n.target.value),i=Sr(k.find(e=>e.col===r)?.schema.type??`text`);Jt(t,{col:r,op:i.includes(e.op)?e.op:i[0]})},children:k.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))}),(0,$.jsx)(`select`,{className:`dt-pop__select`,value:e.op,onChange:e=>Jt(t,{op:e.target.value}),children:Sr(k.find(t=>t.col===e.col)?.schema.type??`text`).map(e=>(0,$.jsx)(`option`,{value:e,children:yr[e]},e))}),e.op!==`empty`&&e.op!==`notEmpty`&&(0,$.jsx)(`input`,{className:`dt-pop__input`,placeholder:`值`,value:e.value,onChange:e=>Jt(t,{value:e.target.value})}),(0,$.jsx)(`button`,{type:`button`,className:`dt-pop__condel`,title:`删除条件`,onClick:()=>Xt(t),children:`×`})]},t)),(I?.conditions.length??0)===0&&(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂无筛选条件`}),(0,$.jsx)(`button`,{type:`button`,className:`dt-pop__addcond`,onClick:Yt,children:`＋ 添加条件`})]}),Mn&&(0,$.jsxs)(`label`,{className:`dt-pop__enable`,title:`停用后条件仍保留，只是不参与过滤`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:I?.paused!==!0,onChange:e=>L(t=>t==null?t:{...t,paused:!e.target.checked})}),`启用筛选`]}),(0,$.jsxs)(`div`,{className:`dt-pop__foot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:()=>{L(null),Z(null)},children:`清除`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:()=>Z(null),children:`完成`})]})]}),ut===`sort`&&(0,$.jsxs)(`div`,{className:`dt-pop`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:`排序`}),k.length===0?(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂无字段`}):(0,$.jsxs)(`div`,{className:`dt-pop__row`,children:[(0,$.jsx)(`select`,{className:`dt-pop__select`,value:R?.col??k[0].col,onChange:e=>z({col:Number(e.target.value),dir:R?.dir??`asc`,enabled:!0}),children:k.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))}),(0,$.jsxs)(`select`,{className:`dt-pop__select`,value:R?.dir??`asc`,onChange:e=>z({col:R?.col??k[0].col,dir:e.target.value,enabled:!0}),children:[(0,$.jsx)(`option`,{value:`asc`,children:`升序`}),(0,$.jsx)(`option`,{value:`desc`,children:`降序`})]})]}),R!=null&&(0,$.jsxs)(`label`,{className:`dt-pop__enable`,title:`停用后配置仍保留，只是不排序`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:R.paused!==!0&&R.enabled!==!1,onChange:e=>z(t=>t==null?t:{...t,paused:!e.target.checked,enabled:!0})}),`启用排序`]}),(0,$.jsxs)(`div`,{className:`dt-pop__foot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:()=>{z(null),Z(null)},children:`清除`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:()=>Z(null),children:`完成`})]})]}),ut===`group`&&(()=>{let e=W===`kanban`,t=e?Ln.filter(e=>de(e.schema.type)):k.map(e=>({col:e.col,name:e.name,schema:e.schema})),n=e&&B!=null&&!t.some(e=>e.col===B)?Ln.find(e=>e.col===B)??null:null;return(0,$.jsxs)(`div`,{className:`dt-pop`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:e?`看板分列字段`:`分组`}),t.length===0&&n==null?(0,$.jsx)(`div`,{className:`dt-pop__none`,children:e?`没有可分列的字段（需要先建「单选」或「人员」字段）`:`暂无字段`}):(0,$.jsx)(`div`,{className:`dt-pop__row`,children:(0,$.jsxs)(`select`,{className:`dt-pop__select`,value:B??``,onChange:e=>V(e.target.value===``?null:Number(e.target.value)),children:[(0,$.jsx)(`option`,{value:``,children:e?`（选择分列字段）`:`（不分组）`}),t.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col)),n!=null&&(0,$.jsxs)(`option`,{value:n.col,children:[n.name,`（该类型不支持看板）`]})]})}),e&&(0,$.jsx)(`div`,{className:`dt-pop__hint`,children:`看板按此字段的值分列，拖卡片可改分组值`}),(0,$.jsxs)(`div`,{className:`dt-pop__foot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:()=>{V(null),Z(null)},children:`清除`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:()=>Z(null),children:`完成`})]})]})})(),ut===`cardfields`&&(()=>{let e=Ln.filter(e=>e.col!==B),t=K.length>0?new Set(K):null;return(0,$.jsxs)(`div`,{className:`dt-pop dt-pop--cardfields`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:`卡片显示字段`}),e.length===0?(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂无可显示的字段（先添加字段）`}):(0,$.jsx)(`div`,{className:`dt-pop__checks`,children:e.map(e=>(0,$.jsxs)(`label`,{className:`dt-pop__check`,title:e.name,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:t==null||t.has(e.col),onChange:()=>It(e.col)}),(0,$.jsx)(`span`,{className:`dt-pop__checkname`,children:e.name})]},e.col))}),(0,$.jsx)(`div`,{className:`dt-pop__hint`,children:`首个字段作卡片标题；分组字段恒不显示在卡片上`}),(0,$.jsxs)(`div`,{className:`dt-pop__foot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:()=>q([]),children:`恢复默认`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:()=>Z(null),children:`完成`})]})]})})(),ut===`color`&&(0,$.jsxs)(`div`,{className:`dt-pop dt-pop--color`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:`填色`}),k.length===0?(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂无字段`}):(0,$.jsxs)($.Fragment,{children:[H?.rules.map((e,t)=>(0,$.jsxs)(`div`,{className:`dt-pop__row`,children:[(0,$.jsx)(`select`,{className:`dt-pop__select`,value:e.col,onChange:n=>{let r=Number(n.target.value),i=Sr(k.find(e=>e.col===r)?.schema.type??`text`);Qt(t,{col:r,op:i.includes(e.op)?e.op:i[0]})},children:k.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))}),(0,$.jsx)(`select`,{className:`dt-pop__select`,value:e.op,onChange:e=>Qt(t,{op:e.target.value}),children:Sr(k.find(t=>t.col===e.col)?.schema.type??`text`).map(e=>(0,$.jsx)(`option`,{value:e,children:yr[e]},e))}),e.op!==`empty`&&e.op!==`notEmpty`&&(0,$.jsx)(`input`,{className:`dt-pop__input`,placeholder:`值`,value:e.value,onChange:e=>Qt(t,{value:e.target.value})}),(0,$.jsx)(`label`,{className:`dt-pop__color`,style:{background:e.color},title:e.color,children:(0,$.jsx)(`input`,{type:`color`,value:e.color,onChange:e=>Qt(t,{color:e.target.value})})}),(0,$.jsx)(`button`,{type:`button`,className:`dt-pop__condel`,title:`删除规则`,onClick:()=>en(t),children:`×`})]},t)),(H?.rules.length??0)===0&&(0,$.jsx)(`div`,{className:`dt-pop__none`,children:`暂未设置填色规则`}),(0,$.jsx)(`button`,{type:`button`,className:`dt-pop__addcond`,onClick:$t,children:`＋ 添加规则`})]}),Fn&&(0,$.jsxs)(`label`,{className:`dt-pop__enable`,title:`停用后规则仍保留，只是不上色`,children:[(0,$.jsx)(`input`,{type:`checkbox`,checked:H?.paused!==!0,onChange:e=>U(t=>t==null?t:{...t,paused:!e.target.checked})}),`启用填色`]}),(0,$.jsxs)(`div`,{className:`dt-pop__foot`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:()=>{U(null),Z(null)},children:`清除`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn`,onClick:()=>Z(null),children:`完成`})]})]}),ut===`rowheight`&&(0,$.jsxs)(`div`,{className:`dt-pop`,ref:gt,children:[(0,$.jsx)(`div`,{className:`dt-pop__title`,children:`行高`}),(0,$.jsx)(`div`,{className:`dt-pop__rowheights`,children:[[`compact`,`紧凑`],[`medium`,`中等`],[`loose`,`宽松`]].map(([e,t])=>(0,$.jsxs)(`button`,{type:`button`,className:`dt-pop__rh${_e===e?` dt-pop__rh--on`:``}`,onClick:()=>{ve(e),Pe(e=>e+1),Z(null)},children:[(0,$.jsx)(`span`,{className:`dt-pop__rh-lines dt-pop__rh-lines--${e}`}),t]},e))})]})]}),pt!=null&&yn!=null&&(0,$.jsx)(Zr,{innerRef:gt,left:pt.left,name:yn.name,schema:yn.schema,fields:k,selfCol:yn.col,spaceId:x,slugId:t,shareToken:w,readOnly:m,onSave:(e,t)=>{_n(yn.col,e,t),mt(null)},onDelete:m?void 0:()=>{nn(yn.col),mt(null)},onClose:()=>mt(null)},yn.col),W===`kanban`?(0,$.jsx)(lr,{api:O,fields:Ln,rows:On,groupField:zn,cardFields:K,cellColor:An,readOnly:m,spaceId:x,pageId:e,shareToken:w,onWriteCell:un,onAddCard:dn,onEditField:vn,onPickGroup:()=>Kt(`group`),comments:Oe}):(0,$.jsx)(Jn,{api:O,fields:Ln,rows:On,groups:kn,cellColor:An,readOnly:m,rowHeight:_e,rowHeightSeq:Ne,footStats:be,onFootStatsChange:m?void 0:xe,onChanged:Q,onEditField:vn,onAddField:tn,onAddRecord:ln,frozenCount:je,onInsertFieldAt:m?void 0:e=>tn(e),onFieldOrderChange:m?void 0:Ae,onFreezeChange:m?void 0:Me,onRemoveField:m?void 0:nn,computed:bn,onRowWrite:m?void 0:sn,onInsertRowAt:m?void 0:fn,onRemoveRowAt:m?void 0:pn,onMoveRow:In?mn:void 0,spaceId:x,pageId:e,shareToken:w,comments:Oe})]})]}),rt!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-mini-menu`,style:{left:rt.x,top:rt.y},children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{it(null),Bt()},children:`新建数据表`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{it(null),Vt(`doc`)},children:`新建文档`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{it(null),Vt(`html`)},children:`新建透视页面`})]}),s()),qe!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-mini-menu`,style:{left:qe.x,top:qe.y},children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let e=qe;Je(null),Wt(e.id,e.name)},children:`重命名`}),(0,$.jsx)(`button`,{type:`button`,className:`dt-mini-menu__danger`,onClick:()=>{let e=qe;Je(null),Gt(e.id,e.name)},children:`删除`})]}),s()),X!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-mini-menu`,style:{left:X.x,top:X.y},children:[(()=>{let e=(J.find(e=>e.id===X.id)?.type??`grid`)===`kanban`;return(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let t=X.id;nt(null),Ft(t,e?`grid`:`kanban`)},children:e?`切换为表格视图`:`切换为看板视图`})})(),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{let e=X.id;nt(null),Lt(e)},children:`重命名视图`}),X.id!==`view-0`&&(0,$.jsx)(`button`,{type:`button`,className:`dt-mini-menu__danger`,onClick:()=>{let e=X.id;nt(null),Rt(e)},children:`删除视图`})]}),s()),dt!=null&&(0,ge.createPortal)((0,$.jsxs)(`div`,{className:`dt-mini-menu`,style:{left:dt.x,top:dt.y},children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>{ft(null),Pt(`grid`)},children:`新建表格视图`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>{ft(null),Pt(`kanban`)},children:`新建看板视图`})]}),s()),(0,$.jsx)(`div`,{className:`datatable-editor__engine datatable-editor__engine--headless`,"aria-hidden":`true`,children:(0,$.jsx)(P.Suspense,{fallback:null,children:(0,$.jsx)(dr,{pageId:e,slugId:t,title:r,initialSheet:a,initialSheets:l,standalone:d,initialWorkbookData:f,readOnly:m,onStatusChange:h,onAwarenessUsers:_,onContentReady:v,spaceId:x,commentOpen:ee,onToggleComment:te,registerExportExcel:C,registerImportExcel:ie,shareToken:w,registerDataTableApi:St,onDataTableChange:Q})})})]})}function Zr({innerRef:e,left:t,name:n,schema:r,fields:i,selfCol:a,spaceId:o,slugId:s,shareToken:c,readOnly:l,onSave:u,onDelete:d,onClose:f}){let[p,m]=(0,P.useState)(n),[h,g]=(0,P.useState)(r.type??`text`),[_,v]=(0,P.useState)(r.options??[]),[y,b]=(0,P.useState)(r.max),[x,S]=(0,P.useState)(r.currency??`¥`),[ee,te]=(0,P.useState)(r.decimals??2),[ne,C]=(0,P.useState)(r.prefix??``),[re,ie]=(0,P.useState)(r.formula??``),[w,ae]=(0,P.useState)(``),[T,oe]=(0,P.useState)(r.linkTable),[E,se]=(0,P.useState)(r.lookupLink),[ce,D]=(0,P.useState)(r.lookupCol),[O,le]=(0,P.useState)(r.lookupColName??``),[ue,de]=(0,P.useState)(r.lookupAgg??`value`),[fe,A]=(0,P.useState)(r.buttonAction?.label??``),[pe,M]=(0,P.useState)(r.buttonAction?.kind??`openUrl`),[N,me]=(0,P.useState)(r.buttonAction?.url??``),[he,ge]=(0,P.useState)(r.buttonAction?.targetCol),[F,_e]=(0,P.useState)(r.buttonAction?.value??``),[ve,I]=(0,P.useState)(null),[L,R]=(0,P.useState)(null);(0,P.useEffect)(()=>{if(h!==`link`||o==null)return;let e=!1;return Le(o,s).then(t=>{e||R(t)}).catch(()=>{e||R([])}),()=>{e=!0}},[h,o,s]);let z=i.find(e=>e.col===E&&e.schema.type===`link`)?.schema.linkTable?.slugId??``,[B,V]=(0,P.useState)(null);(0,P.useEffect)(()=>{if(h!==`lookup`||z.length===0){V(null);return}let e=!1;return Ie(z,c).then(t=>{e||V(t)}).catch(()=>{e||V(null)}),()=>{e=!0}},[h,z,c]);let H=h===`select`||h===`multiSelect`,U=(e,t)=>{v(n=>n.map((n,r)=>r===e?{...n,...t}:n))},W=[`#1677ff`,`#2f54eb`,`#722ed1`,`#c41d7f`,`#eb2f96`,`#fa8c16`,`#fadb14`,`#a0d911`,`#52c41a`,`#13c2c2`,`#14a7b8`,`#8c8c8c`],G=i.filter(e=>e.schema.type===`link`&&e.col!==a),K=i.filter(e=>e.col!==a&&e.schema.type!==`button`),q=()=>{let e={type:h};return H&&(e.options=_),h===`progress`&&(e.max=y??100),h===`rating`&&(e.max=y??5),h===`currency`&&(e.currency=x.trim().length>0?x.trim():`¥`,e.decimals=Math.max(0,Math.min(6,Number.isFinite(ee)?ee:2))),h===`autoNumber`&&(e.prefix=ne,r.seq!=null&&(e.seq=r.seq)),h===`formula`&&(e.formula=re.trim()),h===`link`&&T!=null&&(e.linkTable=T),h===`lookup`&&(E!=null&&(e.lookupLink=E),ce!=null&&(e.lookupCol=ce,e.lookupColName=O),e.lookupAgg=ue),h===`button`&&(e.buttonAction=pe===`openUrl`?{kind:`openUrl`,label:fe.trim()||void 0,url:N.trim()}:{kind:`setValue`,label:fe.trim()||void 0,targetCol:he,value:F}),e};return(0,$.jsxs)(`div`,{ref:e,className:`datatable-fieldpop${h===`formula`?` datatable-fieldpop--wide`:``}`,style:{left:t},onClick:e=>e.stopPropagation(),children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`字段名称`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,value:p,readOnly:l,placeholder:`字段名称`,onChange:e=>m(e.target.value)})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`字段类型`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:h,disabled:l,onChange:e=>g(e.target.value),children:[!j.some(e=>e.types.includes(h))&&(0,$.jsxs)(`option`,{value:h,children:[k[h],`（暂不支持）`]}),j.map(e=>(0,$.jsx)(`optgroup`,{label:e.label,children:e.types.map(e=>(0,$.jsx)(`option`,{value:e,children:k[e]},e))},e.label))]})]}),h===`progress`&&(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`进度上限`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,type:`number`,min:1,value:y??100,disabled:l,onChange:e=>b(e.target.value===``?void 0:Number(e.target.value))})]}),h===`rating`&&(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`星级上限`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,type:`number`,min:1,max:10,value:y??5,disabled:l,onChange:e=>b(e.target.value===``?void 0:Number(e.target.value))})]}),h===`currency`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`货币符号`}),(0,$.jsx)(`select`,{className:`datatable-fieldpop__select`,value:x,disabled:l,onChange:e=>S(e.target.value),children:[`¥`,`$`,`€`,`£`,`₩`,`₽`,`HK$`].map(e=>(0,$.jsx)(`option`,{value:e,children:e},e))})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`小数位数`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,type:`number`,min:0,max:6,value:ee,disabled:l,onChange:e=>te(e.target.value===``?2:Number(e.target.value))})]})]}),h===`autoNumber`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`编号前缀`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,placeholder:`如 NO-（留空则只发序号）`,value:ne,readOnly:l,onChange:e=>C(e.target.value)})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__hint datatable-fieldpop__hint--wrap`,children:[`新建记录自动发号`,r.seq==null?``:`（已发 ${r.seq} 号）`,`，单元格不可手改； 改前缀（含清空）会同步重写已发编号，序号保持不变`]})]}),h===`formula`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`公式表达式`}),(0,$.jsx)(`textarea`,{className:`datatable-fieldpop__textarea`,rows:3,placeholder:`如：[单价] * [数量] 或 IF([数量]>10, [单价]*0.9, [单价])`,value:re,readOnly:l,onChange:e=>ie(e.target.value)})]}),(0,$.jsx)(`div`,{className:`datatable-fieldpop__hint datatable-fieldpop__hint--wrap`,children:`引用字段：[字段名]；运算符：+ - * / & = <> < > <= >=；函数：SUM AVG MAX MIN COUNT ROUND ABS INT MOD CONCAT LEN UPPER LOWER LEFT RIGHT MID IF AND OR NOT ISBLANK TODAY NOW YEAR MONTH DAY`}),(()=>{let e=w.trim().toLowerCase(),t=i.filter(t=>t.col!==a&&(e.length===0||t.name.toLowerCase().includes(e))),n=[...Tr.map(e=>({label:e.label,items:t.filter(t=>e.types.includes(t.schema.type))})),{label:`其它`,items:t.filter(e=>!Er.has(e.schema.type))}].filter(e=>e.items.length>0);return(0,$.jsxs)(`div`,{className:`datatable-fieldpop__fml`,children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__fmlhead`,children:[(0,$.jsx)(`span`,{children:`可点插入字段`}),i.length-1>8&&(0,$.jsx)(`input`,{className:`datatable-fieldpop__fmlsearch`,placeholder:`搜索字段…`,value:w,readOnly:l,onChange:e=>ae(e.target.value)})]}),(0,$.jsx)(`div`,{className:`datatable-fieldpop__fmlbody`,children:n.length===0?(0,$.jsx)(`div`,{className:`datatable-fieldpop__hint`,children:`无匹配字段`}):n.map(e=>(0,$.jsxs)(`div`,{className:`datatable-fieldpop__fmlgroup`,children:[(0,$.jsx)(`div`,{className:`datatable-fieldpop__fmlgrouplabel`,children:e.label}),(0,$.jsx)(`div`,{className:`datatable-fieldpop__fmlchips`,children:e.items.map(e=>(0,$.jsxs)(`button`,{type:`button`,className:`datatable-fieldpop__fieldref`,disabled:l,title:`${e.name}（${k[e.schema.type]??`文本`}）`,onClick:()=>ie(t=>`${t}[${e.name}]`),children:[`[`,e.name,`]`]},e.col))})]},e.label))})]})})()]}),h===`link`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`关联目标表`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:T?.slugId??``,disabled:l,onChange:e=>{let t=L?.find(t=>t.slugId===e.target.value);oe(t==null?void 0:{slugId:t.slugId,title:t.title})},children:[(0,$.jsx)(`option`,{value:``,children:`（请选择）`}),(L??[]).map(e=>(0,$.jsx)(`option`,{value:e.slugId,children:e.title},e.slugId))]})]}),(0,$.jsx)(`div`,{className:`datatable-fieldpop__hint`,children:o==null?`需要空间上下文`:L==null?`目标表加载中…`:L.length===0?`本空间暂无其它多维表格`:`单元格点击后从目标表选一条记录`})]}),h===`lookup`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`关联字段`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:E??``,disabled:l,onChange:e=>{se(e.target.value===``?void 0:Number(e.target.value)),D(void 0),le(``)},children:[(0,$.jsx)(`option`,{value:``,children:`（选择本表的单向关联字段）`}),G.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))]})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`引用目标列`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:ce??``,disabled:l||B==null,onChange:e=>{let t=e.target.value===``?void 0:Number(e.target.value);D(t),le(t==null?``:B?.fields.find(e=>e.col===t)?.name??``)},children:[(0,$.jsx)(`option`,{value:``,children:B==null?`（先选关联字段）`:`（请选择）`}),(B?.fields??[]).map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))]})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`聚合方式`}),(0,$.jsx)(`select`,{className:`datatable-fieldpop__select`,value:ue,disabled:l,onChange:e=>de(e.target.value),children:Object.keys(qr).map(e=>(0,$.jsx)(`option`,{value:e,children:qr[e]},e))})]}),(0,$.jsx)(`div`,{className:`datatable-fieldpop__hint`,children:`沿本行「关联字段」指向的记录，取目标表对应列的值`})]}),h===`button`&&(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`按钮文字`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,placeholder:`如：打开链接 / 标记完成`,value:fe,readOnly:l,onChange:e=>A(e.target.value)})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`点击动作`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:pe,disabled:l,onChange:e=>M(e.target.value),children:[(0,$.jsx)(`option`,{value:`openUrl`,children:`打开链接`}),(0,$.jsx)(`option`,{value:`setValue`,children:`设置本行字段值`})]})]}),pe===`openUrl`?(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`目标地址`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,placeholder:`https://…`,value:N,readOnly:l,onChange:e=>me(e.target.value)})]}):(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`目标字段`}),(0,$.jsxs)(`select`,{className:`datatable-fieldpop__select`,value:he??``,disabled:l,onChange:e=>ge(e.target.value===``?void 0:Number(e.target.value)),children:[(0,$.jsx)(`option`,{value:``,children:`（请选择）`}),K.map(e=>(0,$.jsx)(`option`,{value:e.col,children:e.name},e.col))]})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__row`,children:[(0,$.jsx)(`label`,{className:`datatable-fieldpop__label`,children:`写入值`}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__input`,placeholder:`点击按钮后写入的值`,value:F,readOnly:l,onChange:e=>_e(e.target.value)})]})]})]}),(h===`createdTime`||h===`modifiedTime`||h===`createdBy`||h===`modifiedBy`)&&(0,$.jsxs)(`div`,{className:`datatable-fieldpop__hint`,children:[h===`createdTime`&&`新建记录时自动写入当前时间，不可手改`,h===`modifiedTime`&&`记录任一字段被编辑时自动刷新为当前时间，不可手改`,h===`createdBy`&&`新建记录时自动写入当前用户，不可手改`,h===`modifiedBy`&&`记录被编辑时自动写入当前用户，不可手改`]}),H&&(0,$.jsxs)(`div`,{className:`datatable-fieldpop__opts`,children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__opts-head`,children:[(0,$.jsx)(`span`,{children:`选项`}),!l&&(0,$.jsx)(`button`,{type:`button`,className:`datatable-fieldpop__addopt`,onClick:()=>v(e=>[...e,{id:`opt-${Date.now()}`,name:`选项${e.length+1}`,color:W[e.length%W.length]}]),children:`＋ 选项`})]}),_.length===0?(0,$.jsx)(`div`,{className:`datatable-fieldpop__none datatable-fieldpop__none--empty`,children:(0,$.jsx)(`span`,{children:l?`暂无可选值`:`还没有选项，点上方「＋ 选项」添加`})}):(0,$.jsx)(`div`,{className:`datatable-fieldpop__optlist`,children:_.map((e,t)=>(0,$.jsxs)(`div`,{className:`datatable-fieldpop__optitem`,children:[(0,$.jsxs)(`div`,{className:`datatable-fieldpop__opt`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-fieldpop__optcolor${!l&&ve===t?` datatable-fieldpop__optcolor--on`:``}`,style:{background:e.color??`#8c8c8c`},title:l?void 0:`更改此选项颜色`,onClick:()=>{l||I(e=>e===t?null:t)}}),(0,$.jsx)(`input`,{className:`datatable-fieldpop__optname`,value:e.name,readOnly:l,onChange:e=>U(t,{name:e.target.value})}),!l&&(0,$.jsx)(`button`,{type:`button`,className:`datatable-fieldpop__optdel`,onClick:()=>{I(null),v(e=>e.filter((e,n)=>n!==t))},children:`×`})]}),!l&&ve===t&&(0,$.jsx)(`div`,{className:`datatable-fieldpop__colors datatable-fieldpop__colors--inline`,children:W.map(e=>(0,$.jsx)(`button`,{type:`button`,className:`datatable-fieldpop__color`,style:{background:e},title:e,onClick:()=>{U(t,{color:e}),I(null)}},e))})]},e.id))})]}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__foot`,children:[d!=null&&!l&&(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--danger`,onClick:d,children:`删除字段`}),(0,$.jsxs)(`div`,{className:`datatable-fieldpop__foot-right`,children:[(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--ghost`,onClick:f,children:`取消`}),(0,$.jsx)(`button`,{type:`button`,className:`datatable-btn datatable-btn--primary`,onClick:()=>u(p,q()),children:`保存`})]})]})]})}export{Xr as default};