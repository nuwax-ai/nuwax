"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[8849],{12685:function(b,T,e){e.r(T),e.d(T,{default:function(){return K}});var p=e(75271),g=e(48398),s=e(52676),R=function(n){var l=n.permissions,a=n.requireAll,c=a===void 0?!1:a,h=n.fallback,v=h===void 0?null:h,j=n.children,F=(0,g.useModel)("menuModel"),i=F.hasAnyPermission,M=F.hasAllPermissions,D=Array.isArray(l)?l:[l],f=c?M(D):i(D);return f?(0,s.jsx)(s.Fragment,{children:j}):(0,s.jsx)(s.Fragment,{children:v})},P=R;function O(){var x=(0,g.useModel)("menuModel"),n=x.hasPermission,l=x.hasAnyPermission,a=x.hasAllPermissions,c=x.hasMenuAccess,h=(0,p.useCallback)(function(i){return n(i)},[n]),v=(0,p.useCallback)(function(i){return l(i)},[l]),j=(0,p.useCallback)(function(i){return a(i)},[a]),F=(0,p.useCallback)(function(i){return c(i)},[c]);return{hasPermission:h,hasAnyPermission:v,hasAllPermissions:j,hasMenuAccess:F}}var w=null,S=e(55376),L=e(24083),$=e(27393),k=e(97666),H=e(18455),A=e(9030),E=e(25133),y=e(17133),t=e(8378),r=e(97102),z=e(27929),m=e(43017),Z=e(49328),Q=e(11985),C=e(55980),B=e(50661),I=e(24326),U=e(14858),V=e(89745),u={container:"container___X95ik",header:"header___i98lq",card:"card___yBvcp",menuTree:"menuTree____sqgs",demoRow:"demoRow___Q1BcV",codeBlock:"codeBlock___Tpgdc",codeSnippet:"codeSnippet___SjxSR",codeExample:"codeExample___ovQq2",permissionCheck:"permissionCheck___Ta7Uc"},X=y.Z.Title,o=y.Z.Text,G=y.Z.Paragraph,J=function(){var n=(0,g.useModel)("menuModel"),l=n.menuTree,a=n.loading,c=n.loadMenus,h=n.hasPermission,v=n.firstLevelMenus,j=O(),F=j.hasAnyPermission,i=j.hasAllPermissions;(0,p.useEffect)(function(){c()},[c]);var M=function f(Y){return Y.map(function(d){var N,W;return{key:d.code,title:(0,s.jsxs)(t.Z,{children:[(0,s.jsx)(o,{children:d.name}),(0,s.jsx)(r.Z,{color:"blue",children:d.code}),d.path&&(0,s.jsx)(r.Z,{color:"green",children:d.path}),((N=d.permissions)===null||N===void 0?void 0:N.length)&&(0,s.jsxs)(r.Z,{color:"purple",children:[d.permissions.length," \u4E2A\u6743\u9650"]})]}),children:(W=d.children)!==null&&W!==void 0&&W.length?f(d.children):void 0}})},D=function(){c(),z.ZP.success("\u83DC\u5355\u6570\u636E\u5DF2\u5237\u65B0")};return(0,s.jsxs)("div",{className:u.container,children:[(0,s.jsxs)("div",{className:u.header,children:[(0,s.jsxs)(X,{level:2,children:[(0,s.jsx)(S.Z,{style:{marginRight:12,color:"var(--xagi-color-primary)"}}),"\u83DC\u5355\u6743\u9650\u7BA1\u7406\u6F14\u793A"]}),(0,s.jsx)(G,{type:"secondary",children:"\u5C55\u793A\u52A8\u6001\u83DC\u5355\u7CFB\u7EDF\u548C\u529F\u80FD\u6743\u9650\u63A7\u5236\u7684\u4F7F\u7528\u65B9\u5F0F\u3002\u6B64\u9875\u9762\u7528\u4E8E\u5F00\u53D1\u6D4B\u8BD5\uFF0C\u5C55\u793A\u5982\u4F55\u4F7F\u7528 PermissionWrapper \u7EC4\u4EF6\u548C usePermission Hook\u3002"}),(0,s.jsx)(m.ZP,{type:"primary",icon:(0,s.jsx)(L.Z,{}),onClick:D,loading:a,children:"\u5237\u65B0\u83DC\u5355\u6570\u636E"})]}),(0,s.jsx)(Z.Z,{}),(0,s.jsxs)(Q.Z,{gutter:[24,24],children:[(0,s.jsx)(C.Z,{xs:24,lg:12,children:(0,s.jsx)(B.Z,{title:(0,s.jsxs)(t.Z,{children:[(0,s.jsx)($.Z,{}),"\u5F53\u524D\u7528\u6237\u83DC\u5355\u6811"]}),className:u.card,extra:(0,s.jsxs)(r.Z,{color:"blue",children:[v.length," \u4E2A\u4E00\u7EA7\u83DC\u5355"]}),children:(0,s.jsx)(I.Z,{spinning:a,children:l.length>0?(0,s.jsx)(U.Z,{showLine:{showLeafIcon:!1},defaultExpandAll:!0,treeData:M(l),className:u.menuTree}):(0,s.jsx)(V.Z,{message:"\u6682\u65E0\u83DC\u5355\u6570\u636E",description:(0,s.jsxs)("div",{children:[(0,s.jsxs)("p",{children:["\u8BF7\u786E\u4FDD\u540E\u7AEF\u63A5\u53E3 ",(0,s.jsx)(o,{code:!0,children:"/api/system/menu/list"})," ","\u5DF2\u914D\u7F6E\u5E76\u8FD4\u56DE\u83DC\u5355\u6570\u636E\u3002"]}),(0,s.jsx)("p",{children:"\u63A5\u53E3\u8FD4\u56DE\u683C\u5F0F\u793A\u4F8B\uFF1A"}),(0,s.jsx)("pre",{className:u.codeBlock,children:`{
  "code": 0,
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "\u7CFB\u7EDF\u7BA1\u7406",
        "code": "system_manage",
        "icon": "icons-nav-settings",
        "path": "/system",
        "children": [...]
      }
    ]
  }
}`})]}),type:"info"})})})}),(0,s.jsx)(C.Z,{xs:24,lg:12,children:(0,s.jsx)(B.Z,{title:(0,s.jsxs)(t.Z,{children:[(0,s.jsx)(k.Z,{}),"PermissionWrapper \u7EC4\u4EF6\u4F7F\u7528"]}),className:u.card,children:(0,s.jsxs)(t.Z,{direction:"vertical",size:"large",style:{width:"100%"},children:[(0,s.jsxs)("div",{children:[(0,s.jsx)(o,{strong:!0,children:"1. \u5355\u4E2A\u6743\u9650\u68C0\u67E5\uFF1A"}),(0,s.jsxs)("div",{className:u.demoRow,children:[(0,s.jsx)(P,{permissions:"user:add",children:(0,s.jsx)(m.ZP,{type:"primary",children:"\u65B0\u589E\u7528\u6237\uFF08\u9700\u8981 user:add\uFF09"})}),(0,s.jsx)(P,{permissions:"user:add",fallback:(0,s.jsx)(m.ZP,{disabled:!0,children:"\u65E0\u6743\u9650\uFF08fallback\uFF09"}),children:(0,s.jsx)(m.ZP,{type:"primary",children:"\u6709\u6743\u9650\u7684\u6309\u94AE"})})]}),(0,s.jsx)("div",{className:u.codeSnippet,children:(0,s.jsx)("code",{children:`<PermissionWrapper permissions="user:add">
  <Button>\u65B0\u589E\u7528\u6237</Button>
