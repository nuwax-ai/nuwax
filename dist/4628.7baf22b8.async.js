"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4628],{36221:function(U,v,l){l.d(v,{A:function(){return _}});var m=l(22092);function _(c,r){c.accDescr&&r.setAccDescription?.(c.accDescr),c.accTitle&&r.setAccTitle?.(c.accTitle),c.title&&r.setDiagramTitle?.(c.title)}(0,m.eW)(_,"populateCommonDb")},64628:function(U,v,l){l.d(v,{diagram:function(){return re}});var m=l(29798),_=l(36221),c=l(47901),r=l(23661),i=l(22092),F=l(65602),g=l(48313),P=r.vZ.pie,E={sections:new Map,showData:!1,config:P},h=E.sections,C=E.showData,N=structuredClone(P),j=(0,i.eW)(()=>structuredClone(N),"getConfig"),z=(0,i.eW)(()=>{h=new Map,C=E.showData,(0,r.ZH)()},"clear"),H=(0,i.eW)(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);h.has(e)||(h.set(e,a),i.cM.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),V=(0,i.eW)(()=>h,"getSections"),Z=(0,i.eW)(e=>{C=e},"setShowData"),J=(0,i.eW)(()=>C,"getShowData"),O={getConfig:j,clear:z,setDiagramTitle:r.g2,getDiagramTitle:r.Kr,setAccTitle:r.GN,getAccTitle:r.eu,setAccDescription:r.U$,getAccDescription:r.Mx,addSection:H,getSections:V,setShowData:Z,getShowData:J},Q=(0,i.eW)((e,a)=>{(0,_.A)(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),X={parse:(0,i.eW)(async e=>{const a=await(0,F.Qc)("pie",e);i.cM.debug(a),Q(a,O)},"parse")},Y=(0,i.eW)(e=>`
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
`,"getStyles"),q=Y,ee=(0,i.eW)(e=>{const a=[...e.values()].reduce((n,o)=>n+o,0),$=[...e.entries()].map(([n,o])=>({label:n,value:o})).filter(n=>n.value/a*100>=1).sort((n,o)=>o.value-n.value);return(0,g.ve8)().value(n=>n.value)($)},"createPieArcs"),te=(0,i.eW)((e,a,$,y)=>{i.cM.debug(`rendering pie chart
`+e);const n=y.db,o=(0,r.nV)(),R=(0,c.Rb)(n.getConfig(),o.pie),k=40,d=18,f=4,p=450,T=p,x=(0,m.P)(a),u=x.append("g");u.attr("transform","translate("+T/2+","+p/2+")");const{themeVariables:s}=o;let[G]=(0,c.VG)(s.pieOuterStrokeWidth);G??(G=2);const B=R.textPosition,D=Math.min(T,p)/2-k,ie=(0,g.Nb1)().innerRadius(0).outerRadius(D),ne=(0,g.Nb1)().innerRadius(D*B).outerRadius(D*B);u.append("circle").attr("cx",0).attr("cy",0).attr("r",D+G/2).attr("class","pieOuterCircle");const A=n.getSections(),se=ee(A),le=[s.pie1,s.pie2,s.pie3,s.pie4,s.pie5,s.pie6,s.pie7,s.pie8,s.pie9,s.pie10,s.pie11,s.pie12];let S=0;A.forEach(t=>{S+=t});const I=se.filter(t=>(t.data.value/S*100).toFixed(0)!=="0"),W=(0,g.PKp)(le);u.selectAll("mySlices").data(I).enter().append("path").attr("d",ie).attr("fill",t=>W(t.data.label)).attr("class","pieCircle"),u.selectAll("mySlices").data(I).enter().append("text").text(t=>(t.data.value/S*100).toFixed(0)+"%").attr("transform",t=>"translate("+ne.centroid(t)+")").style("text-anchor","middle").attr("class","slice"),u.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-(p-50)/2).attr("class","pieTitleText");const L=[...A.entries()].map(([t,M])=>({label:t,value:M})),w=u.selectAll(".legend").data(L).enter().append("g").attr("class","legend").attr("transform",(t,M)=>{const K=d+f,oe=K*L.length/2,de=12*d,pe=M*K-oe;return"translate("+de+","+pe+")"});w.append("rect").attr("width",d).attr("height",d).style("fill",t=>W(t.label)).style("stroke",t=>W(t.label)),w.append("text").attr("x",d+f).attr("y",d-f).text(t=>n.getShowData()?`${t.label} [${t.value}]`:t.label);const ce=Math.max(...w.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),b=T+k+d+f+ce;x.attr("viewBox",`0 0 ${b} ${p}`),(0,r.v2)(x,p,b,R.useMaxWidth)},"draw"),ae={draw:te},re={parser:X,db:O,renderer:ae,styles:q}}}]);})();
