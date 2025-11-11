"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[4674],{91999:function(B,C,n){n.d(C,{A:function(){return _}});var E=n(27246);function _(c,t){c.accDescr&&t.setAccDescription?.(c.accDescr),c.accTitle&&t.setAccTitle?.(c.accTitle),c.title&&t.setDiagramTitle?.(c.title)}(0,E.eW)(_,"populateCommonDb")},84674:function(B,C,n){n.d(C,{diagram:function(){return ee}});var E=n(91999),_=n(11495),c=n(402),t=n(27246),G=n(7853),g=n(25299),M=t.vZ.pie,T={sections:new Map,showData:!1,config:M},f=T.sections,S=T.showData,U=structuredClone(M),K=(0,t.eW)(()=>structuredClone(U),"getConfig"),N=(0,t.eW)(()=>{f=new Map,S=T.showData,(0,t.ZH)()},"clear"),z=(0,t.eW)(({label:e,value:a})=>{f.has(e)||(f.set(e,a),t.cM.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),F=(0,t.eW)(()=>f,"getSections"),j=(0,t.eW)(e=>{S=e},"setShowData"),V=(0,t.eW)(()=>S,"getShowData"),w={getConfig:K,clear:N,setDiagramTitle:t.g2,getDiagramTitle:t.Kr,setAccTitle:t.GN,getAccTitle:t.eu,setAccDescription:t.U$,getAccDescription:t.Mx,addSection:z,getSections:F,setShowData:j,getShowData:V},H=(0,t.eW)((e,a)=>{(0,E.A)(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),Z={parse:(0,t.eW)(async e=>{const a=await(0,G.Qc)("pie",e);t.cM.debug(a),H(a,w)},"parse")},Q=(0,t.eW)(e=>`
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
`,"getStyles"),X=Q,Y=(0,t.eW)(e=>{const a=[...e.entries()].map(o=>({label:o[0],value:o[1]})).sort((o,l)=>l.value-o.value);return(0,g.ve8)().value(o=>o.value)(a)},"createPieArcs"),J=(0,t.eW)((e,a,te,o)=>{t.cM.debug(`rendering pie chart
`+e);const l=o.db,y=(0,t.nV)(),O=(0,_.Rb)(l.getConfig(),y.pie),$=40,s=18,h=4,d=450,x=d,A=(0,c.P)(a),p=A.append("g");p.attr("transform","translate("+x/2+","+d/2+")");const{themeVariables:r}=y;let[k]=(0,_.VG)(r.pieOuterStrokeWidth);k??(k=2);const R=O.textPosition,m=Math.min(x,d)/2-$,ae=(0,g.Nb1)().innerRadius(0).outerRadius(m),re=(0,g.Nb1)().innerRadius(m*R).outerRadius(m*R);p.append("circle").attr("cx",0).attr("cy",0).attr("r",m+k/2).attr("class","pieOuterCircle");const L=l.getSections(),P=Y(L),ie=[r.pie1,r.pie2,r.pie3,r.pie4,r.pie5,r.pie6,r.pie7,r.pie8,r.pie9,r.pie10,r.pie11,r.pie12],u=(0,g.PKp)(ie);p.selectAll("mySlices").data(P).enter().append("path").attr("d",ae).attr("fill",i=>u(i.data.label)).attr("class","pieCircle");let I=0;L.forEach(i=>{I+=i}),p.selectAll("mySlices").data(P).enter().append("text").text(i=>(i.data.value/I*100).toFixed(0)+"%").attr("transform",i=>"translate("+re.centroid(i)+")").style("text-anchor","middle").attr("class","slice"),p.append("text").text(l.getDiagramTitle()).attr("x",0).attr("y",-(d-50)/2).attr("class","pieTitleText");const W=p.selectAll(".legend").data(u.domain()).enter().append("g").attr("class","legend").attr("transform",(i,D)=>{const v=s+h,ce=v*u.domain().length/2,oe=12*s,se=D*v-ce;return"translate("+oe+","+se+")"});W.append("rect").attr("width",s).attr("height",s).style("fill",u).style("stroke",u),W.data(P).append("text").attr("x",s+h).attr("y",s-h).text(i=>{const{label:D,value:v}=i.data;return l.getShowData()?`${D} [${v}]`:D});const ne=Math.max(...W.selectAll("text").nodes().map(i=>i?.getBoundingClientRect().width??0)),b=x+$+s+h+ne;A.attr("viewBox",`0 0 ${b} ${d}`),(0,t.v2)(A,d,b,O.useMaxWidth)},"draw"),q={draw:J},ee={parser:Z,db:w,renderer:q,styles:X}}}]);})();
