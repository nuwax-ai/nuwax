"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[3131],{82997:function(lt,K,P){P.d(K,{AD:function(){return j},AE:function(){return D},Mu:function(){return n},O:function(){return O},kc:function(){return G},rB:function(){return F},yU:function(){return H}});var E=P(27246),z=P(80357),n=(0,E.eW)((w,p)=>{const k=w.append("rect");if(k.attr("x",p.x),k.attr("y",p.y),k.attr("fill",p.fill),k.attr("stroke",p.stroke),k.attr("width",p.width),k.attr("height",p.height),p.name&&k.attr("name",p.name),p.rx&&k.attr("rx",p.rx),p.ry&&k.attr("ry",p.ry),p.attrs!==void 0)for(const W in p.attrs)k.attr(W,p.attrs[W]);return p.class&&k.attr("class",p.class),k},"drawRect"),O=(0,E.eW)((w,p)=>{const k={x:p.startx,y:p.starty,width:p.stopx-p.startx,height:p.stopy-p.starty,fill:p.fill,stroke:p.stroke,class:"rect"};n(w,k).lower()},"drawBackgroundRect"),H=(0,E.eW)((w,p)=>{const k=p.text.replace(E.Vw," "),W=w.append("text");W.attr("x",p.x),W.attr("y",p.y),W.attr("class","legend"),W.style("text-anchor",p.anchor),p.class&&W.attr("class",p.class);const $=W.append("tspan");return $.attr("x",p.x+p.textMargin*2),$.text(k),W},"drawText"),D=(0,E.eW)((w,p,k,W)=>{const $=w.append("image");$.attr("x",p),$.attr("y",k);const X=(0,z.N)(W);$.attr("xlink:href",X)},"drawImage"),F=(0,E.eW)((w,p,k,W)=>{const $=w.append("use");$.attr("x",p),$.attr("y",k);const X=(0,z.N)(W);$.attr("xlink:href",`#${X}`)},"drawEmbeddedImage"),G=(0,E.eW)(()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),"getNoteRect"),j=(0,E.eW)(()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0}),"getTextObj")},77901:function(lt,K,P){P.d(K,{G:function(){return z}});var E=P(27246),z=(0,E.eW)(()=>`
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
`,"getIconStyles")},3131:function(lt,K,P){P.d(K,{diagram:function(){return Ft}});var E=P(82997),z=P(77901),n=P(27246),O=P(59448),H=function(){var t=(0,n.eW)(function(h,r,a,l){for(a=a||{},l=h.length;l--;a[h[l]]=r);return a},"o"),e=[6,8,10,11,12,14,16,17,18],s=[1,9],c=[1,10],i=[1,11],f=[1,12],u=[1,13],y=[1,14],m={trace:(0,n.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:(0,n.eW)(function(r,a,l,d,g,o,M){var v=o.length-1;switch(g){case 1:return o[v-1];case 2:this.$=[];break;case 3:o[v-1].push(o[v]),this.$=o[v-1];break;case 4:case 5:this.$=o[v];break;case 6:case 7:this.$=[];break;case 8:d.setDiagramTitle(o[v].substr(6)),this.$=o[v].substr(6);break;case 9:this.$=o[v].trim(),d.setAccTitle(this.$);break;case 10:case 11:this.$=o[v].trim(),d.setAccDescription(this.$);break;case 12:d.addSection(o[v].substr(8)),this.$=o[v].substr(8);break;case 13:d.addTask(o[v-1],o[v]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:s,12:c,14:i,16:f,17:u,18:y},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:15,11:s,12:c,14:i,16:f,17:u,18:y},t(e,[2,5]),t(e,[2,6]),t(e,[2,8]),{13:[1,16]},{15:[1,17]},t(e,[2,11]),t(e,[2,12]),{19:[1,18]},t(e,[2,4]),t(e,[2,9]),t(e,[2,10]),t(e,[2,13])],defaultActions:{},parseError:(0,n.eW)(function(r,a){if(a.recoverable)this.trace(r);else{var l=new Error(r);throw l.hash=a,l}},"parseError"),parse:(0,n.eW)(function(r){var a=this,l=[0],d=[],g=[null],o=[],M=this.table,v="",B=0,mt=0,xt=0,Lt=2,_t=1,Bt=o.slice.call(arguments,1),b=Object.create(this.lexer),N={yy:{}};for(var rt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,rt)&&(N.yy[rt]=this.yy[rt]);b.setInput(r,N.yy),N.yy.lexer=b,N.yy.parser=this,typeof b.yylloc>"u"&&(b.yylloc={});var nt=b.yylloc;o.push(nt);var Ot=b.options&&b.options.ranges;typeof N.yy.parseError=="function"?this.parseError=N.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function jt(S){l.length=l.length-2*S,g.length=g.length-S,o.length=o.length-S}(0,n.eW)(jt,"popStack");function kt(){var S;return S=d.pop()||b.lex()||_t,typeof S!="number"&&(S instanceof Array&&(d=S,S=d.pop()),S=a.symbols_[S]||S),S}(0,n.eW)(kt,"lex");for(var T,it,Y,I,Nt,st,U={},Q,V,vt,q;;){if(Y=l[l.length-1],this.defaultActions[Y]?I=this.defaultActions[Y]:((T===null||typeof T>"u")&&(T=kt()),I=M[Y]&&M[Y][T]),typeof I>"u"||!I.length||!I[0]){var at="";q=[];for(Q in M[Y])this.terminals_[Q]&&Q>Lt&&q.push("'"+this.terminals_[Q]+"'");b.showPosition?at="Parse error on line "+(B+1)+`:
`+b.showPosition()+`
Expecting `+q.join(", ")+", got '"+(this.terminals_[T]||T)+"'":at="Parse error on line "+(B+1)+": Unexpected "+(T==_t?"end of input":"'"+(this.terminals_[T]||T)+"'"),this.parseError(at,{text:b.match,token:this.terminals_[T]||T,line:b.yylineno,loc:nt,expected:q})}if(I[0]instanceof Array&&I.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Y+", token: "+T);switch(I[0]){case 1:l.push(T),g.push(b.yytext),o.push(b.yylloc),l.push(I[1]),T=null,it?(T=it,it=null):(mt=b.yyleng,v=b.yytext,B=b.yylineno,nt=b.yylloc,xt>0&&xt--);break;case 2:if(V=this.productions_[I[1]][1],U.$=g[g.length-V],U._$={first_line:o[o.length-(V||1)].first_line,last_line:o[o.length-1].last_line,first_column:o[o.length-(V||1)].first_column,last_column:o[o.length-1].last_column},Ot&&(U._$.range=[o[o.length-(V||1)].range[0],o[o.length-1].range[1]]),st=this.performAction.apply(U,[v,mt,B,N.yy,I[1],g,o].concat(Bt)),typeof st<"u")return st;V&&(l=l.slice(0,-1*V*2),g=g.slice(0,-1*V),o=o.slice(0,-1*V)),l.push(this.productions_[I[1]][0]),g.push(U.$),o.push(U._$),vt=M[l[l.length-2]][l[l.length-1]],l.push(vt);break;case 3:return!0}}return!0},"parse")},x=function(){var h={EOF:1,parseError:(0,n.eW)(function(a,l){if(this.yy.parser)this.yy.parser.parseError(a,l);else throw new Error(a)},"parseError"),setInput:(0,n.eW)(function(r,a){return this.yy=a||this.yy||{},this._input=r,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,n.eW)(function(){var r=this._input[0];this.yytext+=r,this.yyleng++,this.offset++,this.match+=r,this.matched+=r;var a=r.match(/(?:\r\n?|\n).*/g);return a?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),r},"input"),unput:(0,n.eW)(function(r){var a=r.length,l=r.split(/(?:\r\n?|\n)/g);this._input=r+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-a),this.offset-=a;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),l.length-1&&(this.yylineno-=l.length-1);var g=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:l?(l.length===d.length?this.yylloc.first_column:0)+d[d.length-l.length].length-l[0].length:this.yylloc.first_column-a},this.options.ranges&&(this.yylloc.range=[g[0],g[0]+this.yyleng-a]),this.yyleng=this.yytext.length,this},"unput"),more:(0,n.eW)(function(){return this._more=!0,this},"more"),reject:(0,n.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,n.eW)(function(r){this.unput(this.match.slice(r))},"less"),pastInput:(0,n.eW)(function(){var r=this.matched.substr(0,this.matched.length-this.match.length);return(r.length>20?"...":"")+r.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,n.eW)(function(){var r=this.match;return r.length<20&&(r+=this._input.substr(0,20-r.length)),(r.substr(0,20)+(r.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,n.eW)(function(){var r=this.pastInput(),a=new Array(r.length+1).join("-");return r+this.upcomingInput()+`
`+a+"^"},"showPosition"),test_match:(0,n.eW)(function(r,a){var l,d,g;if(this.options.backtrack_lexer&&(g={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(g.yylloc.range=this.yylloc.range.slice(0))),d=r[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+r[0].length},this.yytext+=r[0],this.match+=r[0],this.matches=r,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(r[0].length),this.matched+=r[0],l=this.performAction.call(this,this.yy,this,a,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),l)return l;if(this._backtrack){for(var o in g)this[o]=g[o];return!1}return!1},"test_match"),next:(0,n.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var r,a,l,d;this._more||(this.yytext="",this.match="");for(var g=this._currentRules(),o=0;o<g.length;o++)if(l=this._input.match(this.rules[g[o]]),l&&(!a||l[0].length>a[0].length)){if(a=l,d=o,this.options.backtrack_lexer){if(r=this.test_match(l,g[o]),r!==!1)return r;if(this._backtrack){a=!1;continue}else return!1}else if(!this.options.flex)break}return a?(r=this.test_match(a,g[d]),r!==!1?r:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,n.eW)(function(){var a=this.next();return a||this.lex()},"lex"),begin:(0,n.eW)(function(a){this.conditionStack.push(a)},"begin"),popState:(0,n.eW)(function(){var a=this.conditionStack.length-1;return a>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,n.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,n.eW)(function(a){return a=this.conditionStack.length-1-Math.abs(a||0),a>=0?this.conditionStack[a]:"INITIAL"},"topState"),pushState:(0,n.eW)(function(a){this.begin(a)},"pushState"),stateStackSize:(0,n.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,n.eW)(function(a,l,d,g){var o=g;switch(d){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;break;case 8:return this.popState(),"acc_title_value";break;case 9:return this.begin("acc_descr"),14;break;case 10:return this.popState(),"acc_descr_value";break;case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return h}();m.lexer=x;function _(){this.yy={}}return(0,n.eW)(_,"Parser"),_.prototype=m,m.Parser=_,new _}();H.parser=H;var D=H,F="",G=[],j=[],w=[],p=(0,n.eW)(function(){G.length=0,j.length=0,F="",w.length=0,(0,n.ZH)()},"clear"),k=(0,n.eW)(function(t){F=t,G.push(t)},"addSection"),W=(0,n.eW)(function(){return G},"getSections"),$=(0,n.eW)(function(){let t=ot();const e=100;let s=0;for(;!t&&s<e;)t=ot(),s++;return j.push(...w),j},"getTasks"),X=(0,n.eW)(function(){const t=[];return j.forEach(s=>{s.people&&t.push(...s.people)}),[...new Set(t)].sort()},"updateActors"),bt=(0,n.eW)(function(t,e){const s=e.substr(1).split(":");let c=0,i=[];s.length===1?(c=Number(s[0]),i=[]):(c=Number(s[0]),i=s[1].split(","));const f=i.map(y=>y.trim()),u={section:F,type:F,people:f,task:t,score:c};w.push(u)},"addTask"),wt=(0,n.eW)(function(t){const e={section:F,type:F,description:t,task:t,classes:[]};j.push(e)},"addTaskOrg"),ot=(0,n.eW)(function(){const t=(0,n.eW)(function(s){return w[s].processed},"compileTask");let e=!0;for(const[s,c]of w.entries())t(s),e=e&&c.processed;return e},"compileTasks"),Wt=(0,n.eW)(function(){return X()},"getActors"),ct={getConfig:(0,n.eW)(()=>(0,n.nV)().journey,"getConfig"),clear:p,setDiagramTitle:n.g2,getDiagramTitle:n.Kr,setAccTitle:n.GN,getAccTitle:n.eu,setAccDescription:n.U$,getAccDescription:n.Mx,addSection:k,getSections:W,getTasks:$,addTask:bt,addTaskOrg:wt,getActors:Wt},Et=(0,n.eW)(t=>`.label {
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
  ${(0,z.G)()}
`,"getStyles"),Tt=Et,tt=(0,n.eW)(function(t,e){return(0,E.Mu)(t,e)},"drawRect"),Mt=(0,n.eW)(function(t,e){const c=t.append("circle").attr("cx",e.cx).attr("cy",e.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),i=t.append("g");i.append("circle").attr("cx",e.cx-15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),i.append("circle").attr("cx",e.cx+15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function f(m){const x=(0,O.Nb1)().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+2)+")")}(0,n.eW)(f,"smile");function u(m){const x=(0,O.Nb1)().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+7)+")")}(0,n.eW)(u,"sad");function y(m){m.append("line").attr("class","mouth").attr("stroke",2).attr("x1",e.cx-5).attr("y1",e.cy+7).attr("x2",e.cx+5).attr("y2",e.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return(0,n.eW)(y,"ambivalent"),e.score>3?f(i):e.score<3?u(i):y(i),c},"drawFace"),ht=(0,n.eW)(function(t,e){const s=t.append("circle");return s.attr("cx",e.cx),s.attr("cy",e.cy),s.attr("class","actor-"+e.pos),s.attr("fill",e.fill),s.attr("stroke",e.stroke),s.attr("r",e.r),s.class!==void 0&&s.attr("class",s.class),e.title!==void 0&&s.append("title").text(e.title),s},"drawCircle"),ut=(0,n.eW)(function(t,e){return(0,E.yU)(t,e)},"drawText"),St=(0,n.eW)(function(t,e){function s(i,f,u,y,m){return i+","+f+" "+(i+u)+","+f+" "+(i+u)+","+(f+y-m)+" "+(i+u-m*1.2)+","+(f+y)+" "+i+","+(f+y)}(0,n.eW)(s,"genPoints");const c=t.append("polygon");c.attr("points",s(e.x,e.y,50,20,7)),c.attr("class","labelBox"),e.y=e.y+e.labelMargin,e.x=e.x+.5*e.labelMargin,ut(t,e)},"drawLabel"),Pt=(0,n.eW)(function(t,e,s){const c=t.append("g"),i=(0,E.kc)();i.x=e.x,i.y=e.y,i.fill=e.fill,i.width=s.width*e.taskCount+s.diagramMarginX*(e.taskCount-1),i.height=s.height,i.class="journey-section section-type-"+e.num,i.rx=3,i.ry=3,tt(c,i),yt(s)(e.text,c,i.x,i.y,i.width,i.height,{class:"journey-section section-type-"+e.num},s,e.colour)},"drawSection"),dt=-1,$t=(0,n.eW)(function(t,e,s){const c=e.x+s.width/2,i=t.append("g");dt++;const f=300+5*30;i.append("line").attr("id","task"+dt).attr("x1",c).attr("y1",e.y).attr("x2",c).attr("y2",f).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Mt(i,{cx:c,cy:300+(5-e.score)*30,score:e.score});const u=(0,E.kc)();u.x=e.x,u.y=e.y,u.fill=e.fill,u.width=s.width,u.height=s.height,u.class="task task-type-"+e.num,u.rx=3,u.ry=3,tt(i,u);let y=e.x+14;e.people.forEach(m=>{const x=e.actors[m].color,_={cx:y,cy:e.y,r:7,fill:x,stroke:"#000",title:m,pos:e.actors[m].position};ht(i,_),y+=10}),yt(s)(e.task,i,u.x,u.y,u.width,u.height,{class:"task"},s,e.colour)},"drawTask"),Ct=(0,n.eW)(function(t,e){(0,E.O)(t,e)},"drawBackgroundRect"),yt=function(){function t(i,f,u,y,m,x,_,h){const r=f.append("text").attr("x",u+m/2).attr("y",y+x/2+5).style("font-color",h).style("text-anchor","middle").text(i);c(r,_)}(0,n.eW)(t,"byText");function e(i,f,u,y,m,x,_,h,r){const{taskFontSize:a,taskFontFamily:l}=h,d=i.split(/<br\s*\/?>/gi);for(let g=0;g<d.length;g++){const o=g*a-a*(d.length-1)/2,M=f.append("text").attr("x",u+m/2).attr("y",y).attr("fill",r).style("text-anchor","middle").style("font-size",a).style("font-family",l);M.append("tspan").attr("x",u+m/2).attr("dy",o).text(d[g]),M.attr("y",y+x/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),c(M,_)}}(0,n.eW)(e,"byTspan");function s(i,f,u,y,m,x,_,h){const r=f.append("switch"),l=r.append("foreignObject").attr("x",u).attr("y",y).attr("width",m).attr("height",x).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");l.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(i),e(i,r,u,y,m,x,_,h),c(l,_)}(0,n.eW)(s,"byFo");function c(i,f){for(const u in f)u in f&&i.attr(u,f[u])}return(0,n.eW)(c,"_setTextAttrs"),function(i){return i.textPlacement==="fo"?s:i.textPlacement==="old"?t:e}}(),It=(0,n.eW)(function(t){t.append("defs").append("marker").attr("id","arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),Z={drawRect:tt,drawCircle:ht,drawSection:Pt,drawText:ut,drawLabel:St,drawTask:$t,drawBackgroundRect:Ct,initGraphics:It},At=(0,n.eW)(function(t){Object.keys(t).forEach(function(s){A[s]=t[s]})},"setConf"),R={},J=0;function ft(t){const e=(0,n.nV)().journey,s=e.maxLabelWidth;J=0;let c=60;Object.keys(R).forEach(i=>{const f=R[i].color,u={cx:20,cy:c,r:7,fill:f,stroke:"#000",pos:R[i].position};Z.drawCircle(t,u);let y=t.append("text").attr("visibility","hidden").text(i);const m=y.node().getBoundingClientRect().width;y.remove();let x=[];if(m<=s)x=[i];else{const _=i.split(" ");let h="";y=t.append("text").attr("visibility","hidden"),_.forEach(r=>{const a=h?`${h} ${r}`:r;if(y.text(a),y.node().getBoundingClientRect().width>s){if(h&&x.push(h),h=r,y.text(r),y.node().getBoundingClientRect().width>s){let d="";for(const g of r)d+=g,y.text(d+"-"),y.node().getBoundingClientRect().width>s&&(x.push(d.slice(0,-1)+"-"),d=g);h=d}}else h=a}),h&&x.push(h),y.remove()}x.forEach((_,h)=>{const r={x:40,y:c+7+h*20,fill:"#666",text:_,textMargin:e.boxTextMargin??5},l=Z.drawText(t,r).node().getBoundingClientRect().width;l>J&&l>e.leftMargin-l&&(J=l)}),c+=Math.max(20,x.length*20)})}(0,n.eW)(ft,"drawActorLegend");var A=(0,n.nV)().journey,L=0,Rt=(0,n.eW)(function(t,e,s,c){const i=(0,n.nV)(),f=i.journey.titleColor,u=i.journey.titleFontSize,y=i.journey.titleFontFamily,m=i.securityLevel;let x;m==="sandbox"&&(x=(0,O.Ys)("#i"+e));const _=m==="sandbox"?(0,O.Ys)(x.nodes()[0].contentDocument.body):(0,O.Ys)("body");C.init();const h=_.select("#"+e);Z.initGraphics(h);const r=c.db.getTasks(),a=c.db.getDiagramTitle(),l=c.db.getActors();for(const B in R)delete R[B];let d=0;l.forEach(B=>{R[B]={color:A.actorColours[d%A.actorColours.length],position:d},d++}),ft(h),L=A.leftMargin+J,C.insert(0,0,L,Object.keys(R).length*50),Vt(h,r,0);const g=C.getBounds();a&&h.append("text").text(a).attr("x",L).attr("font-size",u).attr("font-weight","bold").attr("y",25).attr("fill",f).attr("font-family",y);const o=g.stopy-g.starty+2*A.diagramMarginY,M=L+g.stopx+2*A.diagramMarginX;(0,n.v2)(h,o,M,A.useMaxWidth),h.append("line").attr("x1",L).attr("y1",A.height*4).attr("x2",M-L-4).attr("y2",A.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#arrowhead)");const v=a?70:0;h.attr("viewBox",`${g.startx} -25 ${M} ${o+v}`),h.attr("preserveAspectRatio","xMinYMin meet"),h.attr("height",o+v+25)},"draw"),C={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:(0,n.eW)(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:(0,n.eW)(function(t,e,s,c){t[e]===void 0?t[e]=s:t[e]=c(s,t[e])},"updateVal"),updateBounds:(0,n.eW)(function(t,e,s,c){const i=(0,n.nV)().journey,f=this;let u=0;function y(m){return(0,n.eW)(function(_){u++;const h=f.sequenceItems.length-u+1;f.updateVal(_,"starty",e-h*i.boxMargin,Math.min),f.updateVal(_,"stopy",c+h*i.boxMargin,Math.max),f.updateVal(C.data,"startx",t-h*i.boxMargin,Math.min),f.updateVal(C.data,"stopx",s+h*i.boxMargin,Math.max),m!=="activation"&&(f.updateVal(_,"startx",t-h*i.boxMargin,Math.min),f.updateVal(_,"stopx",s+h*i.boxMargin,Math.max),f.updateVal(C.data,"starty",e-h*i.boxMargin,Math.min),f.updateVal(C.data,"stopy",c+h*i.boxMargin,Math.max))},"updateItemBounds")}(0,n.eW)(y,"updateFn"),this.sequenceItems.forEach(y())},"updateBounds"),insert:(0,n.eW)(function(t,e,s,c){const i=Math.min(t,s),f=Math.max(t,s),u=Math.min(e,c),y=Math.max(e,c);this.updateVal(C.data,"startx",i,Math.min),this.updateVal(C.data,"starty",u,Math.min),this.updateVal(C.data,"stopx",f,Math.max),this.updateVal(C.data,"stopy",y,Math.max),this.updateBounds(i,u,f,y)},"insert"),bumpVerticalPos:(0,n.eW)(function(t){this.verticalPos=this.verticalPos+t,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:(0,n.eW)(function(){return this.verticalPos},"getVerticalPos"),getBounds:(0,n.eW)(function(){return this.data},"getBounds")},et=A.sectionFills,pt=A.sectionColours,Vt=(0,n.eW)(function(t,e,s){const c=(0,n.nV)().journey;let i="";const f=c.height*2+c.diagramMarginY,u=s+f;let y=0,m="#CCC",x="black",_=0;for(const[h,r]of e.entries()){if(i!==r.section){m=et[y%et.length],_=y%et.length,x=pt[y%pt.length];let l=0;const d=r.section;for(let o=h;o<e.length&&e[o].section==d;o++)l=l+1;const g={x:h*c.taskMargin+h*c.width+L,y:50,text:r.section,fill:m,num:_,colour:x,taskCount:l};Z.drawSection(t,g,c),i=r.section,y++}const a=r.people.reduce((l,d)=>(R[d]&&(l[d]=R[d]),l),{});r.x=h*c.taskMargin+h*c.width+L,r.y=u,r.width=c.diagramMarginX,r.height=c.diagramMarginY,r.colour=x,r.fill=m,r.num=_,r.actors=a,Z.drawTask(t,r,c),C.insert(r.x,r.y,r.x+r.width+c.taskMargin,300+5*30)}},"drawTasks"),gt={setConf:At,draw:Rt},Ft={parser:D,db:ct,renderer:gt,styles:Tt,init:(0,n.eW)(t=>{gt.setConf(t.journey),ct.clear()},"init")}}}]);})();
