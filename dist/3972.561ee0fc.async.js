"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[3972],{436781:function(k,w,m){m.d(w,{S:function(){return y}});var E=m(769120);function y(g,u){g.accDescr&&u.setAccDescription?.(g.accDescr),g.accTitle&&u.setAccTitle?.(g.accTitle),g.title&&u.setDiagramTitle?.(g.title)}(0,E.K)(y,"populateCommonDb")},743972:function(k,w,m){m.d(w,{diagram:function(){return et}});var E=m(436781),y=m(970870),g=m(698981),u=m(767767),D=m(294654),i=m(769120),I=m(834872),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},M=32,L={axes:[],curves:[],options:_},v=structuredClone(L),R=u.UI.radar,S=(0,i.K)(()=>(0,g.$t)({...R,...(0,u.zj)().radar}),"getConfig"),K=(0,i.K)(()=>v.axes,"getAxes"),W=(0,i.K)(()=>v.curves,"getCurves"),B=(0,i.K)(()=>v.options,"getOptions"),F=(0,i.K)(a=>{v.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),U=(0,i.K)(a=>{v.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:j(t.entries)}))},"setCurves"),j=(0,i.K)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=K();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(n=>n.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),z=(0,i.K)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});v.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule},v.options.ticks>M&&(D.R.warn(`Radar diagram ticks (${v.options.ticks}) exceeds maximum allowed (${M}). Using ${M} instead.`),v.options.ticks=M)},"setOptions"),G=(0,i.K)(()=>{(0,u.IU)(),v=structuredClone(L)},"clear"),$={getAxes:K,getCurves:W,getOptions:B,setAxes:F,setCurves:U,setOptions:z,getConfig:S,clear:G,setAccTitle:u.SV,getAccTitle:u.iN,setDiagramTitle:u.ke,getDiagramTitle:u.ab,getAccDescription:u.m7,setAccDescription:u.EI},V=(0,i.K)(a=>{(0,E.S)(a,$);const{axes:t,curves:e,options:r}=a;$.setAxes(t),$.setCurves(e),$.setOptions(r)},"populate"),Y={parse:(0,i.K)(async a=>{const t=await(0,I.qg)("radar",a);D.R.debug(t),V(t)},"parse")},Z=(0,i.K)((a,t,e,r)=>{const n=r.db,c=n.getAxes(),l=n.getCurves(),s=n.getOptions(),o=n.getConfig(),d=n.getDiagramTitle(),h=(0,y.D)(t),p=H(h,o),x=s.max??Math.max(...l.map(A=>Math.max(...A.entries))),C=s.min,f=Math.min(o.width,o.height)/2;X(p,c,f,s.ticks,s.graticule),J(p,c,f,o),O(p,c,l,C,x,s.graticule,o),P(p,l,s.showLegend,o),p.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-o.height/2-o.marginTop)},"draw"),H=(0,i.K)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return(0,u.a$)(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`).attr("overflow","visible"),a.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),X=(0,i.K)((a,t,e,r,n)=>{if(n==="circle")for(let c=0;c<r;c++){const l=e*(c+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(n==="polygon"){const c=t.length;for(let l=0;l<r;l++){const s=e*(l+1)/r,o=t.map((d,h)=>{const p=2*h*Math.PI/c-Math.PI/2,x=s*Math.cos(p),C=s*Math.sin(p);return`${x},${C}`}).join(" ");a.append("polygon").attr("points",o).attr("class","radarGraticule")}}},"drawGraticule"),J=(0,i.K)((a,t,e,r)=>{const n=t.length;for(let c=0;c<n;c++){const l=t[c].label,s=2*c*Math.PI/n-Math.PI/2,o=Math.cos(s),d=Math.sin(s);a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*o).attr("y2",e*r.axisScaleFactor*d).attr("class","radarAxisLine");const h=o>.01?"start":o<-.01?"end":"middle",p=d>.01?"hanging":d<-.01?"auto":"central",x=4;a.append("text").text(l).attr("x",e*r.axisLabelFactor*o+x*o).attr("y",e*r.axisLabelFactor*d+x*d).attr("text-anchor",h).attr("dominant-baseline",p).attr("class","radarAxisLabel")}},"drawAxes");function O(a,t,e,r,n,c,l){const s=t.length,o=Math.min(l.width,l.height)/2;e.forEach((d,h)=>{if(d.entries.length!==s)return;const p=d.entries.map((x,C)=>{const f=2*Math.PI*C/s-Math.PI/2,A=T(x,r,n,o),at=A*Math.cos(f),rt=A*Math.sin(f);return{x:at,y:rt}});c==="circle"?a.append("path").attr("d",b(p,l.curveTension)).attr("class",`radarCurve-${h}`):c==="polygon"&&a.append("polygon").attr("points",p.map(x=>`${x.x},${x.y}`).join(" ")).attr("class",`radarCurve-${h}`)})}(0,i.K)(O,"drawCurves");function T(a,t,e,r){const n=Math.min(Math.max(a,t),e);return r*(n-t)/(e-t)}(0,i.K)(T,"relativeRadius");function b(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let n=0;n<e;n++){const c=a[(n-1+e)%e],l=a[n],s=a[(n+1)%e],o=a[(n+2)%e],d={x:l.x+(s.x-c.x)*t,y:l.y+(s.y-c.y)*t},h={x:s.x-(o.x-l.x)*t,y:s.y-(o.y-l.y)*t};r+=` C${d.x},${d.y} ${h.x},${h.y} ${s.x},${s.y}`}return`${r} Z`}(0,i.K)(b,"closedRoundCurve");function P(a,t,e,r){if(!e)return;const n=(r.width/2+r.marginRight)*3/4,c=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((s,o)=>{const d=a.append("g").attr("transform",`translate(${n}, ${c+o*l})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${o}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}(0,i.K)(P,"drawLegend");var N={draw:Z},Q=(0,i.K)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const n=a[`cScale${r}`];e+=`
		.radarCurve-${r} {
			color: ${n};
			fill: ${n};
			fill-opacity: ${t.curveOpacity};
			stroke: ${n};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${r} {
			fill: ${n};
			fill-opacity: ${t.curveOpacity};
			stroke: ${n};
		}
		`}return e},"genIndexStyles"),q=(0,i.K)(a=>{const t=(0,u.P$)(),e=(0,u.zj)(),r=(0,g.$t)(t,e.themeVariables),n=(0,g.$t)(r.radar,a);return{themeVariables:r,radarOptions:n}},"buildRadarStyleOptions"),tt=(0,i.K)(({radar:a}={})=>{const{themeVariables:t,radarOptions:e}=q(a);return`
	.radarTitle {
		font-size: ${t.fontSize};
		color: ${t.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${e.axisColor};
		stroke-width: ${e.axisStrokeWidth};
	}
	.radarAxisLabel {
		font-size: ${e.axisLabelFontSize}px;
		color: ${e.axisColor};
	}
	.radarGraticule {
		fill: ${e.graticuleColor};
		fill-opacity: ${e.graticuleOpacity};
		stroke: ${e.graticuleColor};
		stroke-width: ${e.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${e.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${Q(t,e)}
	`},"styles"),et={parser:Y,db:$,renderer:N,styles:tt}}}]);
