"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[3717],{40578:function(D,A,h){h.d(A,{A:function(){return y}});var W=h(57099);function y(m,d){m.accDescr&&d.setAccDescription?.(m.accDescr),m.accTitle&&d.setAccTitle?.(m.accTitle),m.title&&d.setDiagramTitle?.(m.title)}(0,W.eW)(y,"populateCommonDb")},33717:function(D,A,h){h.d(A,{diagram:function(){return q}});var W=h(47953),y=h(40578),m=h(74128),d=h(98994),o=h(57099),R=h(88642),_={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},E={axes:[],curves:[],options:_},v=structuredClone(E),P=d.vZ.radar,k=(0,o.eW)(()=>(0,m.Rb)({...P,...(0,d.iE)().radar}),"getConfig"),w=(0,o.eW)(()=>v.axes,"getAxes"),I=(0,o.eW)(()=>v.curves,"getCurves"),B=(0,o.eW)(()=>v.options,"getOptions"),S=(0,o.eW)(a=>{v.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),F=(0,o.eW)(a=>{v.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:U(t.entries)}))},"setCurves"),U=(0,o.eW)(a=>{if(a[0].axis==null)return a.map(e=>e.value);const t=w();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{const r=a.find(n=>n.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),G=(0,o.eW)(a=>{const t=a.reduce((e,r)=>(e[r.name]=r,e),{});v.options={showLegend:t.showLegend?.value??_.showLegend,ticks:t.ticks?.value??_.ticks,max:t.max?.value??_.max,min:t.min?.value??_.min,graticule:t.graticule?.value??_.graticule}},"setOptions"),j=(0,o.eW)(()=>{(0,d.ZH)(),v=structuredClone(E)},"clear"),f={getAxes:w,getCurves:I,getOptions:B,setAxes:S,setCurves:F,setOptions:G,getConfig:k,clear:j,setAccTitle:d.GN,getAccTitle:d.eu,setDiagramTitle:d.g2,getDiagramTitle:d.Kr,getAccDescription:d.Mx,setAccDescription:d.U$},K=(0,o.eW)(a=>{(0,y.A)(a,f);const{axes:t,curves:e,options:r}=a;f.setAxes(t),f.setCurves(e),f.setOptions(r)},"populate"),z={parse:(0,o.eW)(async a=>{const t=await(0,R.Qc)("radar",a);o.cM.debug(t),K(t)},"parse")},H=(0,o.eW)((a,t,e,r)=>{const n=r.db,i=n.getAxes(),l=n.getCurves(),s=n.getOptions(),c=n.getConfig(),u=n.getDiagramTitle(),g=(0,W.P)(t),p=J(g,c),x=s.max??Math.max(...l.map(M=>Math.max(...M.entries))),$=s.min,C=Math.min(c.width,c.height)/2;V(p,i,C,s.ticks,s.graticule),Z(p,i,C,c),T(p,i,l,$,x,s.graticule,c),O(p,l,s.showLegend,c),p.append("text").attr("class","radarTitle").text(u).attr("x",0).attr("y",-c.height/2-c.marginTop)},"draw"),J=(0,o.eW)((a,t)=>{const e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return a.attr("viewbox",`0 0 ${e} ${r}`).attr("width",e).attr("height",r),a.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),V=(0,o.eW)((a,t,e,r,n)=>{if(n==="circle")for(let i=0;i<r;i++){const l=e*(i+1)/r;a.append("circle").attr("r",l).attr("class","radarGraticule")}else if(n==="polygon"){const i=t.length;for(let l=0;l<r;l++){const s=e*(l+1)/r,c=t.map((u,g)=>{const p=2*g*Math.PI/i-Math.PI/2,x=s*Math.cos(p),$=s*Math.sin(p);return`${x},${$}`}).join(" ");a.append("polygon").attr("points",c).attr("class","radarGraticule")}}},"drawGraticule"),Z=(0,o.eW)((a,t,e,r)=>{const n=t.length;for(let i=0;i<n;i++){const l=t[i].label,s=2*i*Math.PI/n-Math.PI/2;a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*Math.cos(s)).attr("y2",e*r.axisScaleFactor*Math.sin(s)).attr("class","radarAxisLine"),a.append("text").text(l).attr("x",e*r.axisLabelFactor*Math.cos(s)).attr("y",e*r.axisLabelFactor*Math.sin(s)).attr("class","radarAxisLabel")}},"drawAxes");function T(a,t,e,r,n,i,l){const s=t.length,c=Math.min(l.width,l.height)/2;e.forEach((u,g)=>{if(u.entries.length!==s)return;const p=u.entries.map((x,$)=>{const C=2*Math.PI*$/s-Math.PI/2,M=b(x,r,n,c),tt=M*Math.cos(C),et=M*Math.sin(C);return{x:tt,y:et}});i==="circle"?a.append("path").attr("d",L(p,l.curveTension)).attr("class",`radarCurve-${g}`):i==="polygon"&&a.append("polygon").attr("points",p.map(x=>`${x.x},${x.y}`).join(" ")).attr("class",`radarCurve-${g}`)})}(0,o.eW)(T,"drawCurves");function b(a,t,e,r){const n=Math.min(Math.max(a,t),e);return r*(n-t)/(e-t)}(0,o.eW)(b,"relativeRadius");function L(a,t){const e=a.length;let r=`M${a[0].x},${a[0].y}`;for(let n=0;n<e;n++){const i=a[(n-1+e)%e],l=a[n],s=a[(n+1)%e],c=a[(n+2)%e],u={x:l.x+(s.x-i.x)*t,y:l.y+(s.y-i.y)*t},g={x:s.x-(c.x-l.x)*t,y:s.y-(c.y-l.y)*t};r+=` C${u.x},${u.y} ${g.x},${g.y} ${s.x},${s.y}`}return`${r} Z`}(0,o.eW)(L,"closedRoundCurve");function O(a,t,e,r){if(!e)return;const n=(r.width/2+r.marginRight)*3/4,i=-(r.height/2+r.marginTop)*3/4,l=20;t.forEach((s,c)=>{const u=a.append("g").attr("transform",`translate(${n}, ${i+c*l})`);u.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${c}`),u.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}(0,o.eW)(O,"drawLegend");var N={draw:H},X=(0,o.eW)((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){const n=a[`cScale${r}`];e+=`
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
	`},"styles"),q={parser:z,db:f,renderer:N,styles:Q}}}]);})();
