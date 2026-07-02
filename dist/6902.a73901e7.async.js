"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[6902],{47489:function(P,A,p){p.d(A,{A:function(){return y}});var E=p(69849);function y(g,u){g.accDescr&&u.setAccDescription?.(g.accDescr),g.accTitle&&u.setAccTitle?.(g.accTitle),g.title&&u.setDiagramTitle?.(g.title)}(0,E.e)(y,"populateCommonDb")},26902:function(P,A,p){p.d(A,{diagram:function(){return tt}});var E=p(47489),y=p(90375),g=p(79655),u=p(90687),R=p(7004),i=p(69849),I=p(62839),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},w={axes:[],curves:[],options:_},v=structuredClone(w),k=u.vZ.radar,W=(0,i.e)(()=>(0,g.Rb)({...k,...(0,u.iE)().radar}),"getConfig"),O=(0,i.e)(()=>v.axes,"getAxes"),B=(0,i.e)(()=>v.curves,"getCurves"),S=(0,i.e)(()=>v.options,"getOptions"),U=(0,i.e)(a=>{v.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),j=(0,i.e)(a=>{v.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:F(t.entries)}))},"setCurves"),F=(0,i.e)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=O();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(n=>n.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),K=(0,i.e)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});v.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule}},"setOptions"),G=(0,i.e)(()=>{(0,u.ZH)(),v=structuredClone(w)},"clear"),C={getAxes:O,getCurves:B,getOptions:S,setAxes:U,setCurves:j,setOptions:K,getConfig:W,clear:G,setAccTitle:u.GN,getAccTitle:u.eu,setDiagramTitle:u.g2,getDiagramTitle:u.Kr,getAccDescription:u.Mx,setAccDescription:u.U$},Y=(0,i.e)(a=>{(0,E.A)(a,C);const{axes:t,curves:e,options:r}=a;C.setAxes(t),C.setCurves(e),C.setOptions(r)},"populate"),z={parse:(0,i.e)(async a=>{const t=await(0,I.Qc)("radar",a);R.c.debug(t),Y(t)},"parse")},V=(0,i.e)((a,t,e,r)=>{const n=r.db,c=n.getAxes(),l=n.getCurves(),s=n.getOptions(),o=n.getConfig(),d=n.getDiagramTitle(),m=(0,y.P)(t),h=Z(m,o),x=s.max??Math.max(...l.map(M=>Math.max(...M.entries))),$=s.min,f=Math.min(o.width,o.height)/2;H(h,c,f,s.ticks,s.graticule),X(h,c,f,o),L(h,c,l,$,x,s.graticule,o),D(h,l,s.showLegend,o),h.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-o.height/2-o.marginTop)},"draw"),Z=(0,i.e)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return(0,u.v2)(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`).attr("overflow","visible"),a.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),H=(0,i.e)((a,t,e,r,n)=>{if(n==="circle")for(let c=0;c<r;c++){const l=e*(c+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(n==="polygon"){const c=t.length;for(let l=0;l<r;l++){const s=e*(l+1)/r,o=t.map((d,m)=>{const h=2*m*Math.PI/c-Math.PI/2,x=s*Math.cos(h),$=s*Math.sin(h);return`${x},${$}`}).join(" ");a.append("polygon").attr("points",o).attr("class","radarGraticule")}}},"drawGraticule"),X=(0,i.e)((a,t,e,r)=>{const n=t.length;for(let c=0;c<n;c++){const l=t[c].label,s=2*c*Math.PI/n-Math.PI/2,o=Math.cos(s),d=Math.sin(s);a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*o).attr("y2",e*r.axisScaleFactor*d).attr("class","radarAxisLine");const m=o>.01?"start":o<-.01?"end":"middle",h=d>.01?"hanging":d<-.01?"auto":"central",x=4;a.append("text").text(l).attr("x",e*r.axisLabelFactor*o+x*o).attr("y",e*r.axisLabelFactor*d+x*d).attr("text-anchor",m).attr("dominant-baseline",h).attr("class","radarAxisLabel")}},"drawAxes");function L(a,t,e,r,n,c,l){const s=t.length,o=Math.min(l.width,l.height)/2;e.forEach((d,m)=>{if(d.entries.length!==s)return;const h=d.entries.map((x,$)=>{const f=2*Math.PI*$/s-Math.PI/2,M=T(x,r,n,o),et=M*Math.cos(f),at=M*Math.sin(f);return{x:et,y:at}});c==="circle"?a.append("path").attr("d",b(h,l.curveTension)).attr("class",`radarCurve-${m}`):c==="polygon"&&a.append("polygon").attr("points",h.map(x=>`${x.x},${x.y}`).join(" ")).attr("class",`radarCurve-${m}`)})}(0,i.e)(L,"drawCurves");function T(a,t,e,r){const n=Math.min(Math.max(a,t),e);return r*(n-t)/(e-t)}(0,i.e)(T,"relativeRadius");function b(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let n=0;n<e;n++){const c=a[(n-1+e)%e],l=a[n],s=a[(n+1)%e],o=a[(n+2)%e],d={x:l.x+(s.x-c.x)*t,y:l.y+(s.y-c.y)*t},m={x:s.x-(o.x-l.x)*t,y:s.y-(o.y-l.y)*t};r+=` C${d.x},${d.y} ${m.x},${m.y} ${s.x},${s.y}`}return`${r} Z`}(0,i.e)(b,"closedRoundCurve");function D(a,t,e,r){if(!e)return;const n=(r.width/2+r.marginRight)*3/4,c=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((s,o)=>{const d=a.append("g").attr("transform",`translate(${n}, ${c+o*l})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${o}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}(0,i.e)(D,"drawLegend");var J={draw:V},N=(0,i.e)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const n=a[`cScale${r}`];e+=`
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
		`}return e},"genIndexStyles"),Q=(0,i.e)(a=>{const t=(0,u.xN)(),e=(0,u.iE)(),r=(0,g.Rb)(t,e.themeVariables),n=(0,g.Rb)(r.radar,a);return{themeVariables:r,radarOptions:n}},"buildRadarStyleOptions"),q=(0,i.e)(({radar:a}={})=>{const{themeVariables:t,radarOptions:e}=Q(a);return`
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
	${N(t,e)}
	`},"styles"),tt={parser:z,db:C,renderer:J,styles:q}}}]);
