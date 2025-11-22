"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[8591],{20624:function(ot,G,M){M.d(G,{G:function(){return I}});var B=M(57099),I=(0,B.eW)(()=>`
  /* Font Awesome icon styling - consolidated */
  .label-icon {
    display: inline-block;
    height: 1em;
    overflow: visible;
    vertical-align: -0.125em;
  }
  
  .node .label-icon path {
    fill: currentColor;
    stroke: revert;
    stroke-width: revert;
  }
`,"getIconStyles")},84834:function(ot,G,M){M.d(G,{AD:function(){return U},AE:function(){return tt},Mu:function(){return i},O:function(){return N},kc:function(){return J},rB:function(){return V},yU:function(){return H}});var B=M(98994),I=M(57099),w=M(80357),i=(0,I.eW)((W,p)=>{const k=W.append("rect");if(k.attr("x",p.x),k.attr("y",p.y),k.attr("fill",p.fill),k.attr("stroke",p.stroke),k.attr("width",p.width),k.attr("height",p.height),p.name&&k.attr("name",p.name),p.rx&&k.attr("rx",p.rx),p.ry&&k.attr("ry",p.ry),p.attrs!==void 0)for(const E in p.attrs)k.attr(E,p.attrs[E]);return p.class&&k.attr("class",p.class),k},"drawRect"),N=(0,I.eW)((W,p)=>{const k={x:p.startx,y:p.starty,width:p.stopx-p.startx,height:p.stopy-p.starty,fill:p.fill,stroke:p.stroke,class:"rect"};i(W,k).lower()},"drawBackgroundRect"),H=(0,I.eW)((W,p)=>{const k=p.text.replace(B.Vw," "),E=W.append("text");E.attr("x",p.x),E.attr("y",p.y),E.attr("class","legend"),E.style("text-anchor",p.anchor),p.class&&E.attr("class",p.class);const C=E.append("tspan");return C.attr("x",p.x+p.textMargin*2),C.text(k),E},"drawText"),tt=(0,I.eW)((W,p,k,E)=>{const C=W.append("image");C.attr("x",p),C.attr("y",k);const Z=(0,w.N)(E);C.attr("xlink:href",Z)},"drawImage"),V=(0,I.eW)((W,p,k,E)=>{const C=W.append("use");C.attr("x",p),C.attr("y",k);const Z=(0,w.N)(E);C.attr("xlink:href",`#${Z}`)},"drawEmbeddedImage"),J=(0,I.eW)(()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),"getNoteRect"),U=(0,I.eW)(()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0}),"getTextObj")},68591:function(ot,G,M){M.d(G,{diagram:function(){return Lt}});var B=M(84834),I=M(20624),w=M(98994),i=M(57099),N=M(21489),H=function(){var t=(0,i.eW)(function(h,r,a,l){for(a=a||{},l=h.length;l--;a[h[l]]=r);return a},"o"),e=[6,8,10,11,12,14,16,17,18],s=[1,9],c=[1,10],n=[1,11],f=[1,12],u=[1,13],y=[1,14],m={trace:(0,i.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:(0,i.eW)(function(r,a,l,d,g,o,S){var v=o.length-1;switch(g){case 1:return o[v-1];case 2:this.$=[];break;case 3:o[v-1].push(o[v]),this.$=o[v-1];break;case 4:case 5:this.$=o[v];break;case 6:case 7:this.$=[];break;case 8:d.setDiagramTitle(o[v].substr(6)),this.$=o[v].substr(6);break;case 9:this.$=o[v].trim(),d.setAccTitle(this.$);break;case 10:case 11:this.$=o[v].trim(),d.setAccDescription(this.$);break;case 12:d.addSection(o[v].substr(8)),this.$=o[v].substr(8);break;case 13:d.addTask(o[v-1],o[v]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:s,12:c,14:n,16:f,17:u,18:y},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:15,11:s,12:c,14:n,16:f,17:u,18:y},t(e,[2,5]),t(e,[2,6]),t(e,[2,8]),{13:[1,16]},{15:[1,17]},t(e,[2,11]),t(e,[2,12]),{19:[1,18]},t(e,[2,4]),t(e,[2,9]),t(e,[2,10]),t(e,[2,13])],defaultActions:{},parseError:(0,i.eW)(function(r,a){if(a.recoverable)this.trace(r);else{var l=new Error(r);throw l.hash=a,l}},"parseError"),parse:(0,i.eW)(function(r){var a=this,l=[0],d=[],g=[null],o=[],S=this.table,v="",j=0,xt=0,_t=0,Vt=2,kt=1,Ot=o.slice.call(arguments,1),b=Object.create(this.lexer),z={yy:{}};for(var nt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,nt)&&(z.yy[nt]=this.yy[nt]);b.setInput(r,z.yy),z.yy.lexer=b,z.yy.parser=this,typeof b.yylloc>"u"&&(b.yylloc={});var it=b.yylloc;o.push(it);var jt=b.options&&b.options.ranges;typeof z.yy.parseError=="function"?this.parseError=z.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Nt(P){l.length=l.length-2*P,g.length=g.length-P,o.length=o.length-P}(0,i.eW)(Nt,"popStack");function vt(){var P;return P=d.pop()||b.lex()||kt,typeof P!="number"&&(P instanceof Array&&(d=P,P=d.pop()),P=a.symbols_[P]||P),P}(0,i.eW)(vt,"lex");for(var T,st,K,A,Ut,at,Y={},D,L,bt,q;;){if(K=l[l.length-1],this.defaultActions[K]?A=this.defaultActions[K]:((T===null||typeof T>"u")&&(T=vt()),A=S[K]&&S[K][T]),typeof A>"u"||!A.length||!A[0]){var lt="";q=[];for(D in S[K])this.terminals_[D]&&D>Vt&&q.push("'"+this.terminals_[D]+"'");b.showPosition?lt="Parse error on line "+(j+1)+`:
`+b.showPosition()+`
Expecting `+q.join(", ")+", got '"+(this.terminals_[T]||T)+"'":lt="Parse error on line "+(j+1)+": Unexpected "+(T==kt?"end of input":"'"+(this.terminals_[T]||T)+"'"),this.parseError(lt,{text:b.match,token:this.terminals_[T]||T,line:b.yylineno,loc:it,expected:q})}if(A[0]instanceof Array&&A.length>1)throw new Error("Parse Error: multiple actions possible at state: "+K+", token: "+T);switch(A[0]){case 1:l.push(T),g.push(b.yytext),o.push(b.yylloc),l.push(A[1]),T=null,st?(T=st,st=null):(xt=b.yyleng,v=b.yytext,j=b.yylineno,it=b.yylloc,_t>0&&_t--);break;case 2:if(L=this.productions_[A[1]][1],Y.$=g[g.length-L],Y._$={first_line:o[o.length-(L||1)].first_line,last_line:o[o.length-1].last_line,first_column:o[o.length-(L||1)].first_column,last_column:o[o.length-1].last_column},jt&&(Y._$.range=[o[o.length-(L||1)].range[0],o[o.length-1].range[1]]),at=this.performAction.apply(Y,[v,xt,j,z.yy,A[1],g,o].concat(Ot)),typeof at<"u")return at;L&&(l=l.slice(0,-1*L*2),g=g.slice(0,-1*L),o=o.slice(0,-1*L)),l.push(this.productions_[A[1]][0]),g.push(Y.$),o.push(Y._$),bt=S[l[l.length-2]][l[l.length-1]],l.push(bt);break;case 3:return!0}}return!0},"parse")},x=function(){var h={EOF:1,parseError:(0,i.eW)(function(a,l){if(this.yy.parser)this.yy.parser.parseError(a,l);else throw new Error(a)},"parseError"),setInput:(0,i.eW)(function(r,a){return this.yy=a||this.yy||{},this._input=r,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,i.eW)(function(){var r=this._input[0];this.yytext+=r,this.yyleng++,this.offset++,this.match+=r,this.matched+=r;var a=r.match(/(?:\r\n?|\n).*/g);return a?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),r},"input"),unput:(0,i.eW)(function(r){var a=r.length,l=r.split(/(?:\r\n?|\n)/g);this._input=r+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-a),this.offset-=a;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),l.length-1&&(this.yylineno-=l.length-1);var g=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:l?(l.length===d.length?this.yylloc.first_column:0)+d[d.length-l.length].length-l[0].length:this.yylloc.first_column-a},this.options.ranges&&(this.yylloc.range=[g[0],g[0]+this.yyleng-a]),this.yyleng=this.yytext.length,this},"unput"),more:(0,i.eW)(function(){return this._more=!0,this},"more"),reject:(0,i.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,i.eW)(function(r){this.unput(this.match.slice(r))},"less"),pastInput:(0,i.eW)(function(){var r=this.matched.substr(0,this.matched.length-this.match.length);return(r.length>20?"...":"")+r.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,i.eW)(function(){var r=this.match;return r.length<20&&(r+=this._input.substr(0,20-r.length)),(r.substr(0,20)+(r.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,i.eW)(function(){var r=this.pastInput(),a=new Array(r.length+1).join("-");return r+this.upcomingInput()+`
`+a+"^"},"showPosition"),test_match:(0,i.eW)(function(r,a){var l,d,g;if(this.options.backtrack_lexer&&(g={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(g.yylloc.range=this.yylloc.range.slice(0))),d=r[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+r[0].length},this.yytext+=r[0],this.match+=r[0],this.matches=r,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(r[0].length),this.matched+=r[0],l=this.performAction.call(this,this.yy,this,a,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),l)return l;if(this._backtrack){for(var o in g)this[o]=g[o];return!1}return!1},"test_match"),next:(0,i.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var r,a,l,d;this._more||(this.yytext="",this.match="");for(var g=this._currentRules(),o=0;o<g.length;o++)if(l=this._input.match(this.rules[g[o]]),l&&(!a||l[0].length>a[0].length)){if(a=l,d=o,this.options.backtrack_lexer){if(r=this.test_match(l,g[o]),r!==!1)return r;if(this._backtrack){a=!1;continue}else return!1}else if(!this.options.flex)break}return a?(r=this.test_match(a,g[d]),r!==!1?r:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,i.eW)(function(){var a=this.next();return a||this.lex()},"lex"),begin:(0,i.eW)(function(a){this.conditionStack.push(a)},"begin"),popState:(0,i.eW)(function(){var a=this.conditionStack.length-1;return a>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,i.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,i.eW)(function(a){return a=this.conditionStack.length-1-Math.abs(a||0),a>=0?this.conditionStack[a]:"INITIAL"},"topState"),pushState:(0,i.eW)(function(a){this.begin(a)},"pushState"),stateStackSize:(0,i.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,i.eW)(function(a,l,d,g){var o=g;switch(d){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;break;case 8:return this.popState(),"acc_title_value";break;case 9:return this.begin("acc_descr"),14;break;case 10:return this.popState(),"acc_descr_value";break;case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return h}();m.lexer=x;function _(){this.yy={}}return(0,i.eW)(_,"Parser"),_.prototype=m,m.Parser=_,new _}();H.parser=H;var tt=H,V="",J=[],U=[],W=[],p=(0,i.eW)(function(){J.length=0,U.length=0,V="",W.length=0,(0,w.ZH)()},"clear"),k=(0,i.eW)(function(t){V=t,J.push(t)},"addSection"),E=(0,i.eW)(function(){return J},"getSections"),C=(0,i.eW)(function(){let t=ct();const e=100;let s=0;for(;!t&&s<e;)t=ct(),s++;return U.push(...W),U},"getTasks"),Z=(0,i.eW)(function(){const t=[];return U.forEach(s=>{s.people&&t.push(...s.people)}),[...new Set(t)].sort()},"updateActors"),wt=(0,i.eW)(function(t,e){const s=e.substr(1).split(":");let c=0,n=[];s.length===1?(c=Number(s[0]),n=[]):(c=Number(s[0]),n=s[1].split(","));const f=n.map(y=>y.trim()),u={section:V,type:V,people:f,task:t,score:c};W.push(u)},"addTask"),Wt=(0,i.eW)(function(t){const e={section:V,type:V,description:t,task:t,classes:[]};U.push(e)},"addTaskOrg"),ct=(0,i.eW)(function(){const t=(0,i.eW)(function(s){return W[s].processed},"compileTask");let e=!0;for(const[s,c]of W.entries())t(s),e=e&&c.processed;return e},"compileTasks"),Et=(0,i.eW)(function(){return Z()},"getActors"),ht={getConfig:(0,i.eW)(()=>(0,w.nV)().journey,"getConfig"),clear:p,setDiagramTitle:w.g2,getDiagramTitle:w.Kr,setAccTitle:w.GN,getAccTitle:w.eu,setAccDescription:w.U$,getAccDescription:w.Mx,addSection:k,getSections:E,getTasks:C,addTask:wt,addTaskOrg:Wt,getActors:Et},Tt=(0,i.eW)(t=>`.label {
    font-family: ${t.fontFamily};
    color: ${t.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${t.textColor}
  }

  .legend {
    fill: ${t.textColor};
    font-family: ${t.fontFamily};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${t.textColor}
  }

  .face {
    ${t.faceColor?`fill: ${t.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${t.mainBkg};
    stroke: ${t.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${t.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${t.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${t.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${t.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${t.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${t.fontFamily};
    font-size: 12px;
    background: ${t.tertiaryColor};
    border: 1px solid ${t.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${t.fillType0?`fill: ${t.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${t.fillType0?`fill: ${t.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${t.fillType0?`fill: ${t.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${t.fillType0?`fill: ${t.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${t.fillType0?`fill: ${t.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${t.fillType0?`fill: ${t.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${t.fillType0?`fill: ${t.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${t.fillType0?`fill: ${t.fillType7}`:""};
  }

  .actor-0 {
    ${t.actor0?`fill: ${t.actor0}`:""};
  }
  .actor-1 {
    ${t.actor1?`fill: ${t.actor1}`:""};
  }
  .actor-2 {
    ${t.actor2?`fill: ${t.actor2}`:""};
  }
  .actor-3 {
    ${t.actor3?`fill: ${t.actor3}`:""};
  }
  .actor-4 {
    ${t.actor4?`fill: ${t.actor4}`:""};
  }
  .actor-5 {
    ${t.actor5?`fill: ${t.actor5}`:""};
  }
  ${(0,I.G)()}
`,"getStyles"),Mt=Tt,et=(0,i.eW)(function(t,e){return(0,B.Mu)(t,e)},"drawRect"),St=(0,i.eW)(function(t,e){const c=t.append("circle").attr("cx",e.cx).attr("cy",e.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),n=t.append("g");n.append("circle").attr("cx",e.cx-15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),n.append("circle").attr("cx",e.cx+15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function f(m){const x=(0,N.Nb1)().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+2)+")")}(0,i.eW)(f,"smile");function u(m){const x=(0,N.Nb1)().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+7)+")")}(0,i.eW)(u,"sad");function y(m){m.append("line").attr("class","mouth").attr("stroke",2).attr("x1",e.cx-5).attr("y1",e.cy+7).attr("x2",e.cx+5).attr("y2",e.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return(0,i.eW)(y,"ambivalent"),e.score>3?f(n):e.score<3?u(n):y(n),c},"drawFace"),ut=(0,i.eW)(function(t,e){const s=t.append("circle");return s.attr("cx",e.cx),s.attr("cy",e.cy),s.attr("class","actor-"+e.pos),s.attr("fill",e.fill),s.attr("stroke",e.stroke),s.attr("r",e.r),s.class!==void 0&&s.attr("class",s.class),e.title!==void 0&&s.append("title").text(e.title),s},"drawCircle"),dt=(0,i.eW)(function(t,e){return(0,B.yU)(t,e)},"drawText"),Pt=(0,i.eW)(function(t,e){function s(n,f,u,y,m){return n+","+f+" "+(n+u)+","+f+" "+(n+u)+","+(f+y-m)+" "+(n+u-m*1.2)+","+(f+y)+" "+n+","+(f+y)}(0,i.eW)(s,"genPoints");const c=t.append("polygon");c.attr("points",s(e.x,e.y,50,20,7)),c.attr("class","labelBox"),e.y=e.y+e.labelMargin,e.x=e.x+.5*e.labelMargin,dt(t,e)},"drawLabel"),Ct=(0,i.eW)(function(t,e,s){const c=t.append("g"),n=(0,B.kc)();n.x=e.x,n.y=e.y,n.fill=e.fill,n.width=s.width*e.taskCount+s.diagramMarginX*(e.taskCount-1),n.height=s.height,n.class="journey-section section-type-"+e.num,n.rx=3,n.ry=3,et(c,n),ft(s)(e.text,c,n.x,n.y,n.width,n.height,{class:"journey-section section-type-"+e.num},s,e.colour)},"drawSection"),yt=-1,$t=(0,i.eW)(function(t,e,s){const c=e.x+s.width/2,n=t.append("g");yt++;const f=300+5*30;n.append("line").attr("id","task"+yt).attr("x1",c).attr("y1",e.y).attr("x2",c).attr("y2",f).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),St(n,{cx:c,cy:300+(5-e.score)*30,score:e.score});const u=(0,B.kc)();u.x=e.x,u.y=e.y,u.fill=e.fill,u.width=s.width,u.height=s.height,u.class="task task-type-"+e.num,u.rx=3,u.ry=3,et(n,u);let y=e.x+14;e.people.forEach(m=>{const x=e.actors[m].color,_={cx:y,cy:e.y,r:7,fill:x,stroke:"#000",title:m,pos:e.actors[m].position};ut(n,_),y+=10}),ft(s)(e.task,n,u.x,u.y,u.width,u.height,{class:"task"},s,e.colour)},"drawTask"),At=(0,i.eW)(function(t,e){(0,B.O)(t,e)},"drawBackgroundRect"),ft=function(){function t(n,f,u,y,m,x,_,h){const r=f.append("text").attr("x",u+m/2).attr("y",y+x/2+5).style("font-color",h).style("text-anchor","middle").text(n);c(r,_)}(0,i.eW)(t,"byText");function e(n,f,u,y,m,x,_,h,r){const{taskFontSize:a,taskFontFamily:l}=h,d=n.split(/<br\s*\/?>/gi);for(let g=0;g<d.length;g++){const o=g*a-a*(d.length-1)/2,S=f.append("text").attr("x",u+m/2).attr("y",y).attr("fill",r).style("text-anchor","middle").style("font-size",a).style("font-family",l);S.append("tspan").attr("x",u+m/2).attr("dy",o).text(d[g]),S.attr("y",y+x/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),c(S,_)}}(0,i.eW)(e,"byTspan");function s(n,f,u,y,m,x,_,h){const r=f.append("switch"),l=r.append("foreignObject").attr("x",u).attr("y",y).attr("width",m).attr("height",x).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");l.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(n),e(n,r,u,y,m,x,_,h),c(l,_)}(0,i.eW)(s,"byFo");function c(n,f){for(const u in f)u in f&&n.attr(u,f[u])}return(0,i.eW)(c,"_setTextAttrs"),function(n){return n.textPlacement==="fo"?s:n.textPlacement==="old"?t:e}}(),It=(0,i.eW)(function(t){t.append("defs").append("marker").attr("id","arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),X={drawRect:et,drawCircle:ut,drawSection:Ct,drawText:dt,drawLabel:Pt,drawTask:$t,drawBackgroundRect:At,initGraphics:It},Rt=(0,i.eW)(function(t){Object.keys(t).forEach(function(s){R[s]=t[s]})},"setConf"),F={},Q=0;function pt(t){const e=(0,w.nV)().journey,s=e.maxLabelWidth;Q=0;let c=60;Object.keys(F).forEach(n=>{const f=F[n].color,u={cx:20,cy:c,r:7,fill:f,stroke:"#000",pos:F[n].position};X.drawCircle(t,u);let y=t.append("text").attr("visibility","hidden").text(n);const m=y.node().getBoundingClientRect().width;y.remove();let x=[];if(m<=s)x=[n];else{const _=n.split(" ");let h="";y=t.append("text").attr("visibility","hidden"),_.forEach(r=>{const a=h?`${h} ${r}`:r;if(y.text(a),y.node().getBoundingClientRect().width>s){if(h&&x.push(h),h=r,y.text(r),y.node().getBoundingClientRect().width>s){let d="";for(const g of r)d+=g,y.text(d+"-"),y.node().getBoundingClientRect().width>s&&(x.push(d.slice(0,-1)+"-"),d=g);h=d}}else h=a}),h&&x.push(h),y.remove()}x.forEach((_,h)=>{const r={x:40,y:c+7+h*20,fill:"#666",text:_,textMargin:e.boxTextMargin??5},l=X.drawText(t,r).node().getBoundingClientRect().width;l>Q&&l>e.leftMargin-l&&(Q=l)}),c+=Math.max(20,x.length*20)})}(0,i.eW)(pt,"drawActorLegend");var R=(0,w.nV)().journey,O=0,Bt=(0,i.eW)(function(t,e,s,c){const n=(0,w.nV)(),f=n.journey.titleColor,u=n.journey.titleFontSize,y=n.journey.titleFontFamily,m=n.securityLevel;let x;m==="sandbox"&&(x=(0,N.Ys)("#i"+e));const _=m==="sandbox"?(0,N.Ys)(x.nodes()[0].contentDocument.body):(0,N.Ys)("body");$.init();const h=_.select("#"+e);X.initGraphics(h);const r=c.db.getTasks(),a=c.db.getDiagramTitle(),l=c.db.getActors();for(const j in F)delete F[j];let d=0;l.forEach(j=>{F[j]={color:R.actorColours[d%R.actorColours.length],position:d},d++}),pt(h),O=R.leftMargin+Q,$.insert(0,0,O,Object.keys(F).length*50),Ft(h,r,0);const g=$.getBounds();a&&h.append("text").text(a).attr("x",O).attr("font-size",u).attr("font-weight","bold").attr("y",25).attr("fill",f).attr("font-family",y);const o=g.stopy-g.starty+2*R.diagramMarginY,S=O+g.stopx+2*R.diagramMarginX;(0,w.v2)(h,o,S,R.useMaxWidth),h.append("line").attr("x1",O).attr("y1",R.height*4).attr("x2",S-O-4).attr("y2",R.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#arrowhead)");const v=a?70:0;h.attr("viewBox",`${g.startx} -25 ${S} ${o+v}`),h.attr("preserveAspectRatio","xMinYMin meet"),h.attr("height",o+v+25)},"draw"),$={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:(0,i.eW)(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:(0,i.eW)(function(t,e,s,c){t[e]===void 0?t[e]=s:t[e]=c(s,t[e])},"updateVal"),updateBounds:(0,i.eW)(function(t,e,s,c){const n=(0,w.nV)().journey,f=this;let u=0;function y(m){return(0,i.eW)(function(_){u++;const h=f.sequenceItems.length-u+1;f.updateVal(_,"starty",e-h*n.boxMargin,Math.min),f.updateVal(_,"stopy",c+h*n.boxMargin,Math.max),f.updateVal($.data,"startx",t-h*n.boxMargin,Math.min),f.updateVal($.data,"stopx",s+h*n.boxMargin,Math.max),m!=="activation"&&(f.updateVal(_,"startx",t-h*n.boxMargin,Math.min),f.updateVal(_,"stopx",s+h*n.boxMargin,Math.max),f.updateVal($.data,"starty",e-h*n.boxMargin,Math.min),f.updateVal($.data,"stopy",c+h*n.boxMargin,Math.max))},"updateItemBounds")}(0,i.eW)(y,"updateFn"),this.sequenceItems.forEach(y())},"updateBounds"),insert:(0,i.eW)(function(t,e,s,c){const n=Math.min(t,s),f=Math.max(t,s),u=Math.min(e,c),y=Math.max(e,c);this.updateVal($.data,"startx",n,Math.min),this.updateVal($.data,"starty",u,Math.min),this.updateVal($.data,"stopx",f,Math.max),this.updateVal($.data,"stopy",y,Math.max),this.updateBounds(n,u,f,y)},"insert"),bumpVerticalPos:(0,i.eW)(function(t){this.verticalPos=this.verticalPos+t,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:(0,i.eW)(function(){return this.verticalPos},"getVerticalPos"),getBounds:(0,i.eW)(function(){return this.data},"getBounds")},rt=R.sectionFills,gt=R.sectionColours,Ft=(0,i.eW)(function(t,e,s){const c=(0,w.nV)().journey;let n="";const f=c.height*2+c.diagramMarginY,u=s+f;let y=0,m="#CCC",x="black",_=0;for(const[h,r]of e.entries()){if(n!==r.section){m=rt[y%rt.length],_=y%rt.length,x=gt[y%gt.length];let l=0;const d=r.section;for(let o=h;o<e.length&&e[o].section==d;o++)l=l+1;const g={x:h*c.taskMargin+h*c.width+O,y:50,text:r.section,fill:m,num:_,colour:x,taskCount:l};X.drawSection(t,g,c),n=r.section,y++}const a=r.people.reduce((l,d)=>(F[d]&&(l[d]=F[d]),l),{});r.x=h*c.taskMargin+h*c.width+O,r.y=u,r.width=c.diagramMarginX,r.height=c.diagramMarginY,r.colour=x,r.fill=m,r.num=_,r.actors=a,X.drawTask(t,r,c),$.insert(r.x,r.y,r.x+r.width+c.taskMargin,300+5*30)}},"drawTasks"),mt={setConf:Rt,draw:Bt},Lt={parser:tt,db:ht,renderer:mt,styles:Mt,init:(0,i.eW)(t=>{mt.setConf(t.journey),ht.clear()},"init")}}}]);})();
