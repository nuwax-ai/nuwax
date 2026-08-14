"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[6195],{429397:function(k,E,m){m.d(E,{A:function(){return M}});var w=m(293287);function M(g,u){g.accDescr&&u.setAccDescription?.(g.accDescr),g.accTitle&&u.setAccTitle?.(g.accTitle),g.title&&u.setDiagramTitle?.(g.title)}(0,w.e)(M,"populateCommonDb")},546195:function(k,E,m){m.d(E,{diagram:function(){return et}});var w=m(429397),M=m(795142),g=m(823535),u=m(874128),L=m(653002),i=m(293287),I=m(462839),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},y=32,T={axes:[],curves:[],options:_},v=structuredClone(T),S=u.vZ.radar,W=(0,i.e)(()=>(0,g.Rb)({...S,...(0,u.iE)().radar}),"getConfig"),O=(0,i.e)(()=>v.axes,"getAxes"),B=(0,i.e)(()=>v.curves,"getCurves"),K=(0,i.e)(()=>v.options,"getOptions"),U=(0,i.e)(a=>{v.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),j=(0,i.e)(a=>{v.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:F(t.entries)}))},"setCurves"),F=(0,i.e)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=O();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(n=>n.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),G=(0,i.e)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});v.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule},v.options.ticks>y&&(L.c.warn(`Radar diagram ticks (${v.options.ticks}) exceeds maximum allowed (${y}). Using ${y} instead.`),v.options.ticks=y)},"setOptions"),Y=(0,i.e)(()=>{(0,u.ZH)(),v=structuredClone(T)},"clear"),$={getAxes:O,getCurves:B,getOptions:K,setAxes:U,setCurves:j,setOptions:G,getConfig:W,clear:Y,setAccTitle:u.GN,getAccTitle:u.eu,setDiagramTitle:u.g2,getDiagramTitle:u.Kr,getAccDescription:u.Mx,setAccDescription:u.U$},Z=(0,i.e)(a=>{(0,w.A)(a,$);const{axes:t,curves:e,options:r}=a;$.setAxes(t),$.setCurves(e),$.setOptions(r)},"populate"),z={parse:(0,i.e)(async a=>{const t=await(0,I.Qc)("radar",a);L.c.debug(t),Z(t)},"parse")},N=(0,i.e)((a,t,e,r)=>{const n=r.db,c=n.getAxes(),l=n.getCurves(),s=n.getOptions(),o=n.getConfig(),d=n.getDiagramTitle(),h=(0,M.P)(t),p=V(h,o),x=s.max??Math.max(...l.map(A=>Math.max(...A.entries))),C=s.min,f=Math.min(o.width,o.height)/2;H(p,c,f,s.ticks,s.graticule),J(p,c,f,o),b(p,c,l,C,x,s.graticule,o),R(p,l,s.showLegend,o),p.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-o.height/2-o.marginTop)},"draw"),V=(0,i.e)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return(0,u.v2)(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`).attr("overflow","visible"),a.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),H=(0,i.e)((a,t,e,r,n)=>{if(n==="circle")for(let c=0;c<r;c++){const l=e*(c+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(n==="polygon"){const c=t.length;for(let l=0;l<r;l++){const s=e*(l+1)/r,o=t.map((d,h)=>{const p=2*h*Math.PI/c-Math.PI/2,x=s*Math.cos(p),C=s*Math.sin(p);return`${x},${C}`}).join(" ");a.append("polygon").attr("points",o).attr("class","radarGraticule")}}},"drawGraticule"),J=(0,i.e)((a,t,e,r)=>{const n=t.length;for(let c=0;c<n;c++){const l=t[c].label,s=2*c*Math.PI/n-Math.PI/2,o=Math.cos(s),d=Math.sin(s);a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*o).attr("y2",e*r.axisScaleFactor*d).attr("class","radarAxisLine");const h=o>.01?"start":o<-.01?"end":"middle",p=d>.01?"hanging":d<-.01?"auto":"central",x=4;a.append("text").text(l).attr("x",e*r.axisLabelFactor*o+x*o).attr("y",e*r.axisLabelFactor*d+x*d).attr("text-anchor",h).attr("dominant-baseline",p).attr("class","radarAxisLabel")}},"drawAxes");function b(a,t,e,r,n,c,l){const s=t.length,o=Math.min(l.width,l.height)/2;e.forEach((d,h)=>{if(d.entries.length!==s)return;const p=d.entries.map((x,C)=>{const f=2*Math.PI*C/s-Math.PI/2,A=D(x,r,n,o),at=A*Math.cos(f),rt=A*Math.sin(f);return{x:at,y:rt}});c==="circle"?a.append("path").attr("d",P(p,l.curveTension)).attr("class",`radarCurve-${h}`):c==="polygon"&&a.append("polygon").attr("points",p.map(x=>`${x.x},${x.y}`).join(" ")).attr("class",`radarCurve-${h}`)})}(0,i.e)(b,"drawCurves");function D(a,t,e,r){const n=Math.min(Math.max(a,t),e);return r*(n-t)/(e-t)}(0,i.e)(D,"relativeRadius");function P(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let n=0;n<e;n++){const c=a[(n-1+e)%e],l=a[n],s=a[(n+1)%e],o=a[(n+2)%e],d={x:l.x+(s.x-c.x)*t,y:l.y+(s.y-c.y)*t},h={x:s.x-(o.x-l.x)*t,y:s.y-(o.y-l.y)*t};r+=` C${d.x},${d.y} ${h.x},${h.y} ${s.x},${s.y}`}return`${r} Z`}(0,i.e)(P,"closedRoundCurve");function R(a,t,e,r){if(!e)return;const n=(r.width/2+r.marginRight)*3/4,c=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((s,o)=>{const d=a.append("g").attr("transform",`translate(${n}, ${c+o*l})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${o}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}(0,i.e)(R,"drawLegend");var X={draw:N},Q=(0,i.e)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const n=a[`cScale${r}`];e+=`
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
		`}return e},"genIndexStyles"),q=(0,i.e)(a=>{const t=(0,u.xN)(),e=(0,u.iE)(),r=(0,g.Rb)(t,e.themeVariables),n=(0,g.Rb)(r.radar,a);return{themeVariables:r,radarOptions:n}},"buildRadarStyleOptions"),tt=(0,i.e)(({radar:a}={})=>{const{themeVariables:t,radarOptions:e}=q(a);return`
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
	`},"styles"),et={parser:z,db:$,renderer:X,styles:tt}}}]);
