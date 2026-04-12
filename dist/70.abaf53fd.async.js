"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[70],{76308:function(N,x,c){c.d(x,{A:function(){return h}});var C=c(5750);function h(o,i){o.accDescr&&i.setAccDescription?.(o.accDescr),o.accTitle&&i.setAccTitle?.(o.accTitle),o.title&&i.setDiagramTitle?.(o.title)}(0,C.eW)(h,"populateCommonDb")},40070:function(N,x,c){c.d(x,{diagram:function(){return nt}});var C=c(3711),h=c(76308),o=c(15514),i=c(55639),r=c(5750),j=c(73995),g=c(18701),P=i.vZ.pie,E={sections:new Map,showData:!1,config:P},f=E.sections,A=E.showData,z=structuredClone(P),V=(0,r.eW)(()=>structuredClone(z),"getConfig"),X=(0,r.eW)(()=>{f=new Map,A=E.showData,(0,i.ZH)()},"clear"),H=(0,r.eW)(({label:t,value:a})=>{if(a<0)throw new Error(`"${t}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);f.has(t)||(f.set(t,a),r.cM.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),Q=(0,r.eW)(()=>f,"getSections"),Z=(0,r.eW)(t=>{A=t},"setShowData"),J=(0,r.eW)(()=>A,"getShowData"),O={getConfig:V,clear:X,setDiagramTitle:i.g2,getDiagramTitle:i.Kr,setAccTitle:i.GN,getAccTitle:i.eu,setAccDescription:i.U$,getAccDescription:i.Mx,addSection:H,getSections:Q,setShowData:Z,getShowData:J},Y=(0,r.eW)((t,a)=>{(0,h.A)(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),q={parse:(0,r.eW)(async t=>{const a=await(0,j.Qc)("pie",t);r.cM.debug(a),Y(a,O)},"parse")},tt=(0,r.eW)(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
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
`,"getStyles"),et=tt,at=(0,r.eW)(t=>{const a=[...t.values()].reduce((s,d)=>s+d,0),$=[...t.entries()].map(([s,d])=>({label:s,value:d})).filter(s=>s.value/a*100>=1);return(0,g.ve8)().value(s=>s.value).sort(null)($)},"createPieArcs"),it=(0,r.eW)((t,a,$,y)=>{r.cM.debug(`rendering pie chart
`+t);const s=y.db,d=(0,i.nV)(),R=(0,o.Rb)(s.getConfig(),d.pie),B=40,l=18,m=4,p=450,_=p,T=(0,C.P)(a),u=T.append("g");u.attr("transform","translate("+_/2+","+p/2+")");const{themeVariables:n}=d;let[k]=(0,o.VG)(n.pieOuterStrokeWidth);k??(k=2);const L=R.textPosition,v=Math.min(_,p)/2-B,st=(0,g.Nb1)().innerRadius(0).outerRadius(v),ct=(0,g.Nb1)().innerRadius(v*L).outerRadius(v*L);u.append("circle").attr("cx",0).attr("cy",0).attr("r",v+k/2).attr("class","pieOuterCircle");const D=s.getSections(),ot=at(D),lt=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12];let S=0;D.forEach(e=>{S+=e});const I=ot.filter(e=>(e.data.value/S*100).toFixed(0)!=="0"),w=(0,g.PKp)(lt).domain([...D.keys()]);u.selectAll("mySlices").data(I).enter().append("path").attr("d",st).attr("fill",e=>w(e.data.label)).attr("class","pieCircle"),u.selectAll("mySlices").data(I).enter().append("text").text(e=>(e.data.value/S*100).toFixed(0)+"%").attr("transform",e=>"translate("+ct.centroid(e)+")").style("text-anchor","middle").attr("class","slice");const dt=u.append("text").text(s.getDiagramTitle()).attr("x",0).attr("y",-(p-50)/2).attr("class","pieTitleText"),b=[...D.entries()].map(([e,M])=>({label:e,value:M})),W=u.selectAll(".legend").data(b).enter().append("g").attr("class","legend").attr("transform",(e,M)=>{const K=l+m,gt=K*b.length/2,ft=12*l,mt=M*K-gt;return"translate("+ft+","+mt+")"});W.append("rect").attr("width",l).attr("height",l).style("fill",e=>w(e.label)).style("stroke",e=>w(e.label)),W.append("text").attr("x",l+m).attr("y",l-m).text(e=>s.getShowData()?`${e.label} [${e.value}]`:e.label);const pt=Math.max(...W.selectAll("text").nodes().map(e=>e?.getBoundingClientRect().width??0)),ut=_+B+l+m+pt,U=dt.node()?.getBoundingClientRect().width??0,_t=_/2-U/2,ht=_/2+U/2,G=Math.min(0,_t),F=Math.max(ut,ht)-G;T.attr("viewBox",`${G} 0 ${F} ${p}`),(0,i.v2)(T,p,F,R.useMaxWidth)},"draw"),rt={draw:it},nt={parser:q,db:O,renderer:rt,styles:et}}}]);})();