</PermissionWrapper>`})})]}),(0,s.jsx)(Z.Z,{dashed:!0}),(0,s.jsxs)("div",{children:[(0,s.jsx)(o,{strong:!0,children:"2. \u4EFB\u610F\u6743\u9650\u6EE1\u8DB3\uFF08OR\uFF09\uFF1A"}),(0,s.jsx)("div",{className:u.demoRow,children:(0,s.jsx)(P,{permissions:["user:edit","user:delete"],children:(0,s.jsx)(m.ZP,{children:"\u7F16\u8F91\u6216\u5220\u9664\uFF08\u4EFB\u4E00\u6743\u9650\u5373\u53EF\uFF09"})})}),(0,s.jsx)("div",{className:u.codeSnippet,children:(0,s.jsx)("code",{children:`<PermissionWrapper permissions={['user:edit', 'user:delete']}>
  <Button>\u7F16\u8F91\u6216\u5220\u9664</Button>
</PermissionWrapper>`})})]}),(0,s.jsx)(Z.Z,{dashed:!0}),(0,s.jsxs)("div",{children:[(0,s.jsx)(o,{strong:!0,children:"3. \u6240\u6709\u6743\u9650\u6EE1\u8DB3\uFF08AND\uFF09\uFF1A"}),(0,s.jsx)("div",{className:u.demoRow,children:(0,s.jsx)(P,{permissions:["user:edit","user:delete"],requireAll:!0,children:(0,s.jsx)(m.ZP,{danger:!0,children:"\u6279\u91CF\u64CD\u4F5C\uFF08\u9700\u8981\u5168\u90E8\u6743\u9650\uFF09"})})}),(0,s.jsx)("div",{className:u.codeSnippet,children:(0,s.jsx)("code",{children:`<PermissionWrapper 
  permissions={['user:edit', 'user:delete']} 
  requireAll
