"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[7203],{429397:function(Q,y,s){s.d(y,{A:function(){return A}});var k=s(293287);function A(g,n){g.accDescr&&n.setAccDescription?.(g.accDescr),g.accTitle&&n.setAccTitle?.(g.accTitle),g.title&&n.setDiagramTitle?.(g.title)}(0,k.e)(A,"populateCommonDb")},287203:function(Q,y,s){s.d(y,{diagram:function(){return pt}});var k=s(429397),A=s(795142),g=s(823535),n=s(874128),W=s(653002),c=s(293287),q=s(462839),w=s(735403),U=n.vZ.pie,L={sections:new Map,showData:!1,config:U},P=L.sections,R=L.showData,tt=structuredClone(U),et=(0,c.e)(()=>structuredClone(tt),"getConfig"),at=(0,c.e)(()=>{P=new Map,R=L.showData,(0,n.ZH)()},"clear"),rt=(0,c.e)(({label:t,value:a})=>{if(a<0)throw new Error(`"${t}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);P.has(t)||(P.set(t,a),W.c.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),nt=(0,c.e)(()=>P,"getSections"),it=(0,c.e)(t=>{R=t},"setShowData"),ot=(0,c.e)(()=>R,"getShowData"),z={getConfig:et,clear:at,setDiagramTitle:n.g2,getDiagramTitle:n.Kr,setAccTitle:n.GN,getAccTitle:n.eu,setAccDescription:n.U$,getAccDescription:n.Mx,addSection:rt,getSections:nt,setShowData:it,getShowData:ot},st=(0,c.e)((t,a)=>{(0,k.A)(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),lt={parse:(0,c.e)(async t=>{const a=await(0,q.Qc)("pie",t);W.c.debug(a),st(a,z)},"parse")},ct=(0,c.e)(t=>`
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
`,"getStyles"),dt=ct,ht=(0,c.e)(t=>{const a=[...t.values()].reduce((l,D)=>l+D,0),G=[...t.entries()].map(([l,D])=>({label:l,value:D})).filter(l=>l.value/a*100>=1);return(0,w.ve8)().value(l=>l.value).sort(null)(G)},"createPieArcs"),gt=(0,c.e)((t,a,G,H)=>{W.c.debug(`rendering pie chart
`+t);const l=H.db,D=(0,n.nV)(),f=(0,g.Rb)(l.getConfig(),D.pie),j=40,i=18,h=4,E=450,x=E,b=(0,A.P)(a),$=b.append("g");$.attr("transform","translate("+x/2+","+E/2+")");const{themeVariables:o}=D;let[F]=(0,g.VG)(o.pieOuterStrokeWidth);F??(F=2);const _t=f.legendPosition,Z=f.textPosition,ft=f.donutHole>0&&f.donutHole<=.9?f.donutHole:0,m=Math.min(x,E)/2-j,mt=(0,w.Nb1)().innerRadius(ft*m).outerRadius(m),vt=(0,w.Nb1)().innerRadius(m*Z).outerRadius(m*Z),S=$.append("g");S.append("circle").attr("cx",0).attr("cy",0).attr("r",m+F/2).attr("class","pieOuterCircle");const M=l.getSections(),Dt=ht(M),Ct=[o.pie1,o.pie2,o.pie3,o.pie4,o.pie5,o.pie6,o.pie7,o.pie8,o.pie9,o.pie10,o.pie11,o.pie12];let I=0;M.forEach(e=>{I+=e});const V=Dt.filter(e=>(e.data.value/I*100).toFixed(0)!=="0"),B=(0,w.PKp)(Ct).domain([...M.keys()]);S.selectAll("mySlices").data(V).enter().append("path").attr("d",mt).attr("fill",e=>B(e.data.label)).attr("class",e=>{let r="pieCircle";return f.highlightSlice==="hover"?r+=" highlightedOnHover":f.highlightSlice===e.data.label&&(r+=" highlighted"),r}),S.selectAll("mySlices").data(V).enter().append("text").text(e=>(e.data.value/I*100).toFixed(0)+"%").attr("transform",e=>"translate("+vt.centroid(e)+")").style("text-anchor","middle").attr("class","slice");const Et=$.append("text").text(l.getDiagramTitle()).attr("x",0).attr("y",-(E-50)/2).attr("class","pieTitleText"),T=[...M.entries()].map(([e,r])=>({label:e,value:r})),v=$.selectAll(".legend").data(T).enter().append("g").attr("class","legend");v.append("rect").attr("width",i).attr("height",i).style("fill",e=>B(e.label)).style("stroke",e=>B(e.label)),v.append("text").attr("x",i+h).attr("y",i-h).text(e=>l.getShowData()?`${e.label} [${e.value}]`:e.label);const C=Math.max(...v.selectAll("text").nodes().map(e=>e?.getBoundingClientRect().width??0));let O=E,K=x+j;const d=i+h,N=T.length*d;switch(_t){case"center":v.attr("transform",(e,r)=>{const u=d*T.length/2,p=-C/2-(i+h),_=r*d-u;return"translate("+p+","+_+")"});break;case"top":O+=N,v.attr("transform",(e,r)=>{const u=m,p=-C/2-(i+h),_=r*d-u;return`translate(${p}, ${_})`}),S.attr("transform",()=>`translate(0, ${N+d})`);break;case"bottom":O+=N,v.attr("transform",(e,r)=>{const u=-m-d,p=-C/2-(i+h),_=r*d-u;return"translate("+p+","+_+")"});break;case"left":K+=i+h+C,v.attr("transform",(e,r)=>{const u=d*T.length/2,p=-m-(i+h),_=r*d-u;return"translate("+p+","+_+")"}),S.attr("transform",()=>`translate(${C+i+h}, 0)`);break;case"right":default:K+=i+h+C,v.attr("transform",(e,r)=>{const u=d*T.length/2,p=12*i,_=r*d-u;return"translate("+p+","+_+")"});break}const Y=Et.node()?.getBoundingClientRect().width??0,xt=x/2-Y/2,St=x/2+Y/2,J=Math.min(0,xt),X=Math.max(K,St)-J;b.attr("viewBox",`${J} 0 ${X} ${O}`),(0,n.v2)(b,O,X,f.useMaxWidth)},"draw"),ut={draw:gt},pt={parser:lt,db:z,renderer:ut,styles:dt}}}]);
