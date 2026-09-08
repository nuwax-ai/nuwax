"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[928],{436781:function(H,b,v){v.d(b,{S:function(){return k}});var A=v(769120);function k(g,c){g.accDescr&&c.setAccDescription?.(g.accDescr),g.accTitle&&c.setAccTitle?.(g.accTitle),g.title&&c.setDiagramTitle?.(g.title)}(0,A.K)(k,"populateCommonDb")},139884:function(H,b,v){var _,z;v.d(b,{$:function(){return me},U:function(){return ue},db:function(){return L}});var A=v(970870),k=v(767767),g=v(294654),c=v(769120),K="",E="",O="",N=[],D=new Map,R=(0,c.K)(e=>(0,k.jZ)(e,(0,k.D7)()),"sanitizeText"),$=(0,c.K)(e=>{switch(e.type){case"terminal":return{...e,value:R(e.value)};case"nonterminal":return{...e,name:R(e.name)};case"sequence":return{...e,elements:e.elements.map($)};case"choice":return{...e,alternatives:e.alternatives.map($)};case"optional":return{...e,element:$(e.element)};case"repetition":return{...e,element:$(e.element),separator:e.separator?$(e.separator):void 0};case"special":return{...e,text:R(e.text)}}},"sanitizeAstNode"),G=(0,c.K)(()=>{K="",E="",O="",N.length=0,D.clear(),(0,k.IU)(),g.R.debug("[Railroad] Database cleared")},"clear"),B=(0,c.K)(e=>{K=R(e),g.R.debug("[Railroad] Title set:",e)},"setTitle"),Y=(0,c.K)(()=>K,"getTitle"),Z=(0,c.K)(e=>{const i={...e,name:R(e.name),definition:$(e.definition),comment:e.comment?R(e.comment):void 0};g.R.debug("[Railroad] Adding rule:",i.name),D.has(i.name)&&g.R.warn(`[Railroad] Rule '${i.name}' is already defined. Overwriting.`),N.push(i),D.set(i.name,i)},"addRule"),J=(0,c.K)(()=>N,"getRules"),q=(0,c.K)(e=>D.get(e),"getRule"),Q=(0,c.K)(e=>{E=R(e).replace(/^\s+/g,""),g.R.debug("[Railroad] Accessibility title set:",e)},"setAccTitle"),V=(0,c.K)(()=>E,"getAccTitle"),ee=(0,c.K)(e=>{O=R(e).replace(/\n\s+/g,`
`),g.R.debug("[Railroad] Accessibility description set:",e)},"setAccDescription"),te=(0,c.K)(()=>O,"getAccDescription"),re=B,ie=Y,L={clear:G,setTitle:B,getTitle:Y,addRule:Z,getRules:J,getRule:q,setAccTitle:Q,getAccTitle:V,setAccDescription:ee,getAccDescription:te,setDiagramTitle:re,getDiagramTitle:ie},T={compactMode:!1,padding:10,verticalSeparation:8,horizontalSeparation:10,arcRadius:10,fontSize:14,fontFamily:"monospace",terminalFill:"#FFFFC0",terminalStroke:"#000000",terminalTextColor:"#000000",nonTerminalFill:"#FFFFFF",nonTerminalStroke:"#000000",nonTerminalTextColor:"#000000",lineColor:"#000000",strokeWidth:2,markerFill:"#000000",commentFill:"#E8E8E8",commentStroke:"#888888",commentTextColor:"#666666",specialFill:"#F0E0FF",specialStroke:"#8800CC",ruleNameColor:"#000066",showMarkers:!0,markerRadius:5},ne=/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i,ae=/^[\w "',.-]+$/,oe=new Set(["compactMode","padding","verticalSeparation","horizontalSeparation","arcRadius","fontSize","fontFamily","terminalFill","terminalStroke","terminalTextColor","nonTerminalFill","nonTerminalStroke","nonTerminalTextColor","lineColor","strokeWidth","markerFill","commentFill","commentStroke","commentTextColor","specialFill","specialStroke","ruleNameColor","showMarkers","markerRadius"]),I=(0,c.K)(e=>e?Object.keys(e).every(i=>i==="railroad"||oe.has(i)):!1,"isRailroadStyleOptions"),le=(0,c.K)(e=>e?"railroad"in e&&e.railroad?e.railroad:I(e)?e:{}:{},"extractRailroadOverrides"),se=(0,c.K)(e=>{if(!e||I(e))return{};const{railroad:i,svgId:a,theme:n,look:t,...r}=e;return r},"extractThemeOverrides"),h=(0,c.K)((e,i)=>{if(typeof e!="string")return i;const a=e.trim();return ne.test(a)?a:i},"sanitizeColorValue"),U=(0,c.K)((e,i)=>{if(typeof e!="string")return i;const a=e.trim();return ae.test(a)?a:i},"sanitizeFontFamilyValue"),F=(0,c.K)((e,i)=>{const a=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(a)&&a>=0?a:i},"sanitizeNumberValue"),de=(0,c.K)(e=>{const i=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(i)&&i>0?i:void 0},"parseThemeFontSize"),ce=(0,c.K)(e=>{const i=U(e.fontFamily,T.fontFamily),a=de(e.fontSize)??T.fontSize;return{...T,fontFamily:i,fontSize:a,terminalFill:h(e.secondBkg??e.secondaryColor,T.terminalFill),terminalStroke:h(e.secondaryBorderColor??e.lineColor,T.terminalStroke),terminalTextColor:h(e.secondaryTextColor??e.textColor,T.terminalTextColor),nonTerminalFill:h(e.mainBkg??e.background,T.nonTerminalFill),nonTerminalStroke:h(e.primaryBorderColor??e.lineColor,T.nonTerminalStroke),nonTerminalTextColor:h(e.primaryTextColor??e.textColor,T.nonTerminalTextColor),lineColor:h(e.lineColor,T.lineColor),markerFill:h(e.lineColor,T.markerFill),commentFill:h(e.labelBackground??e.tertiaryColor,T.commentFill),commentStroke:h(e.tertiaryBorderColor??e.lineColor,T.commentStroke),commentTextColor:h(e.tertiaryTextColor??e.textColor,T.commentTextColor),specialFill:h(e.tertiaryColor??e.secondaryColor,T.specialFill),specialStroke:h(e.tertiaryBorderColor??e.secondaryBorderColor,T.specialStroke),ruleNameColor:h(e.titleColor??e.textColor,T.ruleNameColor)}},"buildThemeDefaults"),P=(0,c.K)(e=>{const i=(0,k.zj)(),a={...(0,k.P$)(),...i.themeVariables??{},...se(e)},n=ce(a),t={...i.railroad??{},...le(e)};return{compactMode:t.compactMode??n.compactMode,padding:F(t.padding,n.padding),verticalSeparation:F(t.verticalSeparation,n.verticalSeparation),horizontalSeparation:F(t.horizontalSeparation,n.horizontalSeparation),arcRadius:F(t.arcRadius,n.arcRadius),fontSize:F(t.fontSize,n.fontSize),fontFamily:U(t.fontFamily,n.fontFamily),terminalFill:h(t.terminalFill,n.terminalFill),terminalStroke:h(t.terminalStroke,n.terminalStroke),terminalTextColor:h(t.terminalTextColor,n.terminalTextColor),nonTerminalFill:h(t.nonTerminalFill,n.nonTerminalFill),nonTerminalStroke:h(t.nonTerminalStroke,n.nonTerminalStroke),nonTerminalTextColor:h(t.nonTerminalTextColor,n.nonTerminalTextColor),lineColor:h(t.lineColor,n.lineColor),strokeWidth:F(t.strokeWidth,n.strokeWidth),markerFill:h(t.markerFill,n.markerFill),commentFill:h(t.commentFill,n.commentFill),commentStroke:h(t.commentStroke,n.commentStroke),commentTextColor:h(t.commentTextColor,n.commentTextColor),specialFill:h(t.specialFill,n.specialFill),specialStroke:h(t.specialStroke,n.specialStroke),ruleNameColor:h(t.ruleNameColor,n.ruleNameColor),showMarkers:t.showMarkers??n.showMarkers,markerRadius:F(t.markerRadius,n.markerRadius)}},"buildRailroadStyleOptions"),me=(0,c.K)(e=>{const{fontFamily:i,fontSize:a,terminalFill:n,terminalStroke:t,terminalTextColor:r,nonTerminalFill:o,nonTerminalStroke:f,nonTerminalTextColor:l,lineColor:s,strokeWidth:p,markerFill:u,commentFill:m,commentStroke:w,commentTextColor:d,specialFill:x,specialStroke:M,ruleNameColor:y}=P(e);return`
  .railroad-diagram {
    font-family: ${i};
    font-size: ${a}px;
  }

  .railroad-terminal rect {
    fill: ${n};
    stroke: ${t};
    stroke-width: ${p}px;
  }

  .railroad-terminal text {
    fill: ${r};
    font-family: ${i};
    font-size: ${a}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${o};
    stroke: ${f};
    stroke-width: ${p}px;
  }

  .railroad-nonterminal text {
    fill: ${l};
    font-family: ${i};
    font-size: ${a}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${s};
    stroke-width: ${p}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${u};
  }

  .railroad-comment ellipse {
    fill: ${m};
    stroke: ${w};
    stroke-width: ${p}px;
  }

  .railroad-comment text {
    fill: ${d};
    font-style: italic;
    font-family: ${i};
    font-size: ${a}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${x};
    stroke: ${M};
    stroke-width: ${p}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${l};
    font-family: ${i};
    font-size: ${a}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${y};
    font-family: ${i};
    font-size: ${a}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`},"getStyles"),C=(_=class{constructor(){this.d=""}moveTo(i,a){return this.d+=`M ${i} ${a} `,this}lineTo(i,a){return this.d+=`L ${i} ${a} `,this}horizontalTo(i){return this.d+=`H ${i} `,this}verticalTo(i){return this.d+=`V ${i} `,this}arcTo(i,a,n,t,r,o,f){return this.d+=`A ${i} ${a} ${n} ${t?1:0} ${r?1:0} ${o} ${f} `,this}build(){return this.d.trim()}},(0,c.K)(_,"PathBuilder"),_),he=(z=class{constructor(i,a=P()){this.textCache=new Map,this.svg=i,this.config=a}measureText(i){if(this.textCache.has(i))return this.textCache.get(i);const a=this.svg.append("text").attr("font-family",this.config.fontFamily).attr("font-size",this.config.fontSize).text(i),n=a.node().getBBox(),t={width:n.width,height:n.height};return a.remove(),this.textCache.set(i,t),t}renderTerminal(i,a){const n=this.measureText(a),t=n.width+this.config.padding*2,r=n.height+this.config.padding*2,o=i.append("g").attr("class","railroad-terminal");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r).attr("rx",10).attr("ry",10),o.append("text").attr("x",t/2).attr("y",r/2).text(a),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderNonTerminal(i,a){const n=this.measureText(a),t=n.width+this.config.padding*2,r=n.height+this.config.padding*2,o=i.append("g").attr("class","railroad-nonterminal");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r),o.append("text").attr("x",t/2).attr("y",r/2).text(a),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderSequence(i,a){const n=a.map(s=>this.renderExpression(i,s));let t=0,r=0,o=0;for(const s of n)t+=s.dimensions.width,r=Math.max(r,s.dimensions.up),o=Math.max(o,s.dimensions.down);t+=(n.length-1)*this.config.horizontalSeparation;const f=i.append("g").attr("class","railroad-sequence");let l=0;for(let s=0;s<n.length;s++){const p=n[s],u=r-p.dimensions.up;if(f.node().appendChild(p.element).setAttribute("transform",`translate(${l}, ${u})`),s<n.length-1){const w=l+p.dimensions.width,d=w+this.config.horizontalSeparation,x=r;f.append("path").attr("class","railroad-line").attr("d",new C().moveTo(w,x).lineTo(d,x).build())}l+=p.dimensions.width+this.config.horizontalSeparation}return{element:f.node(),dimensions:{width:t,height:r+o,up:r,down:o}}}renderChoice(i,a){const n=a.map(m=>this.renderExpression(i,m));let t=0,r=0;for(const m of n)t=Math.max(t,m.dimensions.width),r+=m.dimensions.height;r+=(n.length-1)*this.config.verticalSeparation;const o=this.config.arcRadius,f=o*4,l=t+f,s=i.append("g").attr("class","railroad-choice");let p=0;const u=r/2;for(const m of n){const w=p,d=w+m.dimensions.up,x=o*2+(t-m.dimensions.width)/2;s.node().appendChild(m.element).setAttribute("transform",`translate(${x}, ${w})`);const y=new C,S=d>u;d===u?y.moveTo(0,u).lineTo(x,d):y.moveTo(0,u).arcTo(o,o,0,!1,S,o,u+(S?o:-o)).lineTo(o,d-(S?o:-o)).arcTo(o,o,0,!1,!S,o*2,d).lineTo(x,d),s.append("path").attr("class","railroad-line").attr("d",y.build());const W=new C,X=x+m.dimensions.width,fe=l-o*2;d===u?W.moveTo(X,d).lineTo(l,u):W.moveTo(X,d).lineTo(fe,d).arcTo(o,o,0,!1,!S,l-o,d+(S?-o:o)).lineTo(l-o,u+(S?o:-o)).arcTo(o,o,0,!1,S,l,u),s.append("path").attr("class","railroad-line").attr("d",W.build()),p+=m.dimensions.height+this.config.verticalSeparation}return{element:s.node(),dimensions:{width:l,height:r,up:u,down:r-u}}}renderOptional(i,a){const n=this.renderExpression(i,a),t=this.config.arcRadius,r=t*2,o=n.dimensions.width+t*4,f=n.dimensions.height+r,l=i.append("g").attr("class","railroad-optional"),s=t*2,p=r;l.node().appendChild(n.element).setAttribute("transform",`translate(${s}, ${p})`);const m=p+n.dimensions.up,w=new C().moveTo(0,m).lineTo(t*2,m);l.append("path").attr("class","railroad-line").attr("d",w.build());const d=new C().moveTo(s+n.dimensions.width,m).lineTo(o,m);l.append("path").attr("class","railroad-line").attr("d",d.build());const x=new C().moveTo(0,m).arcTo(t,t,0,!1,!1,t,m-t).lineTo(t,t).arcTo(t,t,0,!1,!0,t*2,0).lineTo(o-t*2,0).arcTo(t,t,0,!1,!0,o-t,t).lineTo(o-t,m-t).arcTo(t,t,0,!1,!1,o,m);return l.append("path").attr("class","railroad-line").attr("d",x.build()),{element:l.node(),dimensions:{width:o,height:f,up:m,down:f-m}}}renderRepetition(i,a,n){const t=this.renderExpression(i,a),r=this.config.arcRadius,o=r*2,f=t.dimensions.width+r*4,l=n===0,s=t.dimensions.height+o+(l?o:0),p=i.append("g").attr("class","railroad-repetition"),u=r*2,m=l?o:0;p.node().appendChild(t.element).setAttribute("transform",`translate(${u}, ${m})`);const d=m+t.dimensions.up;p.append("path").attr("class","railroad-line").attr("d",new C().moveTo(0,d).lineTo(r*2,d).build()),p.append("path").attr("class","railroad-line").attr("d",new C().moveTo(u+t.dimensions.width,d).lineTo(f,d).build());const x=m+t.dimensions.height+r,M=new C().moveTo(u+t.dimensions.width,d).arcTo(r,r,0,!1,!0,u+t.dimensions.width+r,d+r).lineTo(u+t.dimensions.width+r,x).arcTo(r,r,0,!1,!0,u+t.dimensions.width,x+r).lineTo(r*2,x+r).arcTo(r,r,0,!1,!0,r,x).lineTo(r,d+r).arcTo(r,r,0,!1,!0,r*2,d);if(p.append("path").attr("class","railroad-line").attr("d",M.build()),l){const y=new C().moveTo(0,d).arcTo(r,r,0,!1,!1,r,d-r).lineTo(r,r).arcTo(r,r,0,!1,!0,r*2,0).lineTo(f-r*2,0).arcTo(r,r,0,!1,!0,f-r,r).lineTo(f-r,d-r).arcTo(r,r,0,!1,!1,f,d);p.append("path").attr("class","railroad-line").attr("d",y.build())}return{element:p.node(),dimensions:{width:f,height:s,up:d,down:s-d}}}renderSpecial(i,a){const n=this.measureText("? "+a+" ?"),t=n.width+this.config.padding*2,r=n.height+this.config.padding*2,o=i.append("g").attr("class","railroad-special");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r),o.append("text").attr("x",t/2).attr("y",r/2).text("? "+a+" ?"),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderExpression(i,a){switch(a.type){case"terminal":return this.renderTerminal(i,a.value);case"nonterminal":return this.renderNonTerminal(i,a.name);case"sequence":return this.renderSequence(i,a.elements);case"choice":return this.renderChoice(i,a.alternatives);case"optional":return this.renderOptional(i,a.element);case"repetition":return this.renderRepetition(i,a.element,a.min);case"special":return this.renderSpecial(i,a.text);default:throw new Error(`Unknown node type: ${a.type}`)}}renderRule(i,a){const n=this.svg.append("g").attr("class","railroad-rule").attr("transform",`translate(0, ${a})`),t=i.name+" =",r=this.measureText(t).width+20,o=r+20,f=n.append("g"),l=this.renderExpression(f,i.definition),s=Math.max(20,l.dimensions.up),p=s-l.dimensions.up;return f.attr("transform",`translate(${o}, ${p})`),n.append("g").attr("class","railroad-rule-name-group").append("text").attr("class","railroad-rule-name").attr("x",0).attr("y",s).text(t),n.append("g").attr("class","railroad-start").append("circle").attr("cx",r).attr("cy",s).attr("r",this.config.markerRadius),n.append("g").attr("class","railroad-end").append("circle").attr("cx",o+l.dimensions.width+10).attr("cy",s).attr("r",this.config.markerRadius),n.append("path").attr("class","railroad-line").attr("d",new C().moveTo(r+this.config.markerRadius,s).lineTo(o,s).build()),n.append("path").attr("class","railroad-line").attr("d",new C().moveTo(o+l.dimensions.width,s).lineTo(o+l.dimensions.width+10-this.config.markerRadius,s).build()),{height:Math.max(40,p+l.dimensions.height+this.config.padding*2),width:o+l.dimensions.width+10+this.config.markerRadius}}renderDiagram(i){let a=this.config.padding,n=0;for(const t of i){const r=this.renderRule(t,a);a+=r.height+this.config.verticalSeparation,n=Math.max(n,r.width)}return{width:n+this.config.padding*2,height:a+this.config.padding}}},(0,c.K)(z,"RailroadRenderer"),z),j=(0,c.K)((e,i,a)=>{(0,k.a$)(e,i.height,i.width,a),e.attr("viewBox",`0 0 ${i.width} ${i.height}`)},"configureRailroadSvgSize"),pe=(0,c.K)((e,i,a)=>{g.R.debug(`[Railroad] Rendering diagram
`+e);try{const n=(0,A.D)(i);n.attr("class","railroad-diagram");const r=(0,k.zj)().railroad?.useMaxWidth??!0,o=L.getRules();if(g.R.debug(`[Railroad] Rendering ${o.length} rules`),o.length===0){g.R.warn("[Railroad] No rules to render"),j(n,{height:100,width:200},r);return}const l=new he(n,P()).renderDiagram(o);j(n,l,r),g.R.debug("[Railroad] Render complete")}catch(n){throw g.R.error("[Railroad] Render error:",n),n}},"draw"),ue={draw:pe}}}]);
