"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[704],{436781:function(ut,Z,x){x.d(Z,{S:function(){return V}});var J=x(769120);function V(b,l){b.accDescr&&l.setAccDescription?.(b.accDescr),b.accTitle&&l.setAccTitle?.(b.accTitle),b.title&&l.setDiagramTitle?.(b.title)}(0,J.K)(V,"populateCommonDb")},530704:function(ut,Z,x){x.d(Z,{diagram:function(){return Bt}});var J=x(436781),V=x(970870),b=x(698981),l=x(767767),H=x(294654),r=x(769120),ht=x(834872),et=(0,r.K)(()=>({domains:new Map,transitions:[]}),"createDefaultData"),Y=et(),xt=(0,r.K)(()=>Y.domains,"getDomains"),gt=(0,r.K)(()=>Y.transitions,"getTransitions"),$t=(0,r.K)(t=>{if(t)for(const e of t){const n=e.domain,o=(e.items??[]).map(c=>({label:c.label}));Y.domains.set(n,{name:n,items:o})}},"setDomains"),bt=(0,r.K)(t=>{t&&(Y.transitions=t.filter(e=>e.from===e.to?(H.R.warn(`Cynefin: self-loop transition on domain "${e.from}" is not meaningful and will be skipped.`),!1):!0).map(e=>({from:e.from,to:e.to,label:e.label||void 0})))},"setTransitions"),_t=(0,r.K)(()=>(0,b.$t)({...l.UI.cynefin,...(0,l.zj)().cynefin}),"getConfig"),Ct=(0,r.K)(()=>{(0,l.IU)(),Y=et()},"clear"),G={getDomains:xt,getTransitions:gt,setDomains:$t,setTransitions:bt,getConfig:_t,clear:Ct,setAccTitle:l.SV,getAccTitle:l.iN,setDiagramTitle:l.ke,getDiagramTitle:l.ab,getAccDescription:l.m7,setAccDescription:l.EI},Dt=(0,r.K)(t=>{(0,J.S)(t,G),G.setDomains(t.domains),G.setTransitions(t.transitions)},"populate"),wt={parse:(0,r.K)(async t=>{const e=await(0,ht.qg)("cynefin",t);H.R.debug(e),Dt(e)},"parse")};function F(t){let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}(0,r.K)(F,"seededRandom");function nt(t){let e=0;for(let n=0;n<t.length;n++){const o=t.charCodeAt(n);e=(e<<5)-e+o,e|=0}return e}(0,r.K)(nt,"hashString");function ot(t,e){return typeof t=="number"&&Number.isFinite(t)&&t!==0?t:nt(e)}(0,r.K)(ot,"resolveSeed");function at(t,e,n,o){const c=t/2,p=o??t*.015,T=7,S=e/T,f=[];for(let a=0;a<=T;a++){const y=F(n+a*17)*p*2-p;f.push({x:c+y,y:a*S})}let A=`M${f[0].x},${f[0].y}`;for(let a=0;a<f.length-1;a++){const y=f[a],s=f[a+1],m=(y.y+s.y)/2,D=a%2===0?1:-1,g=p*1.5*D*F(n+a*31+7),z=y.x+g,j=m,N=s.x-g;A+=` C${z},${j} ${N},${m} ${s.x},${s.y}`}return A}(0,r.K)(at,"generateFoldPath");function rt(t,e,n,o){const c=e/2,p=o??e*.015,T=7,S=t/T,f=[];for(let a=0;a<=T;a++){const y=F(n+a*23)*p*2-p;f.push({x:a*S,y:c+y})}let A=`M${f[0].x},${f[0].y}`;for(let a=0;a<f.length-1;a++){const y=f[a],s=f[a+1],m=(y.x+s.x)/2,D=a%2===0?1:-1,g=p*1.5*D*F(n+a*37+11),z=m,j=y.y+g,N=m,L=s.y-g;A+=` C${z},${j} ${N},${L} ${s.x},${s.y}`}return A}(0,r.K)(rt,"generateHorizontalBoundary");function it(t,e){const n=t/2,o=e*.5,c=e,p=t*.03;return[`M${n},${o}`,`C${n+p},${o+(c-o)*.2}`,`${n-p*1.5},${o+(c-o)*.55}`,`${n+p*.5},${o+(c-o)*.75}`,`C${n-p},${o+(c-o)*.85}`,`${n+p*.3},${o+(c-o)*.95}`,`${n},${c}`].join(" ")}(0,r.K)(it,"generateCliffPath");function st(t,e,n,o){return[`M${t-n},${e}`,`A${n},${o} 0 1,1 ${t+n},${e}`,`A${n},${o} 0 1,1 ${t-n},${e}`,"Z"].join(" ")}(0,r.K)(st,"generateConfusionPath");var ct={complex:{model:"Probe \u2192 Sense \u2192 Respond",practice:"Emergent Practices"},complicated:{model:"Sense \u2192 Analyse \u2192 Respond",practice:"Good Practices"},clear:{model:"Sense \u2192 Categorise \u2192 Respond",practice:"Best Practices"},chaotic:{model:"Act \u2192 Sense \u2192 Respond",practice:"Novel Practices"},confusion:{model:"",practice:"Disorder"}},vt=(0,r.K)((t,e)=>{const n=t/2,o=e/2;return{complex:{cx:n/2,cy:o/2,x:0,y:0,w:n,h:o},complicated:{cx:n+n/2,cy:o/2,x:n,y:0,w:n,h:o},chaotic:{cx:n/2,cy:o+o/2,x:0,y:o,w:n,h:o},clear:{cx:n+n/2,cy:o+o/2,x:n,y:o,w:n,h:o},confusion:{cx:n,cy:o,x:n*.7,y:o*.7,w:n*.6,h:o*.6}}},"getDomainLayouts"),Tt=(0,r.K)(()=>{const t=(0,l.P$)(),e=(0,l.zj)();return(0,b.$t)(t,e.themeVariables).cynefin},"getCynefinDomainColors"),Q=3,At=(0,r.K)((t,e,n,o)=>{const c=o.db,p=c.getDomains(),T=c.getTransitions(),S=c.getDiagramTitle(),f=c.getAccTitle(),A=c.getAccDescription(),a=c.getConfig(),y=Tt();H.R.debug("Rendering Cynefin diagram");const s=a.width,m=a.height,D=a.padding,g=a.showDomainDescriptions,z=a.boundaryAmplitude,j=s+D*2,N=m+D*2,L={complex:y.complexBg,complicated:y.complicatedBg,clear:y.clearBg,chaotic:y.chaoticBg,confusion:y.confusionBg},k=(0,V.D)(e);(0,l.a$)(k,N,j,a.useMaxWidth??!0),k.attr("viewBox",`0 0 ${j} ${N}`),f&&k.append("title").text(f),A&&k.append("desc").text(A);const E=k.append("g").attr("transform",`translate(${D}, ${D})`),U=vt(s,m),lt=ot(a.seed,e),Kt=E.append("g").attr("class","cynefin-backgrounds"),q=["complex","complicated","chaotic","clear"];for(const d of q){const i=U[d];Kt.append("rect").attr("class","cynefinDomain").attr("x",i.x).attr("y",i.y).attr("width",i.w).attr("height",i.h).attr("fill",L[d]).attr("fill-opacity",.4).attr("stroke","none")}const tt=E.append("g").attr("class","cynefin-boundaries");tt.append("path").attr("class","cynefinBoundary").attr("d",at(s,m,lt,z)).attr("fill","none"),tt.append("path").attr("class","cynefinBoundary").attr("d",rt(s,m,lt+100,z)).attr("fill","none"),tt.append("path").attr("class","cynefinCliff").attr("d",it(s,m)).attr("fill","none");const Lt=s*.15,It=m*.15;E.append("path").attr("class","cynefinConfusion").attr("d",st(s/2,m/2,Lt,It)).attr("fill",L.confusion).attr("fill-opacity",.5);const dt=E.append("g").attr("class","cynefin-labels");for(const d of q){const i=U[d];dt.append("text").attr("class","cynefinDomainLabel").attr("x",i.cx).attr("y",g?i.cy-30:i.cy).attr("text-anchor","middle").attr("dominant-baseline","middle").text(d.charAt(0).toUpperCase()+d.slice(1))}if(dt.append("text").attr("class","cynefinDomainLabel").attr("x",s/2).attr("y",g?m/2-10:m/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text("Confusion"),g){const d=E.append("g").attr("class","cynefin-subtitles");for(const i of q){const h=U[i],u=ct[i];d.append("text").attr("class","cynefinSubtitle").attr("x",h.cx).attr("y",h.cy-10).attr("text-anchor","middle").attr("dominant-baseline","middle").text(u.model),d.append("text").attr("class","cynefinSubtitle").attr("x",h.cx).attr("y",h.cy+5).attr("text-anchor","middle").attr("dominant-baseline","middle").text(u.practice)}d.append("text").attr("class","cynefinSubtitle").attr("x",s/2).attr("y",m/2+8).attr("text-anchor","middle").attr("dominant-baseline","middle").text(ct.confusion.practice)}const ft=E.append("g").attr("class","cynefin-items"),M=26,mt=10,Ot=["complex","complicated","chaotic","clear","confusion"];for(const d of Ot){const i=p.get(d);if(!i||i.items.length===0)continue;const h=U[d],u=d==="confusion";let I=i.items,O=0;u&&i.items.length>Q&&(O=i.items.length-Q,I=i.items.slice(0,Q));let P;if(u){const _=g?22:14;P=h.cy+_}else P=h.cy+(g?25:15);if([...I].forEach((_,B)=>{const w=P+B*(M+4),K=ft.append("g"),R=K.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",M/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(_.label);let C=_.label.length*7;const $=R.node();if($&&typeof $.getBBox=="function"){const X=$.getBBox();X.width>0&&(C=X.width)}const v=C+mt*2,W=h.cx-v/2;K.attr("transform",`translate(${W}, ${w})`),K.insert("rect","text").attr("class","cynefinItem").attr("x",0).attr("y",0).attr("width",v).attr("height",M).attr("rx",4).attr("ry",4).attr("fill",L[d]).attr("fill-opacity",.95),R.attr("x",v/2).attr("y",M/2)}),O>0){const _=P+I.length*(M+4),B=`+${O} more`,w=ft.append("g"),K=w.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",M/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(B);let R=B.length*7;const C=K.node();if(C&&typeof C.getBBox=="function"){const W=C.getBBox();W.width>0&&(R=W.width)}const $=R+mt*2,v=h.cx-$/2;w.attr("transform",`translate(${v}, ${_})`),w.insert("rect","text").attr("class","cynefinItemOverflow").attr("x",0).attr("y",0).attr("width",$).attr("height",M).attr("rx",4).attr("ry",4).attr("fill",L[d]).attr("fill-opacity",.6),K.attr("x",$/2).attr("y",M/2)}}if(T.length>0){const d=k.select("defs").empty()?k.append("defs"):k.select("defs"),i=`cynefin-arrow-${e}`;d.append("marker").attr("id",i).attr("viewBox","0 0 10 10").attr("refX",9).attr("refY",5).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto-start-reverse").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","cynefinArrowHead");const h=E.append("g").attr("class","cynefin-arrows");T.forEach(u=>{const I=U[u.from],O=U[u.to];if(!I||!O)return;if(u.from===u.to){H.R.warn(`Cynefin renderer: skipping self-loop on domain "${u.from}"`);return}const P=I.cx,_=I.cy,B=O.cx,w=O.cy,K=(P+B)/2,R=(_+w)/2,C=B-P,$=w-_,v=Math.sqrt(C*C+$*$),W=v*.15,X=-$/v,Rt=C/v,pt=K+X*W,yt=R+Rt*W;h.append("path").attr("class","cynefinArrowLine").attr("d",`M${P},${_} Q${pt},${yt} ${B},${w}`).attr("fill","none").attr("marker-end",`url(#${i})`),u.label&&h.append("text").attr("class","cynefinArrowLabel").attr("x",pt).attr("y",yt-6).attr("text-anchor","middle").attr("dominant-baseline","auto").text(u.label)})}S&&E.append("text").attr("class","cynefinTitle").attr("x",s/2).attr("y",-D/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text(S)},"draw"),kt={draw:At},Et=(0,r.K)(()=>{const t=(0,l.P$)(),e=(0,l.zj)();return(0,b.$t)(t,e.themeVariables).cynefin},"getCynefinTheme"),Mt=(0,r.K)(()=>{const t=Et();return`
	.cynefinDomain {
		stroke: none;
	}
	.cynefinDomainLabel {
		font-size: ${t.domainFontSize}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	.cynefinSubtitle {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
		font-style: italic;
	}
	.cynefinItem {
		fill-opacity: 0.95;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
	}
	.cynefinItemText {
		font-size: ${t.itemFontSize}px;
		fill: ${t.textColor};
	}
	.cynefinItemOverflow {
		fill-opacity: 0.6;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
	.cynefinBoundary {
		stroke: ${t.boundaryColor};
		stroke-width: ${t.boundaryWidth};
		stroke-dasharray: 6 3;
	}
	.cynefinCliff {
		stroke: ${t.cliffColor};
		stroke-width: ${t.cliffWidth};
	}
	.cynefinConfusion {
		stroke: ${t.boundaryColor};
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
	}
	.cynefinArrowLine {
		stroke: ${t.arrowColor};
		stroke-width: ${t.arrowWidth};
		fill: none;
	}
	.cynefinArrowHead {
		fill: ${t.arrowColor};
		stroke: none;
	}
	.cynefinArrowLabel {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
	}
	.cynefinTitle {
		font-size: ${t.domainFontSize+2}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	`},"styles"),Pt=Mt,Bt={parser:wt,db:G,renderer:kt,styles:Pt}}}]);
