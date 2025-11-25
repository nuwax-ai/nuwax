"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[5308],{40578:function(K,m,s){s.d(m,{A:function(){return u}});var v=s(57099);function u(c,r){c.accDescr&&r.setAccDescription?.(c.accDescr),c.accTitle&&r.setAccTitle?.(c.accTitle),c.title&&r.setDiagramTitle?.(c.title)}(0,v.eW)(u,"populateCommonDb")},5308:function(K,m,s){s.d(m,{diagram:function(){return re}});var v=s(47953),u=s(40578),c=s(74128),r=s(98994),i=s(57099),F=s(88642),g=s(21489),P=r.vZ.pie,E={sections:new Map,showData:!1,config:P},f=E.sections,C=E.showData,N=structuredClone(P),j=(0,i.eW)(()=>structuredClone(N),"getConfig"),z=(0,i.eW)(()=>{f=new Map,C=E.showData,(0,r.ZH)()},"clear"),J=(0,i.eW)(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);f.has(e)||(f.set(e,a),i.cM.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),V=(0,i.eW)(()=>f,"getSections"),Z=(0,i.eW)(e=>{C=e},"setShowData"),H=(0,i.eW)(()=>C,"getShowData"),O={getConfig:j,clear:z,setDiagramTitle:r.g2,getDiagramTitle:r.Kr,setAccTitle:r.GN,getAccTitle:r.eu,setAccDescription:r.U$,getAccDescription:r.Mx,addSection:J,getSections:V,setShowData:Z,getShowData:H},X=(0,i.eW)((e,a)=>{(0,u.A)(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),Y={parse:(0,i.eW)(async e=>{const a=await(0,F.Qc)("pie",e);i.cM.debug(a),X(a,O)},"parse")},Q=(0,i.eW)(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),q=Q,ee=(0,i.eW)(e=>{const a=[...e.values()].reduce((n,o)=>n+o,0),$=[...e.entries()].map(([n,o])=>({label:n,value:o})).filter(n=>n.value/a*100>=1).sort((n,o)=>o.value-n.value);return(0,g.ve8)().value(n=>n.value)($)},"createPieArcs"),te=(0,i.eW)((e,a,$,y)=>{i.cM.debug(`rendering pie chart
`+e);const n=y.db,o=(0,r.nV)(),R=(0,c.Rb)(n.getConfig(),o.pie),k=40,d=18,h=4,p=450,T=p,A=(0,v.P)(a),_=A.append("g");_.attr("transform","translate("+T/2+","+p/2+")");const{themeVariables:l}=o;let[B]=(0,c.VG)(l.pieOuterStrokeWidth);B??(B=2);const I=R.textPosition,D=Math.min(T,p)/2-k,ie=(0,g.Nb1)().innerRadius(0).outerRadius(D),ne=(0,g.Nb1)().innerRadius(D*I).outerRadius(D*I);_.append("circle").attr("cx",0).attr("cy",0).attr("r",D+B/2).attr("class","pieOuterCircle");const S=n.getSections(),le=ee(S),se=[l.pie1,l.pie2,l.pie3,l.pie4,l.pie5,l.pie6,l.pie7,l.pie8,l.pie9,l.pie10,l.pie11,l.pie12];let x=0;S.forEach(t=>{x+=t});const L=le.filter(t=>(t.data.value/x*100).toFixed(0)!=="0"),W=(0,g.PKp)(se);_.selectAll("mySlices").data(L).enter().append("path").attr("d",ie).attr("fill",t=>W(t.data.label)).attr("class","pieCircle"),_.selectAll("mySlices").data(L).enter().append("text").text(t=>(t.data.value/x*100).toFixed(0)+"%").attr("transform",t=>"translate("+ne.centroid(t)+")").style("text-anchor","middle").attr("class","slice"),_.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-(p-50)/2).attr("class","pieTitleText");const b=[...S.entries()].map(([t,w])=>({label:t,value:w})),M=_.selectAll(".legend").data(b).enter().append("g").attr("class","legend").attr("transform",(t,w)=>{const G=d+h,oe=G*b.length/2,de=12*d,pe=w*G-oe;return"translate("+de+","+pe+")"});M.append("rect").attr("width",d).attr("height",d).style("fill",t=>W(t.label)).style("stroke",t=>W(t.label)),M.append("text").attr("x",d+h).attr("y",d-h).text(t=>n.getShowData()?`${t.label} [${t.value}]`:t.label);const ce=Math.max(...M.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),U=T+k+d+h+ce;A.attr("viewBox",`0 0 ${U} ${p}`),(0,r.v2)(A,p,U,R.useMaxWidth)},"draw"),ae={draw:te},re={parser:Y,db:O,renderer:ae,styles:q}}}]);})();
