"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[123],{36221:function(b,A,h){h.d(A,{A:function(){return M}});var E=h(22092);function M(m,d){m.accDescr&&d.setAccDescription?.(m.accDescr),m.accTitle&&d.setAccTitle?.(m.accTitle),m.title&&d.setDiagramTitle?.(m.title)}(0,E.eW)(M,"populateCommonDb")},90123:function(b,A,h){h.d(A,{diagram:function(){return q}});var E=h(29798),M=h(36221),m=h(47901),d=h(23661),o=h(22092),R=h(65602),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},W={axes:[],curves:[],options:_},v=structuredClone(W),P=d.vZ.radar,k=(0,o.eW)(()=>(0,m.Rb)({...P,...(0,d.iE)().radar}),"getConfig"),w=(0,o.eW)(()=>v.axes,"getAxes"),I=(0,o.eW)(()=>v.curves,"getCurves"),B=(0,o.eW)(()=>v.options,"getOptions"),G=(0,o.eW)(a=>{v.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),F=(0,o.eW)(a=>{v.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:S(t.entries)}))},"setCurves"),S=(0,o.eW)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=w();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(n=>n.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),K=(0,o.eW)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});v.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule}},"setOptions"),U=(0,o.eW)(()=>{(0,d.ZH)(),v=structuredClone(W)},"clear"),$={getAxes:w,getCurves:I,getOptions:B,setAxes:G,setCurves:F,setOptions:K,getConfig:k,clear:U,setAccTitle:d.GN,getAccTitle:d.eu,setDiagramTitle:d.g2,getDiagramTitle:d.Kr,getAccDescription:d.Mx,setAccDescription:d.U$},j=(0,o.eW)(a=>{(0,M.A)(a,$);const{axes:t,curves:e,options:r}=a;$.setAxes(t),$.setCurves(e),$.setOptions(r)},"populate"),H={parse:(0,o.eW)(async a=>{const t=await(0,R.Qc)("radar",a);o.cM.debug(t),j(t)},"parse")},z=(0,o.eW)((a,t,e,r)=>{const n=r.db,i=n.getAxes(),l=n.getCurves(),s=n.getOptions(),c=n.getConfig(),u=n.getDiagramTitle(),x=(0,E.P)(t),p=N(x,c),g=s.max??Math.max(...l.map(y=>Math.max(...y.entries))),f=s.min,C=Math.min(c.width,c.height)/2;V(p,i,C,s.ticks,s.graticule),Z(p,i,C,c),D(p,i,l,f,g,s.graticule,c),T(p,l,s.showLegend,c),p.append("text").attr("class","radarTitle").text(u).attr("x",0).attr("y",-c.height/2-c.marginTop)},"draw"),N=(0,o.eW)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return(0,d.v2)(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`),a.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),V=(0,o.eW)((a,t,e,r,n)=>{if(n==="circle")for(let i=0;i<r;i++){const l=e*(i+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(n==="polygon"){const i=t.length;for(let l=0;l<r;l++){const s=e*(l+1)/r,c=t.map((u,x)=>{const p=2*x*Math.PI/i-Math.PI/2,g=s*Math.cos(p),f=s*Math.sin(p);return`${g},${f}`}).join(" ");a.append("polygon").attr("points",c).attr("class","radarGraticule")}}},"drawGraticule"),Z=(0,o.eW)((a,t,e,r)=>{const n=t.length;for(let i=0;i<n;i++){const l=t[i].label,s=2*i*Math.PI/n-Math.PI/2;a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*Math.cos(s)).attr("y2",e*r.axisScaleFactor*Math.sin(s)).attr("class","radarAxisLine"),a.append("text").text(l).attr("x",e*r.axisLabelFactor*Math.cos(s)).attr("y",e*r.axisLabelFactor*Math.sin(s)).attr("class","radarAxisLabel")}},"drawAxes");function D(a,t,e,r,n,i,l){const s=t.length,c=Math.min(l.width,l.height)/2;e.forEach((u,x)=>{if(u.entries.length!==s)return;const p=u.entries.map((g,f)=>{const C=2*Math.PI*f/s-Math.PI/2,y=L(g,r,n,c),tt=y*Math.cos(C),et=y*Math.sin(C);return{x:tt,y:et}});i==="circle"?a.append("path").attr("d",O(p,l.curveTension)).attr("class",`radarCurve-${x}`):i==="polygon"&&a.append("polygon").attr("points",p.map(g=>`${g.x},${g.y}`).join(" ")).attr("class",`radarCurve-${x}`)})}(0,o.eW)(D,"drawCurves");function L(a,t,e,r){const n=Math.min(Math.max(a,t),e);return r*(n-t)/(e-t)}(0,o.eW)(L,"relativeRadius");function O(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let n=0;n<e;n++){const i=a[(n-1+e)%e],l=a[n],s=a[(n+1)%e],c=a[(n+2)%e],u={x:l.x+(s.x-i.x)*t,y:l.y+(s.y-i.y)*t},x={x:s.x-(c.x-l.x)*t,y:s.y-(c.y-l.y)*t};r+=` C${u.x},${u.y} ${x.x},${x.y} ${s.x},${s.y}`}return`${r} Z`}(0,o.eW)(O,"closedRoundCurve");function T(a,t,e,r){if(!e)return;const n=(r.width/2+r.marginRight)*3/4,i=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((s,c)=>{const u=a.append("g").attr("transform",`translate(${n}, ${i+c*l})`);u.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${c}`),u.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}(0,o.eW)(T,"drawLegend");var J={draw:z},X=(0,o.eW)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const n=a[`cScale${r}`];e+=`
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
		`}return e},"genIndexStyles"),Y=(0,o.eW)(a=>{const t=(0,d.xN)(),e=(0,d.iE)(),r=(0,m.Rb)(t,e.themeVariables),n=(0,m.Rb)(r.radar,a);return{themeVariables:r,radarOptions:n}},"buildRadarStyleOptions"),Q=(0,o.eW)(({radar:a}={})=>{const{themeVariables:t,radarOptions:e}=Y(a);return`
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
	${X(t,e)}
	`},"styles"),q={parser:H,db:$,renderer:J,styles:Q}}}]);})();
