"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4220],{429397:function(ut,Z,x){x.d(Z,{A:function(){return H}});var J=x(293287);function H(b,l){b.accDescr&&l.setAccDescription?.(b.accDescr),b.accTitle&&l.setAccTitle?.(b.accTitle),b.title&&l.setDiagramTitle?.(b.title)}(0,J.e)(H,"populateCommonDb")},854220:function(ut,Z,x){x.d(Z,{diagram:function(){return Bt}});var J=x(429397),H=x(795142),b=x(823535),l=x(874128),F=x(653002),r=x(293287),ht=x(462839),et=(0,r.e)(()=>({domains:new Map,transitions:[]}),"createDefaultData"),U=et(),xt=(0,r.e)(()=>U.domains,"getDomains"),gt=(0,r.e)(()=>U.transitions,"getTransitions"),$t=(0,r.e)(t=>{if(t)for(const e of t){const n=e.domain,o=(e.items??[]).map(c=>({label:c.label}));U.domains.set(n,{name:n,items:o})}},"setDomains"),bt=(0,r.e)(t=>{t&&(U.transitions=t.filter(e=>e.from===e.to?(F.c.warn(`Cynefin: self-loop transition on domain "${e.from}" is not meaningful and will be skipped.`),!1):!0).map(e=>({from:e.from,to:e.to,label:e.label||void 0})))},"setTransitions"),_t=(0,r.e)(()=>(0,b.Rb)({...l.vZ.cynefin,...(0,l.iE)().cynefin}),"getConfig"),Ct=(0,r.e)(()=>{(0,l.ZH)(),U=et()},"clear"),G={getDomains:xt,getTransitions:gt,setDomains:$t,setTransitions:bt,getConfig:_t,clear:Ct,setAccTitle:l.GN,getAccTitle:l.eu,setDiagramTitle:l.g2,getDiagramTitle:l.Kr,getAccDescription:l.Mx,setAccDescription:l.U$},Dt=(0,r.e)(t=>{(0,J.A)(t,G),G.setDomains(t.domains),G.setTransitions(t.transitions)},"populate"),wt={parse:(0,r.e)(async t=>{const e=await(0,ht.Qc)("cynefin",t);F.c.debug(e),Dt(e)},"parse")};function V(t){let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}(0,r.e)(V,"seededRandom");function nt(t){let e=0;for(let n=0;n<t.length;n++){const o=t.charCodeAt(n);e=(e<<5)-e+o,e|=0}return e}(0,r.e)(nt,"hashString");function ot(t,e){return typeof t=="number"&&Number.isFinite(t)&&t!==0?t:nt(e)}(0,r.e)(ot,"resolveSeed");function at(t,e,n,o){const c=t/2,p=o??t*.015,T=7,S=e/T,f=[];for(let a=0;a<=T;a++){const y=V(n+a*17)*p*2-p;f.push({x:c+y,y:a*S})}let A=`M${f[0].x},${f[0].y}`;for(let a=0;a<f.length-1;a++){const y=f[a],s=f[a+1],m=(y.y+s.y)/2,D=a%2===0?1:-1,g=p*1.5*D*V(n+a*31+7),z=y.x+g,Y=m,j=s.x-g;A+=` C${z},${Y} ${j},${m} ${s.x},${s.y}`}return A}(0,r.e)(at,"generateFoldPath");function rt(t,e,n,o){const c=e/2,p=o??e*.015,T=7,S=t/T,f=[];for(let a=0;a<=T;a++){const y=V(n+a*23)*p*2-p;f.push({x:a*S,y:c+y})}let A=`M${f[0].x},${f[0].y}`;for(let a=0;a<f.length-1;a++){const y=f[a],s=f[a+1],m=(y.x+s.x)/2,D=a%2===0?1:-1,g=p*1.5*D*V(n+a*37+11),z=m,Y=y.y+g,j=m,O=s.y-g;A+=` C${z},${Y} ${j},${O} ${s.x},${s.y}`}return A}(0,r.e)(rt,"generateHorizontalBoundary");function it(t,e){const n=t/2,o=e*.5,c=e,p=t*.03;return[`M${n},${o}`,`C${n+p},${o+(c-o)*.2}`,`${n-p*1.5},${o+(c-o)*.55}`,`${n+p*.5},${o+(c-o)*.75}`,`C${n-p},${o+(c-o)*.85}`,`${n+p*.3},${o+(c-o)*.95}`,`${n},${c}`].join(" ")}(0,r.e)(it,"generateCliffPath");function st(t,e,n,o){return[`M${t-n},${e}`,`A${n},${o} 0 1,1 ${t+n},${e}`,`A${n},${o} 0 1,1 ${t-n},${e}`,"Z"].join(" ")}(0,r.e)(st,"generateConfusionPath");var ct={complex:{model:"Probe \u2192 Sense \u2192 Respond",practice:"Emergent Practices"},complicated:{model:"Sense \u2192 Analyse \u2192 Respond",practice:"Good Practices"},clear:{model:"Sense \u2192 Categorise \u2192 Respond",practice:"Best Practices"},chaotic:{model:"Act \u2192 Sense \u2192 Respond",practice:"Novel Practices"},confusion:{model:"",practice:"Disorder"}},vt=(0,r.e)((t,e)=>{const n=t/2,o=e/2;return{complex:{cx:n/2,cy:o/2,x:0,y:0,w:n,h:o},complicated:{cx:n+n/2,cy:o/2,x:n,y:0,w:n,h:o},chaotic:{cx:n/2,cy:o+o/2,x:0,y:o,w:n,h:o},clear:{cx:n+n/2,cy:o+o/2,x:n,y:o,w:n,h:o},confusion:{cx:n,cy:o,x:n*.7,y:o*.7,w:n*.6,h:o*.6}}},"getDomainLayouts"),Tt=(0,r.e)(()=>{const t=(0,l.xN)(),e=(0,l.iE)();return(0,b.Rb)(t,e.themeVariables).cynefin},"getCynefinDomainColors"),Q=3,At=(0,r.e)((t,e,n,o)=>{const c=o.db,p=c.getDomains(),T=c.getTransitions(),S=c.getDiagramTitle(),f=c.getAccTitle(),A=c.getAccDescription(),a=c.getConfig(),y=Tt();F.c.debug("Rendering Cynefin diagram");const s=a.width,m=a.height,D=a.padding,g=a.showDomainDescriptions,z=a.boundaryAmplitude,Y=s+D*2,j=m+D*2,O={complex:y.complexBg,complicated:y.complicatedBg,clear:y.clearBg,chaotic:y.chaoticBg,confusion:y.confusionBg},E=(0,H.P)(e);(0,l.v2)(E,j,Y,a.useMaxWidth??!0),E.attr("viewBox",`0 0 ${Y} ${j}`),f&&E.append("title").text(f),A&&E.append("desc").text(A);const k=E.append("g").attr("transform",`translate(${D}, ${D})`),K=vt(s,m),lt=ot(a.seed,e),Lt=k.append("g").attr("class","cynefin-backgrounds"),q=["complex","complicated","chaotic","clear"];for(const d of q){const i=K[d];Lt.append("rect").attr("class","cynefinDomain").attr("x",i.x).attr("y",i.y).attr("width",i.w).attr("height",i.h).attr("fill",O[d]).attr("fill-opacity",.4).attr("stroke","none")}const tt=k.append("g").attr("class","cynefin-boundaries");tt.append("path").attr("class","cynefinBoundary").attr("d",at(s,m,lt,z)).attr("fill","none"),tt.append("path").attr("class","cynefinBoundary").attr("d",rt(s,m,lt+100,z)).attr("fill","none"),tt.append("path").attr("class","cynefinCliff").attr("d",it(s,m)).attr("fill","none");const Ot=s*.15,Wt=m*.15;k.append("path").attr("class","cynefinConfusion").attr("d",st(s/2,m/2,Ot,Wt)).attr("fill",O.confusion).attr("fill-opacity",.5);const dt=k.append("g").attr("class","cynefin-labels");for(const d of q){const i=K[d];dt.append("text").attr("class","cynefinDomainLabel").attr("x",i.cx).attr("y",g?i.cy-30:i.cy).attr("text-anchor","middle").attr("dominant-baseline","middle").text(d.charAt(0).toUpperCase()+d.slice(1))}if(dt.append("text").attr("class","cynefinDomainLabel").attr("x",s/2).attr("y",g?m/2-10:m/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text("Confusion"),g){const d=k.append("g").attr("class","cynefin-subtitles");for(const i of q){const h=K[i],u=ct[i];d.append("text").attr("class","cynefinSubtitle").attr("x",h.cx).attr("y",h.cy-10).attr("text-anchor","middle").attr("dominant-baseline","middle").text(u.model),d.append("text").attr("class","cynefinSubtitle").attr("x",h.cx).attr("y",h.cy+5).attr("text-anchor","middle").attr("dominant-baseline","middle").text(u.practice)}d.append("text").attr("class","cynefinSubtitle").attr("x",s/2).attr("y",m/2+8).attr("text-anchor","middle").attr("dominant-baseline","middle").text(ct.confusion.practice)}const ft=k.append("g").attr("class","cynefin-items"),M=26,mt=10,It=["complex","complicated","chaotic","clear","confusion"];for(const d of It){const i=p.get(d);if(!i||i.items.length===0)continue;const h=K[d],u=d==="confusion";let W=i.items,I=0;u&&i.items.length>Q&&(I=i.items.length-Q,W=i.items.slice(0,Q));let P;if(u){const _=g?22:14;P=h.cy+_}else P=h.cy+(g?25:15);if([...W].forEach((_,B)=>{const w=P+B*(M+4),L=ft.append("g"),R=L.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",M/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(_.label);let C=_.label.length*7;const $=R.node();if($&&typeof $.getBBox=="function"){const X=$.getBBox();X.width>0&&(C=X.width)}const v=C+mt*2,N=h.cx-v/2;L.attr("transform",`translate(${N}, ${w})`),L.insert("rect","text").attr("class","cynefinItem").attr("x",0).attr("y",0).attr("width",v).attr("height",M).attr("rx",4).attr("ry",4).attr("fill",O[d]).attr("fill-opacity",.95),R.attr("x",v/2).attr("y",M/2)}),I>0){const _=P+W.length*(M+4),B=`+${I} more`,w=ft.append("g"),L=w.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",M/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(B);let R=B.length*7;const C=L.node();if(C&&typeof C.getBBox=="function"){const N=C.getBBox();N.width>0&&(R=N.width)}const $=R+mt*2,v=h.cx-$/2;w.attr("transform",`translate(${v}, ${_})`),w.insert("rect","text").attr("class","cynefinItemOverflow").attr("x",0).attr("y",0).attr("width",$).attr("height",M).attr("rx",4).attr("ry",4).attr("fill",O[d]).attr("fill-opacity",.6),L.attr("x",$/2).attr("y",M/2)}}if(T.length>0){const d=E.select("defs").empty()?E.append("defs"):E.select("defs"),i=`cynefin-arrow-${e}`;d.append("marker").attr("id",i).attr("viewBox","0 0 10 10").attr("refX",9).attr("refY",5).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto-start-reverse").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","cynefinArrowHead");const h=k.append("g").attr("class","cynefin-arrows");T.forEach(u=>{const W=K[u.from],I=K[u.to];if(!W||!I)return;if(u.from===u.to){F.c.warn(`Cynefin renderer: skipping self-loop on domain "${u.from}"`);return}const P=W.cx,_=W.cy,B=I.cx,w=I.cy,L=(P+B)/2,R=(_+w)/2,C=B-P,$=w-_,v=Math.sqrt(C*C+$*$),N=v*.15,X=-$/v,Rt=C/v,pt=L+X*N,yt=R+Rt*N;h.append("path").attr("class","cynefinArrowLine").attr("d",`M${P},${_} Q${pt},${yt} ${B},${w}`).attr("fill","none").attr("marker-end",`url(#${i})`),u.label&&h.append("text").attr("class","cynefinArrowLabel").attr("x",pt).attr("y",yt-6).attr("text-anchor","middle").attr("dominant-baseline","auto").text(u.label)})}S&&k.append("text").attr("class","cynefinTitle").attr("x",s/2).attr("y",-D/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text(S)},"draw"),Et={draw:At},kt=(0,r.e)(()=>{const t=(0,l.xN)(),e=(0,l.iE)();return(0,b.Rb)(t,e.themeVariables).cynefin},"getCynefinTheme"),Mt=(0,r.e)(()=>{const t=kt();return`
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
	`},"styles"),Pt=Mt,Bt={parser:wt,db:G,renderer:Et,styles:Pt}}}]);
