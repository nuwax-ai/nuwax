"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4310],{38767:function(Fe,A,e){e.r(A),e.d(A,{default:function(){return le}});var V=e(26068),M=e.n(V),R=e(67825),B=e.n(R),H=e(48305),K=e.n(H),z=e(82092),f=e.n(z),J=e(10802),Q=e(96073),W=e(86731),Y=e(94264),G=e(34502),X=e(67296),b=e(69945),$=e(52589),w=e(7838),t=e(32326),k=e(87778),q=e(24723),_=e(84768),L=e(48027),S=e(19405),u=e(74950),E=e(79268),ee=e(66672),ne=e(94581),T=e.n(ne),Z=e(75271),N=e(30187),d={"xagi-nav-style2":"xagi-nav-style2___QMzM_",text:"text___eHQ97","page-container":"page-container___aAAlW",container:"container___ni9eY","main-container":"main-container___W3V45","upload-box":"upload-box___YnmNN","sub-title":"sub-title___ouGpe","collapse-container":"collapse-container___PE3Yx"},ae=e(97950),j=e(9804),v={"xagi-nav-style2":"xagi-nav-style2___hJzT3",text:"text___zIKp3","page-container":"page-container___CrbtD",header:"header___JhhT6",icon:"icon___Kq1QD",name:"name___sCjTq","extra-box":"extra-box___KLfg7","save-btn":"save-btn___lrAkN"},n=e(52676),m=T().bind(v),se=function(l){var p=l.spaceId,y=l.saveLoading,g=l.saveDeployLoading,C=l.onCancel,x=l.onSave,a=l.onSaveAndDeploy;return(0,n.jsxs)("header",{className:m("flex","items-center",v.header),children:[(0,n.jsxs)("div",{className:m("flex","items-center","cursor-pointer"),onClick:function(){return(0,L.bC)("/space/".concat(p,"/mcp"))},children:[(0,n.jsx)(ae.Z,{className:m("hover-box",v.icon)}),(0,n.jsx)("span",{className:v.name,children:"\u521B\u5EFAMCP\u670D\u52A1"})]}),(0,n.jsx)("div",{className:m("flex-1")}),(0,n.jsxs)("div",{className:m("flex","items-center",v["extra-box"]),children:[(0,n.jsx)(j.ZP,{onClick:C,children:"\u53D6\u6D88"}),(0,n.jsx)(j.ZP,{className:m(v["save-btn"]),onClick:x,loading:y,children:"\u4FDD\u5B58"}),(0,n.jsx)(j.ZP,{type:"primary",onClick:a,loading:g,children:"\u4FDD\u5B58\u5E76\u90E8\u7F72"})]})]})},oe=se,te=["serverConfig"],c=T().bind(d),I=f()(f()(f()(f()(f()({},t.l_.NPX,`{
  "mcpServers": {
    "mcpServerName": {
      "command": "npx",
      "args": [],
      "env": {}
    }
  }
}`),t.l_.UVX,`{
  "mcpServers": {
    "mcpServerName": {
      "command": "uvx",
      "args": [],
      "env": {}
    }
  }
}`),t.l_.SSE,`{
  "mcpServers": {
    "mcpServerName": {
      "type": "sse",
      "url": "url\u5730\u5740",
      "headers": {}
    }
  }
}`),t.l_.STREAMABLE_HTTP,`{
  "mcpServers": {
    "mcpServerName": {
      "type": "streamableHttp",
      "url": "url\u5730\u5740",
      "headers": {}
    }
  }
}`),t.l_.COMPONENT,""),re=function(){var l=(0,N.useParams)(),p=Number(l.spaceId),y=(0,Z.useState)(),g=K()(y,2),C=g[0],x=g[1],a=(0,$.Z)(),i=a.form,O=a.imageUrl,ie=a.setImageUrl,ue=a.saveLoading,D=a.setSaveLoading,de=a.saveDeployLoading,F=a.setSaveDeployLoading,ve=a.checkTag,me=a.openAddComponent,pe=a.setOpenAddComponent,h=a.mcpConfigComponentList,Ce=a.addComponents,fe=a.collapseActiveKey,ge=a.handleAddComponent,U=a.handleSave,P=a.withDeployRef,xe=a.collapseList;(0,Z.useEffect)(function(){var s=t.l_.NPX;x(s),i.setFieldsValue({installType:s,serverConfig:I[s]})},[]);var he=(0,N.useRequest)(w.Lk,{manual:!0,debounceInterval:300,onSuccess:function(r){F(!1),D(!1);var o=P.current?"\u5DF2\u5B8C\u6210\u4FDD\u5B58\u5E76\u63D0\u4EA4\u90E8\u7F72":"\u4FDD\u5B58MCP\u670D\u52A1\u6210\u529F";S.ZP.success(o),N.history.replace("/space/".concat(p,"/mcp/edit/").concat(r.id))},onError:function(){F(!1),D(!1)}}),Se=he.run,Ne=function(r){var o=r.serverConfig,je=B()(r,te);if(C===t.l_.COMPONENT){if(!(h!=null&&h.length)){S.ZP.warning("\u8BF7\u9009\u62E9\u7EC4\u4EF6");return}}else if(!o){S.ZP.warning("\u8BF7\u8F93\u5165MCP\u670D\u52A1\u914D\u7F6E");return}P.current?F(!0):D(!0);var ye=C===t.l_.COMPONENT?{serverConfig:"",components:h}:{serverConfig:o,components:[]},De=M()(M()({},je),{},{spaceId:p,icon:O,mcpConfig:ye,withDeploy:P.current});Se(De)};return(0,n.jsxs)("div",{className:c(d.container,"flex","flex-col","h-full"),children:[(0,n.jsx)(oe,{spaceId:p,saveLoading:ue,saveDeployLoading:de,onCancel:function(){return(0,L.bC)("/space/".concat(p,"/mcp"))},onSave:function(){return U(!1)},onSaveAndDeploy:function(){return U(!0)}}),(0,n.jsx)("div",{className:c("flex-1","overflow-y"),children:(0,n.jsxs)("div",{className:c(d["main-container"]),children:[(0,n.jsx)(X.Z,{className:d["upload-box"],onUploadSuccess:ie,imageUrl:O,defaultImage:J,svgIconName:"icons-workspace-mcp"}),(0,n.jsxs)(u.Z,{form:i,preserve:!1,layout:"vertical",requiredMark:_.N,onFinish:Ne,autoComplete:"off",children:[(0,n.jsx)(u.Z.Item,{name:"name",label:"\u670D\u52A1\u540D\u79F0",rules:[{required:!0,message:"\u8BF7\u8F93\u5165MCP\u670D\u52A1\u540D\u79F0"}],children:(0,n.jsx)(E.Z,{placeholder:"MCP\u670D\u52A1\u540D\u79F0",showCount:!0,maxLength:30})}),(0,n.jsx)(u.Z.Item,{name:"description",label:"\u63CF\u8FF0",rules:[{required:!0,message:"\u8BF7\u8F93\u5165\u63CF\u8FF0\u4F60\u7684MCP\u670D\u52A1"}],children:(0,n.jsx)(E.Z.TextArea,{className:"dispose-textarea-count",placeholder:"\u63CF\u8FF0\u4F60\u7684MCP\u670D\u52A1",showCount:!0,maxLength:1e4,autoSize:{minRows:3,maxRows:5}})}),(0,n.jsx)(u.Z.Item,{name:"installType",label:"\u5B89\u88C5\u65B9\u5F0F",rules:[{required:!0,message:"\u8BF7\u9009\u62E9\u5B89\u88C5\u65B9\u5F0F"}],children:(0,n.jsx)(ee.ZP.Group,{onChange:function(r){var o=r.target.value;x(o),o!==t.l_.COMPONENT?i.setFieldsValue({serverConfig:I[o]}):i.setFieldsValue({serverConfig:""})},value:C,options:b.VR})}),C!==t.l_.COMPONENT?(0,n.jsx)(u.Z.Item,{name:"serverConfig",label:(0,n.jsxs)("div",{className:c("flex","items-center"),children:[(0,n.jsx)("span",{children:"MCP\u670D\u52A1\u914D\u7F6E"}),(0,n.jsx)("span",{className:c(d["sub-title"]),children:"MCP\u670D\u52A1\u4F7F\u7528json\u914D\u7F6E\uFF0C\u63D0\u4EA4\u524D\u786E\u4FDD\u683C\u5F0F\u6B63\u786E"})]}),rules:[{required:!0,message:"\u8BF7\u8F93\u5165MCP\u670D\u52A1\u914D\u7F6E"},{validator:function(r,o){return o?(0,q.tp)(o)?Promise.resolve():Promise.reject(new Error("\u8BF7\u8F93\u5165\u6709\u6548\u7684JSON\u683C\u5F0F")):Promise.resolve()}}],children:(0,n.jsx)(Q.Z,{className:c("w-full","radius-10","overflow-hide"),codeLanguage:k.vQ.JSON,height:"300px",codeOptimizeVisible:!1,value:i.getFieldValue("serverConfig"),onChange:function(r){i.setFieldsValue({serverConfig:r})}})}):(0,n.jsx)(u.Z.Item,{name:"components",label:(0,n.jsx)(G.Z,{label:"\u7EC4\u4EF6\u9009\u62E9"}),children:(0,n.jsx)(W.Z,{className:c(d["collapse-container"]),items:xe,defaultActiveKey:fe})})]})]})}),(0,n.jsx)(Y.Z,{open:me,onCancel:function(){return pe(!1)},checkTag:ve,addComponents:Ce,onAdded:ge})]})},le=re}}]);})();
