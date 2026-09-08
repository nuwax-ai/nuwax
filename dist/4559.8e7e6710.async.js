"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4559],{436781:function(Q,y,s){s.d(y,{S:function(){return w}});var k=s(769120);function w(g,n){g.accDescr&&n.setAccDescription?.(g.accDescr),g.accTitle&&n.setAccTitle?.(g.accTitle),g.title&&n.setDiagramTitle?.(g.title)}(0,k.K)(w,"populateCommonDb")},394559:function(Q,y,s){s.d(y,{diagram:function(){return _t}});var k=s(436781),w=s(970870),g=s(698981),n=s(767767),L=s(294654),c=s(769120),q=s(834872),A=s(644892),z=n.UI.pie,W={sections:new Map,showData:!1,config:z},$=W.sections,R=W.showData,tt=structuredClone(z),et=(0,c.K)(()=>structuredClone(tt),"getConfig"),at=(0,c.K)(()=>{$=new Map,R=W.showData,(0,n.IU)()},"clear"),rt=(0,c.K)(({label:t,value:a})=>{if(a<0)throw new Error(`"${t}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);$.has(t)||($.set(t,a),L.R.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),nt=(0,c.K)(()=>$,"getSections"),it=(0,c.K)(t=>{R=t},"setShowData"),ot=(0,c.K)(()=>R,"getShowData"),F={getConfig:et,clear:at,setDiagramTitle:n.ke,getDiagramTitle:n.ab,setAccTitle:n.SV,getAccTitle:n.iN,setAccDescription:n.EI,getAccDescription:n.m7,addSection:rt,getSections:nt,setShowData:it,getShowData:ot},st=(0,c.K)((t,a)=>{(0,k.S)(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),lt={parse:(0,c.K)(async t=>{const a=await(0,q.qg)("pie",t);L.R.debug(a),st(a,F)},"parse")},ct=(0,c.K)(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),dt=ct,ht=(0,c.K)(t=>{const a=[...t.values()].reduce((l,D)=>l+D,0),H=[...t.entries()].map(([l,D])=>({label:l,value:D})).filter(l=>l.value/a*100>=1);return(0,A.rLf)().value(l=>l.value).sort(null)(H)},"createPieArcs"),gt=(0,c.K)((t,a,H,G)=>{L.R.debug(`rendering pie chart
`+t);const l=G.db,D=(0,n.D7)(),f=(0,g.$t)(l.getConfig(),D.pie),j=40,i=18,h=4,E=450,S=E,K=(0,w.D)(a),O=K.append("g");O.attr("transform","translate("+S/2+","+E/2+")");const{themeVariables:o}=D;let[N]=(0,g.I5)(o.pieOuterStrokeWidth);N??(N=2);const pt=f.legendPosition,Z=f.textPosition,ft=f.donutHole>0&&f.donutHole<=.9?f.donutHole:0,m=Math.min(S,E)/2-j,mt=(0,A.JLW)().innerRadius(ft*m).outerRadius(m),vt=(0,A.JLW)().innerRadius(m*Z).outerRadius(m*Z),x=O.append("g");x.append("circle").attr("cx",0).attr("cy",0).attr("r",m+N/2).attr("class","pieOuterCircle");const P=l.getSections(),Dt=ht(P),Ct=[o.pie1,o.pie2,o.pie3,o.pie4,o.pie5,o.pie6,o.pie7,o.pie8,o.pie9,o.pie10,o.pie11,o.pie12];let I=0;P.forEach(e=>{I+=e});const Y=Dt.filter(e=>(e.data.value/I*100).toFixed(0)!=="0"),b=(0,A.UMr)(Ct).domain([...P.keys()]);x.selectAll("mySlices").data(Y).enter().append("path").attr("d",mt).attr("fill",e=>b(e.data.label)).attr("class",e=>{let r="pieCircle";return f.highlightSlice==="hover"?r+=" highlightedOnHover":f.highlightSlice===e.data.label&&(r+=" highlighted"),r}),x.selectAll("mySlices").data(Y).enter().append("text").text(e=>(e.data.value/I*100).toFixed(0)+"%").attr("transform",e=>"translate("+vt.centroid(e)+")").style("text-anchor","middle").attr("class","slice");const Et=O.append("text").text(l.getDiagramTitle()).attr("x",0).attr("y",-(E-50)/2).attr("class","pieTitleText"),T=[...P.entries()].map(([e,r])=>({label:e,value:r})),v=O.selectAll(".legend").data(T).enter().append("g").attr("class","legend");v.append("rect").attr("width",i).attr("height",i).style("fill",e=>b(e.label)).style("stroke",e=>b(e.label)),v.append("text").attr("x",i+h).attr("y",i-h).text(e=>l.getShowData()?`${e.label} [${e.value}]`:e.label);const C=Math.max(...v.selectAll("text").nodes().map(e=>e?.getBoundingClientRect().width??0));let M=E,B=S+j;const d=i+h,U=T.length*d;switch(pt){case"center":v.attr("transform",(e,r)=>{const u=d*T.length/2,_=-C/2-(i+h),p=r*d-u;return"translate("+_+","+p+")"});break;case"top":M+=U,v.attr("transform",(e,r)=>{const u=m,_=-C/2-(i+h),p=r*d-u;return`translate(${_}, ${p})`}),x.attr("transform",()=>`translate(0, ${U+d})`);break;case"bottom":M+=U,v.attr("transform",(e,r)=>{const u=-m-d,_=-C/2-(i+h),p=r*d-u;return"translate("+_+","+p+")"});break;case"left":B+=i+h+C,v.attr("transform",(e,r)=>{const u=d*T.length/2,_=-m-(i+h),p=r*d-u;return"translate("+_+","+p+")"}),x.attr("transform",()=>`translate(${C+i+h}, 0)`);break;case"right":default:B+=i+h+C,v.attr("transform",(e,r)=>{const u=d*T.length/2,_=12*i,p=r*d-u;return"translate("+_+","+p+")"});break}const J=Et.node()?.getBoundingClientRect().width??0,St=S/2-J/2,xt=S/2+J/2,V=Math.min(0,St),X=Math.max(B,xt)-V;K.attr("viewBox",`${V} 0 ${X} ${M}`),(0,n.a$)(K,M,X,f.useMaxWidth)},"draw"),ut={draw:gt},_t={parser:lt,db:F,renderer:ut,styles:dt}}}]);
