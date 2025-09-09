"use strict";(()=>{(self.webpackChunk=self.webpackChunk||[]).push([[9760],{91999:function(O,M,p){p.d(M,{A:function(){return v}});var A=p(27246);function v(m,n){m.accDescr&&n.setAccDescription?.(m.accDescr),m.accTitle&&n.setAccTitle?.(m.accTitle),m.title&&n.setDiagramTitle?.(m.title)}(0,A.eW)(v,"populateCommonDb")},39760:function(O,M,p){p.d(M,{diagram:function(){return J}});var A=p(91999),v=p(11495),m=p(402),n=p(27246),D=p(7853),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},W={axes:[],curves:[],options:_},x=structuredClone(W),P=n.vZ.radar,R=(0,n.eW)(()=>(0,v.Rb)({...P,...(0,n.iE)().radar}),"getConfig"),w=(0,n.eW)(()=>x.axes,"getAxes"),k=(0,n.eW)(()=>x.curves,"getCurves"),I=(0,n.eW)(()=>x.options,"getOptions"),S=(0,n.eW)(a=>{x.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),B=(0,n.eW)(a=>{x.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:F(t.entries)}))},"setCurves"),F=(0,n.eW)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=w();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(s=>s.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),j=(0,n.eW)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});x.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule}},"setOptions"),G=(0,n.eW)(()=>{(0,n.ZH)(),x=structuredClone(W)},"clear"),$={getAxes:w,getCurves:k,getOptions:I,setAxes:S,setCurves:B,setOptions:j,getConfig:R,clear:G,setAccTitle:n.GN,getAccTitle:n.eu,setDiagramTitle:n.g2,getDiagramTitle:n.Kr,getAccDescription:n.Mx,setAccDescription:n.U$},U=(0,n.eW)(a=>{(0,A.A)(a,$);const{axes:t,curves:e,options:r}=a;$.setAxes(t),$.setCurves(e),$.setOptions(r)},"populate"),K={parse:(0,n.eW)(async a=>{const t=await(0,D.Qc)("radar",a);n.cM.debug(t),U(t)},"parse")},z=(0,n.eW)((a,t,e,r)=>{const s=r.db,i=s.getAxes(),l=s.getCurves(),o=s.getOptions(),c=s.getConfig(),d=s.getDiagramTitle(),h=(0,m.P)(t),u=H(h,c),g=o.max??Math.max(...l.map(C=>Math.max(...C.entries))),f=o.min,y=Math.min(c.width,c.height)/2;V(u,i,y,o.ticks,o.graticule),N(u,i,y,c),L(u,i,l,f,g,o.graticule,c),T(u,l,o.showLegend,c),u.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-c.height/2-c.marginTop)},"draw"),H=(0,n.eW)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,s={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return a.attr("viewbox",`0 0 ${e} ${r}`).attr("width",e).attr("height",r),a.append("g").attr("transform",`translate(${s.x}, ${s.y})`)},"drawFrame"),V=(0,n.eW)((a,t,e,r,s)=>{if(s==="circle")for(let i=0;i<r;i++){const l=e*(i+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(s==="polygon"){const i=t.length;for(let l=0;l<r;l++){const o=e*(l+1)/r,c=t.map((d,h)=>{const u=2*h*Math.PI/i-Math.PI/2,g=o*Math.cos(u),f=o*Math.sin(u);return`${g},${f}`}).join(" ");a.append("polygon").attr("points",c).attr("class","radarGraticule")}}},"drawGraticule"),N=(0,n.eW)((a,t,e,r)=>{const s=t.length;for(let i=0;i<s;i++){const l=t[i].label,o=2*i*Math.PI/s-Math.PI/2;a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*Math.cos(o)).attr("y2",e*r.axisScaleFactor*Math.sin(o)).attr("class","radarAxisLine"),a.append("text").text(l).attr("x",e*r.axisLabelFactor*Math.cos(o)).attr("y",e*r.axisLabelFactor*Math.sin(o)).attr("class","radarAxisLabel")}},"drawAxes");function L(a,t,e,r,s,i,l){const o=t.length,c=Math.min(l.width,l.height)/2;e.forEach((d,h)=>{if(d.entries.length!==o)return;const u=d.entries.map((g,f)=>{const y=2*Math.PI*f/o-Math.PI/2,C=b(g,r,s,c),q=C*Math.cos(y),tt=C*Math.sin(y);return{x:q,y:tt}});i==="circle"?a.append("path").attr("d",E(u,l.curveTension)).attr("class",`radarCurve-${h}`):i==="polygon"&&a.append("polygon").attr("points",u.map(g=>`${g.x},${g.y}`).join(" ")).attr("class",`radarCurve-${h}`)})}(0,n.eW)(L,"drawCurves");function b(a,t,e,r){const s=Math.min(Math.max(a,t),e);return r*(s-t)/(e-t)}(0,n.eW)(b,"relativeRadius");function E(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let s=0;s<e;s++){const i=a[(s-1+e)%e],l=a[s],o=a[(s+1)%e],c=a[(s+2)%e],d={x:l.x+(o.x-i.x)*t,y:l.y+(o.y-i.y)*t},h={x:o.x-(c.x-l.x)*t,y:o.y-(c.y-l.y)*t};r+=` C${d.x},${d.y} ${h.x},${h.y} ${o.x},${o.y}`}return`${r} Z`}(0,n.eW)(E,"closedRoundCurve");function T(a,t,e,r){if(!e)return;const s=(r.width/2+r.marginRight)*3/4,i=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((o,c)=>{const d=a.append("g").attr("transform",`translate(${s}, ${i+c*l})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${c}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(o.label)})}(0,n.eW)(T,"drawLegend");var X={draw:z},Y=(0,n.eW)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const s=a[`cScale${r}`];e+=`
		.radarCurve-${r} {
			color: ${s};
			fill: ${s};
			fill-opacity: ${t.curveOpacity};
			stroke: ${s};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${r} {
			fill: ${s};
			fill-opacity: ${t.curveOpacity};
			stroke: ${s};
		}
		`}return e},"genIndexStyles"),Z=(0,n.eW)(a=>{const t=(0,n.xN)(),e=(0,n.iE)(),r=(0,v.Rb)(t,e.themeVariables),s=(0,v.Rb)(r.radar,a);return{themeVariables:r,radarOptions:s}},"buildRadarStyleOptions"),Q=(0,n.eW)(({radar:a}={})=>{const{themeVariables:t,radarOptions:e}=Z(a);return`
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
		dominant-baseline: middle;
		text-anchor: middle;
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
	${Y(t,e)}
	`},"styles"),J={parser:K,db:$,renderer:X,styles:Q}}}]);})();