>
  <Button>\u6279\u91CF\u64CD\u4F5C</Button>
</PermissionWrapper>`})})]})]})})}),(0,s.jsx)(C.Z,{xs:24,lg:12,children:(0,s.jsxs)(B.Z,{title:(0,s.jsxs)(t.Z,{children:[(0,s.jsx)(H.Z,{}),"usePermission Hook \u4F7F\u7528"]}),className:u.card,children:[(0,s.jsx)("div",{className:u.codeBlock,children:(0,s.jsx)("code",{children:"const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();"})}),(0,s.jsx)(Z.Z,{}),(0,s.jsxs)(t.Z,{direction:"vertical",size:"middle",style:{width:"100%"},children:[(0,s.jsxs)("div",{className:u.permissionCheck,children:[(0,s.jsx)(o,{code:!0,children:"hasPermission('user:add')"}),":",h("user:add")?(0,s.jsx)(r.Z,{icon:(0,s.jsx)(A.Z,{}),color:"success",children:"\u6709\u6743\u9650"}):(0,s.jsx)(r.Z,{icon:(0,s.jsx)(E.Z,{}),color:"error",children:"\u65E0\u6743\u9650"})]}),(0,s.jsxs)("div",{className:u.permissionCheck,children:[(0,s.jsx)(o,{code:!0,children:"hasPermission('user:edit')"}),":",h("user:edit")?(0,s.jsx)(r.Z,{icon:(0,s.jsx)(A.Z,{}),color:"success",children:"\u6709\u6743\u9650"}):(0,s.jsx)(r.Z,{icon:(0,s.jsx)(E.Z,{}),color:"error",children:"\u65E0\u6743\u9650"})]}),(0,s.jsxs)("div",{className:u.permissionCheck,children:[(0,s.jsx)(o,{code:!0,children:"hasAnyPermission(['user:edit', 'user:delete'])"}),":",F(["user:edit","user:delete"])?(0,s.jsx)(r.Z,{icon:(0,s.jsx)(A.Z,{}),color:"success",children:"\u6709\u6743\u9650"}):(0,s.jsx)(r.Z,{icon:(0,s.jsx)(E.Z,{}),color:"error",children:"\u65E0\u6743\u9650"})]}),(0,s.jsxs)("div",{className:u.permissionCheck,children:[(0,s.jsx)(o,{code:!0,children:"hasAllPermissions(['user:add', 'user:edit'])"}),":",i(["user:add","user:edit"])?(0,s.jsx)(r.Z,{icon:(0,s.jsx)(A.Z,{}),color:"success",children:"\u6709\u6743\u9650"}):(0,s.jsx)(r.Z,{icon:(0,s.jsx)(E.Z,{}),color:"error",children:"\u65E0\u6743\u9650"})]})]})]})}),(0,s.jsx)(C.Z,{xs:24,lg:12,children:(0,s.jsx)(B.Z,{title:(0,s.jsxs)(t.Z,{children:[(0,s.jsx)(k.Z,{}),"\u5B8C\u6574\u4EE3\u7801\u793A\u4F8B"]}),className:u.card,children:(0,s.jsx)("pre",{className:u.codeExample,children:`// 1. \u4F7F\u7528 PermissionWrapper \u5305\u88F9\u9700\u8981\u6743\u9650\u63A7\u5236\u7684\u5143\u7D20
import PermissionWrapper from '@/components/base/PermissionWrapper';

<PermissionWrapper permissions="user:add">
  <Button type="primary" onClick={handleAdd}>
    \u65B0\u589E\u7528\u6237
  </Button>
</PermissionWrapper>

// 2. \u4F7F\u7528 usePermission Hook \u8FDB\u884C\u6761\u4EF6\u6E32\u67D3
import { usePermission } from '@/hooks/usePermission';

const { hasPermission } = usePermission();

{hasPermission('user:delete') && (
  <Button danger onClick={handleDelete}>
    \u5220\u9664
  </Button>
)}

// 3. \u5728\u4E1A\u52A1\u903B\u8F91\u4E2D\u68C0\u67E5\u6743\u9650
const handleExport = () => {
  if (!hasPermission('data:export')) {
    message.error('\u60A8\u6CA1\u6709\u5BFC\u51FA\u6743\u9650');
    return;
  }
  // \u6267\u884C\u5BFC\u51FA...
};

// 4. \u4F7F\u7528 fallback \u663E\u793A\u65E0\u6743\u9650\u63D0\u793A
<PermissionWrapper 
  permissions="admin:manage" 
  fallback={<Text type="secondary">\u65E0\u7BA1\u7406\u6743\u9650</Text>}
>
  <Button>\u7BA1\u7406\u5458\u64CD\u4F5C</Button>
</PermissionWrapper>`})})})]})]})},K=J}}]);})();
