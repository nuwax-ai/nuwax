"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4431],{62801:function(ut,G,S){S.d(G,{AD:function(){return Y},AE:function(){return nt},Mu:function(){return s},N6:function(){return N},O:function(){return W},kc:function(){return X},rB:function(){return L},yU:function(){return H}});var Z=S(90687),P=S(69849),w=S(12657),et=S(40396),s=(0,P.e)((E,f)=>{const k=E.append("rect");if(k.attr("x",f.x),k.attr("y",f.y),k.attr("fill",f.fill),k.attr("stroke",f.stroke),k.attr("width",f.width),k.attr("height",f.height),f.name&&k.attr("name",f.name),f.rx&&k.attr("rx",f.rx),f.ry&&k.attr("ry",f.ry),f.attrs!==void 0)for(const T in f.attrs)k.attr(T,f.attrs[T]);return f.class&&k.attr("class",f.class),k},"drawRect"),W=(0,P.e)((E,f)=>{const k={x:f.startx,y:f.starty,width:f.stopx-f.startx,height:f.stopy-f.starty,fill:f.fill,stroke:f.stroke,class:"rect"};s(E,k).lower()},"drawBackgroundRect"),H=(0,P.e)((E,f)=>{const k=f.text.replace(Z.Vw," "),T=E.append("text");T.attr("x",f.x),T.attr("y",f.y),T.attr("class","legend"),T.style("text-anchor",f.anchor),f.class&&T.attr("class",f.class);const $=T.append("tspan");return $.attr("x",f.x+f.textMargin*2),$.text(k),T},"drawText"),nt=(0,P.e)((E,f,k,T)=>{const $=E.append("image");$.attr("x",f),$.attr("y",k);const J=(0,w.N)(T);$.attr("xlink:href",J)},"drawImage"),L=(0,P.e)((E,f,k,T)=>{const $=E.append("use");$.attr("x",f),$.attr("y",k);const J=(0,w.N)(T);$.attr("xlink:href",`#${J}`)},"drawEmbeddedImage"),X=(0,P.e)(()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),"getNoteRect"),Y=(0,P.e)(()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0}),"getTextObj"),N=(0,P.e)(()=>{let E=(0,et.Ys)(".mermaidTooltip");return E.empty()&&(E=(0,et.Ys)("body").append("div").attr("class","mermaidTooltip").style("opacity",0).style("position","absolute").style("text-align","center").style("max-width","200px").style("padding","2px").style("font-size","12px").style("background","#ffffde").style("border","1px solid #333").style("border-radius","2px").style("pointer-events","none").style("z-index","100")),E},"createTooltip")},93730:function(ut,G,S){S.d(G,{G:function(){return P}});var Z=S(69849),P=(0,Z.e)(()=>`
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
`,"getIconStyles")},24431:function(ut,G,S){S.d(G,{diagram:function(){return Ft}});var Z=S(93730),P=S(62801),w=S(90687),et=S(7004),s=S(69849),W=S(40396),H=function(){var t=(0,s.e)(function(h,r,i,l){for(i=i||{},l=h.length;l--;i[h[l]]=r);return i},"o"),e=[6,8,10,11,12,14,16,17,18],a=[1,9],p=[1,10],n=[1,11],u=[1,12],g=[1,13],o=[1,14],m={trace:(0,s.e)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:(0,s.e)(function(r,i,l,d,y,c,M){var v=c.length-1;switch(y){case 1:return c[v-1];case 2:this.$=[];break;case 3:c[v-1].push(c[v]),this.$=c[v-1];break;case 4:case 5:this.$=c[v];break;case 6:case 7:this.$=[];break;case 8:d.setDiagramTitle(c[v].substr(6)),this.$=c[v].substr(6);break;case 9:this.$=c[v].trim(),d.setAccTitle(this.$);break;case 10:case 11:this.$=c[v].trim(),d.setAccDescription(this.$);break;case 12:d.addSection(c[v].substr(8)),this.$=c[v].substr(8);break;case 13:d.addTask(c[v-1],c[v]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:a,12:p,14:n,16:u,17:g,18:o},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:15,11:a,12:p,14:n,16:u,17:g,18:o},t(e,[2,5]),t(e,[2,6]),t(e,[2,8]),{13:[1,16]},{15:[1,17]},t(e,[2,11]),t(e,[2,12]),{19:[1,18]},t(e,[2,4]),t(e,[2,9]),t(e,[2,10]),t(e,[2,13])],defaultActions:{},parseError:(0,s.e)(function(r,i){if(i.recoverable)this.trace(r);else{var l=new Error(r);throw l.hash=i,l}},"parseError"),parse:(0,s.e)(function(r){var i=this,l=[0],d=[],y=[null],c=[],M=this.table,v="",j=0,kt=0,vt=0,jt=2,bt=1,Wt=c.slice.call(arguments,1),b=Object.create(this.lexer),z={yy:{}};for(var at in this.yy)Object.prototype.hasOwnProperty.call(this.yy,at)&&(z.yy[at]=this.yy[at]);b.setInput(r,z.yy),z.yy.lexer=b,z.yy.parser=this,typeof b.yylloc>"u"&&(b.yylloc={});var lt=b.yylloc;c.push(lt);var Yt=b.options&&b.options.ranges;typeof z.yy.parseError=="function"?this.parseError=z.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Nt(I){l.length=l.length-2*I,y.length=y.length-I,c.length=c.length-I}(0,s.e)(Nt,"popStack");function wt(){var I;return I=d.pop()||b.lex()||bt,typeof I!="number"&&(I instanceof Array&&(d=I,I=d.pop()),I=i.symbols_[I]||I),I}(0,s.e)(wt,"lex");for(var C,ot,U,R,zt,ct,K={},q,B,Et,tt;;){if(U=l[l.length-1],this.defaultActions[U]?R=this.defaultActions[U]:((C===null||typeof C>"u")&&(C=wt()),R=M[U]&&M[U][C]),typeof R>"u"||!R.length||!R[0]){var ht="";tt=[];for(q in M[U])this.terminals_[q]&&q>jt&&tt.push("'"+this.terminals_[q]+"'");b.showPosition?ht="Parse error on line "+(j+1)+`:
`+b.showPosition()+`
Expecting `+tt.join(", ")+", got '"+(this.terminals_[C]||C)+"'":ht="Parse error on line "+(j+1)+": Unexpected "+(C==bt?"end of input":"'"+(this.terminals_[C]||C)+"'"),this.parseError(ht,{text:b.match,token:this.terminals_[C]||C,line:b.yylineno,loc:lt,expected:tt})}if(R[0]instanceof Array&&R.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+C);switch(R[0]){case 1:l.push(C),y.push(b.yytext),c.push(b.yylloc),l.push(R[1]),C=null,ot?(C=ot,ot=null):(kt=b.yyleng,v=b.yytext,j=b.yylineno,lt=b.yylloc,vt>0&&vt--);break;case 2:if(B=this.productions_[R[1]][1],K.$=y[y.length-B],K._$={first_line:c[c.length-(B||1)].first_line,last_line:c[c.length-1].last_line,first_column:c[c.length-(B||1)].first_column,last_column:c[c.length-1].last_column},Yt&&(K._$.range=[c[c.length-(B||1)].range[0],c[c.length-1].range[1]]),ct=this.performAction.apply(K,[v,kt,j,z.yy,R[1],y,c].concat(Wt)),typeof ct<"u")return ct;B&&(l=l.slice(0,-1*B*2),y=y.slice(0,-1*B),c=c.slice(0,-1*B)),l.push(this.productions_[R[1]][0]),y.push(K.$),c.push(K._$),Et=M[l[l.length-2]][l[l.length-1]],l.push(Et);break;case 3:return!0}}return!0},"parse")},x=function(){var h={EOF:1,parseError:(0,s.e)(function(i,l){if(this.yy.parser)this.yy.parser.parseError(i,l);else throw new Error(i)},"parseError"),setInput:(0,s.e)(function(r,i){return this.yy=i||this.yy||{},this._input=r,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,s.e)(function(){var r=this._input[0];this.yytext+=r,this.yyleng++,this.offset++,this.match+=r,this.matched+=r;var i=r.match(/(?:\r\n?|\n).*/g);return i?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),r},"input"),unput:(0,s.e)(function(r){var i=r.length,l=r.split(/(?:\r\n?|\n)/g);this._input=r+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-i),this.offset-=i;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),l.length-1&&(this.yylineno-=l.length-1);var y=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:l?(l.length===d.length?this.yylloc.first_column:0)+d[d.length-l.length].length-l[0].length:this.yylloc.first_column-i},this.options.ranges&&(this.yylloc.range=[y[0],y[0]+this.yyleng-i]),this.yyleng=this.yytext.length,this},"unput"),more:(0,s.e)(function(){return this._more=!0,this},"more"),reject:(0,s.e)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,s.e)(function(r){this.unput(this.match.slice(r))},"less"),pastInput:(0,s.e)(function(){var r=this.matched.substr(0,this.matched.length-this.match.length);return(r.length>20?"...":"")+r.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,s.e)(function(){var r=this.match;return r.length<20&&(r+=this._input.substr(0,20-r.length)),(r.substr(0,20)+(r.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,s.e)(function(){var r=this.pastInput(),i=new Array(r.length+1).join("-");return r+this.upcomingInput()+`
`+i+"^"},"showPosition"),test_match:(0,s.e)(function(r,i){var l,d,y;if(this.options.backtrack_lexer&&(y={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(y.yylloc.range=this.yylloc.range.slice(0))),d=r[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+r[0].length},this.yytext+=r[0],this.match+=r[0],this.matches=r,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(r[0].length),this.matched+=r[0],l=this.performAction.call(this,this.yy,this,i,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),l)return l;if(this._backtrack){for(var c in y)this[c]=y[c];return!1}return!1},"test_match"),next:(0,s.e)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var r,i,l,d;this._more||(this.yytext="",this.match="");for(var y=this._currentRules(),c=0;c<y.length;c++)if(l=this._input.match(this.rules[y[c]]),l&&(!i||l[0].length>i[0].length)){if(i=l,d=c,this.options.backtrack_lexer){if(r=this.test_match(l,y[c]),r!==!1)return r;if(this._backtrack){i=!1;continue}else return!1}else if(!this.options.flex)break}return i?(r=this.test_match(i,y[d]),r!==!1?r:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,s.e)(function(){var i=this.next();return i||this.lex()},"lex"),begin:(0,s.e)(function(i){this.conditionStack.push(i)},"begin"),popState:(0,s.e)(function(){var i=this.conditionStack.length-1;return i>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,s.e)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,s.e)(function(i){return i=this.conditionStack.length-1-Math.abs(i||0),i>=0?this.conditionStack[i]:"INITIAL"},"topState"),pushState:(0,s.e)(function(i){this.begin(i)},"pushState"),stateStackSize:(0,s.e)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,s.e)(function(i,l,d,y){var c=y;switch(d){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;break;case 8:return this.popState(),"acc_title_value";break;case 9:return this.begin("acc_descr"),14;break;case 10:return this.popState(),"acc_descr_value";break;case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return h}();m.lexer=x;function _(){this.yy={}}return(0,s.e)(_,"Parser"),_.prototype=m,m.Parser=_,new _}();H.parser=H;var nt=H,L="",X=[],Y=[],N=[],E=(0,s.e)(function(){X.length=0,Y.length=0,L="",N.length=0,(0,w.ZH)()},"clear"),f=(0,s.e)(function(t){L=t,X.push(t)},"addSection"),k=(0,s.e)(function(){return X},"getSections"),T=(0,s.e)(function(){let t=dt();const e=100;let a=0;for(;!t&&a<e;)t=dt(),a++;return Y.push(...N),Y},"getTasks"),$=(0,s.e)(function(){const t=[];return Y.forEach(a=>{a.people&&t.push(...a.people)}),[...new Set(t)].sort()},"updateActors"),J=(0,s.e)(function(t,e){const a=e.substr(1).split(":");let p=0,n=[];a.length===1?(p=Number(a[0]),n=[]):(p=Number(a[0]),n=a[1].split(","));const u=n.map(o=>o.trim()),g={section:L,type:L,people:u,task:t,score:p};N.push(g)},"addTask"),Tt=(0,s.e)(function(t){const e={section:L,type:L,description:t,task:t,classes:[]};Y.push(e)},"addTaskOrg"),dt=(0,s.e)(function(){const t=(0,s.e)(function(a){return N[a].processed},"compileTask");let e=!0;for(const[a,p]of N.entries())t(a),e=e&&p.processed;return e},"compileTasks"),Mt=(0,s.e)(function(){return $()},"getActors"),yt={getConfig:(0,s.e)(()=>(0,w.nV)().journey,"getConfig"),clear:E,setDiagramTitle:w.g2,getDiagramTitle:w.Kr,setAccTitle:w.GN,getAccTitle:w.eu,setAccDescription:w.U$,getAccDescription:w.Mx,addSection:f,getSections:k,getTasks:T,addTask:J,addTaskOrg:Tt,getActors:Mt},St=(0,s.e)(t=>`.label {
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
  ${(0,Z.G)()}
`,"getStyles"),Pt=St,rt=(0,s.e)(function(t,e){return(0,P.Mu)(t,e)},"drawRect"),Ct=(0,s.e)(function(t,e){const p=t.append("circle").attr("cx",e.cx).attr("cy",e.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),n=t.append("g");n.append("circle").attr("cx",e.cx-15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),n.append("circle").attr("cx",e.cx+15/3).attr("cy",e.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function u(m){const x=(0,W.Nb1)().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+2)+")")}(0,s.e)(u,"smile");function g(m){const x=(0,W.Nb1)().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",x).attr("transform","translate("+e.cx+","+(e.cy+7)+")")}(0,s.e)(g,"sad");function o(m){m.append("line").attr("class","mouth").attr("stroke",2).attr("x1",e.cx-5).attr("y1",e.cy+7).attr("x2",e.cx+5).attr("y2",e.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return(0,s.e)(o,"ambivalent"),e.score>3?u(n):e.score<3?g(n):o(n),p},"drawFace"),ft=(0,s.e)(function(t,e){const a=t.append("circle");return a.attr("cx",e.cx),a.attr("cy",e.cy),a.attr("class","actor-"+e.pos),a.attr("fill",e.fill),a.attr("stroke",e.stroke),a.attr("r",e.r),a.class!==void 0&&a.attr("class",a.class),e.title!==void 0&&a.append("title").text(e.title),a},"drawCircle"),pt=(0,s.e)(function(t,e){return(0,P.yU)(t,e)},"drawText"),It=(0,s.e)(function(t,e){function a(n,u,g,o,m){return n+","+u+" "+(n+g)+","+u+" "+(n+g)+","+(u+o-m)+" "+(n+g-m*1.2)+","+(u+o)+" "+n+","+(u+o)}(0,s.e)(a,"genPoints");const p=t.append("polygon");p.attr("points",a(e.x,e.y,50,20,7)),p.attr("class","labelBox"),e.y=e.y+e.labelMargin,e.x=e.x+.5*e.labelMargin,pt(t,e)},"drawLabel"),$t=(0,s.e)(function(t,e,a){const p=t.append("g"),n=(0,P.kc)();n.x=e.x,n.y=e.y,n.fill=e.fill,n.width=a.width*e.taskCount+a.diagramMarginX*(e.taskCount-1),n.height=a.height,n.class="journey-section section-type-"+e.num,n.rx=3,n.ry=3,rt(p,n),gt(a)(e.text,p,n.x,n.y,n.width,n.height,{class:"journey-section section-type-"+e.num},a,e.colour)},"drawSection"),it=-1,At=(0,s.e)(function(t,e,a,p){const n=e.x+a.width/2,u=t.append("g");it++;const g=300+5*30;u.append("line").attr("id",p+"-task"+it).attr("x1",n).attr("y1",e.y).attr("x2",n).attr("y2",g).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Ct(u,{cx:n,cy:300+(5-e.score)*30,score:e.score});const o=(0,P.kc)();o.x=e.x,o.y=e.y,o.fill=e.fill,o.width=a.width,o.height=a.height,o.class="task task-type-"+e.num,o.rx=3,o.ry=3,rt(u,o);let m=e.x+14;e.people.forEach(x=>{const _=e.actors[x].color,h={cx:m,cy:e.y,r:7,fill:_,stroke:"#000",title:x,pos:e.actors[x].position};ft(u,h),m+=10}),gt(a)(e.task,u,o.x,o.y,o.width,o.height,{class:"task"},a,e.colour)},"drawTask"),Rt=(0,s.e)(function(t,e){(0,P.O)(t,e)},"drawBackgroundRect"),gt=function(){function t(n,u,g,o,m,x,_,h){const r=u.append("text").attr("x",g+m/2).attr("y",o+x/2+5).style("font-color",h).style("text-anchor","middle").text(n);p(r,_)}(0,s.e)(t,"byText");function e(n,u,g,o,m,x,_,h,r){const{taskFontSize:i,taskFontFamily:l}=h,d=n.split(/<br\s*\/?>/gi);for(let y=0;y<d.length;y++){const c=y*i-i*(d.length-1)/2,M=u.append("text").attr("x",g+m/2).attr("y",o).attr("fill",r).style("text-anchor","middle").style("font-size",i).style("font-family",l);M.append("tspan").attr("x",g+m/2).attr("dy",c).text(d[y]),M.attr("y",o+x/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),p(M,_)}}(0,s.e)(e,"byTspan");function a(n,u,g,o,m,x,_,h){const r=u.append("switch"),l=r.append("foreignObject").attr("x",g).attr("y",o).attr("width",m).attr("height",x).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");l.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(n),e(n,r,g,o,m,x,_,h),p(l,_)}(0,s.e)(a,"byFo");function p(n,u){for(const g in u)g in u&&n.attr(g,u[g])}return(0,s.e)(p,"_setTextAttrs"),function(n){return n.textPlacement==="fo"?a:n.textPlacement==="old"?t:e}}(),Vt=(0,s.e)(function(t,e){it=-1,t.append("defs").append("marker").attr("id",e+"-arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),Q={drawRect:rt,drawCircle:ft,drawSection:$t,drawText:pt,drawLabel:It,drawTask:At,drawBackgroundRect:Rt,initGraphics:Vt},Ot=(0,s.e)(function(t){Object.keys(t).forEach(function(a){V[a]=t[a]})},"setConf"),O={},D=0;function mt(t){const e=(0,w.nV)().journey,a=e.maxLabelWidth;D=0;let p=60;Object.keys(O).forEach(n=>{const u=O[n].color,g={cx:20,cy:p,r:7,fill:u,stroke:"#000",pos:O[n].position};Q.drawCircle(t,g);let o=t.append("text").attr("visibility","hidden").text(n);const m=o.node().getBoundingClientRect().width;o.remove();let x=[];if(m<=a)x=[n];else{const _=n.split(" ");let h="";o=t.append("text").attr("visibility","hidden"),_.forEach(r=>{const i=h?`${h} ${r}`:r;if(o.text(i),o.node().getBoundingClientRect().width>a){if(h&&x.push(h),h=r,o.text(r),o.node().getBoundingClientRect().width>a){let d="";for(const y of r)d+=y,o.text(d+"-"),o.node().getBoundingClientRect().width>a&&(x.push(d.slice(0,-1)+"-"),d=y);h=d}}else h=i}),h&&x.push(h),o.remove()}x.forEach((_,h)=>{const r={x:40,y:p+7+h*20,fill:"#666",text:_,textMargin:e.boxTextMargin??5},l=Q.drawText(t,r).node().getBoundingClientRect().width;l>D&&l>e.leftMargin-l&&(D=l)}),p+=Math.max(20,x.length*20)})}(0,s.e)(mt,"drawActorLegend");var V=(0,w.nV)().journey,F=0,Bt=(0,s.e)(function(t,e,a,p){const n=(0,w.nV)(),u=n.journey.titleColor,g=n.journey.titleFontSize,o=n.journey.titleFontFamily,m=n.securityLevel;let x;m==="sandbox"&&(x=(0,W.Ys)("#i"+e));const _=m==="sandbox"?(0,W.Ys)(x.nodes()[0].contentDocument.body):(0,W.Ys)("body");A.init();const h=_.select("#"+e);Q.initGraphics(h,e);const r=p.db.getTasks(),i=p.db.getDiagramTitle(),l=p.db.getActors();for(const j in O)delete O[j];let d=0;l.forEach(j=>{O[j]={color:V.actorColours[d%V.actorColours.length],position:d},d++}),mt(h),F=V.leftMargin+D,A.insert(0,0,F,Object.keys(O).length*50),Lt(h,r,0,e);const y=A.getBounds();i&&h.append("text").text(i).attr("x",F).attr("font-size",g).attr("font-weight","bold").attr("y",25).attr("fill",u).attr("font-family",o);const c=y.stopy-y.starty+2*V.diagramMarginY,M=F+y.stopx+2*V.diagramMarginX;(0,w.v2)(h,c,M,V.useMaxWidth),h.append("line").attr("x1",F).attr("y1",V.height*4).attr("x2",M-F-4).attr("y2",V.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#"+e+"-arrowhead)");const v=i?70:0;h.attr("viewBox",`${y.startx} -25 ${M} ${c+v}`),h.attr("preserveAspectRatio","xMinYMin meet"),h.attr("height",c+v+25)},"draw"),A={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:(0,s.e)(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:(0,s.e)(function(t,e,a,p){t[e]===void 0?t[e]=a:t[e]=p(a,t[e])},"updateVal"),updateBounds:(0,s.e)(function(t,e,a,p){const n=(0,w.nV)().journey,u=this;let g=0;function o(m){return(0,s.e)(function(_){g++;const h=u.sequenceItems.length-g+1;u.updateVal(_,"starty",e-h*n.boxMargin,Math.min),u.updateVal(_,"stopy",p+h*n.boxMargin,Math.max),u.updateVal(A.data,"startx",t-h*n.boxMargin,Math.min),u.updateVal(A.data,"stopx",a+h*n.boxMargin,Math.max),m!=="activation"&&(u.updateVal(_,"startx",t-h*n.boxMargin,Math.min),u.updateVal(_,"stopx",a+h*n.boxMargin,Math.max),u.updateVal(A.data,"starty",e-h*n.boxMargin,Math.min),u.updateVal(A.data,"stopy",p+h*n.boxMargin,Math.max))},"updateItemBounds")}(0,s.e)(o,"updateFn"),this.sequenceItems.forEach(o())},"updateBounds"),insert:(0,s.e)(function(t,e,a,p){const n=Math.min(t,a),u=Math.max(t,a),g=Math.min(e,p),o=Math.max(e,p);this.updateVal(A.data,"startx",n,Math.min),this.updateVal(A.data,"starty",g,Math.min),this.updateVal(A.data,"stopx",u,Math.max),this.updateVal(A.data,"stopy",o,Math.max),this.updateBounds(n,g,u,o)},"insert"),bumpVerticalPos:(0,s.e)(function(t){this.verticalPos=this.verticalPos+t,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:(0,s.e)(function(){return this.verticalPos},"getVerticalPos"),getBounds:(0,s.e)(function(){return this.data},"getBounds")},st=V.sectionFills,xt=V.sectionColours,Lt=(0,s.e)(function(t,e,a,p){const n=(0,w.nV)().journey;let u="";const g=n.height*2+n.diagramMarginY,o=a+g;let m=0,x="#CCC",_="black",h=0;for(const[r,i]of e.entries()){if(u!==i.section){x=st[m%st.length],h=m%st.length,_=xt[m%xt.length];let d=0;const y=i.section;for(let M=r;M<e.length&&e[M].section==y;M++)d=d+1;const c={x:r*n.taskMargin+r*n.width+F,y:50,text:i.section,fill:x,num:h,colour:_,taskCount:d};Q.drawSection(t,c,n),u=i.section,m++}const l=i.people.reduce((d,y)=>(O[y]&&(d[y]=O[y]),d),{});i.x=r*n.taskMargin+r*n.width+F,i.y=o,i.width=n.diagramMarginX,i.height=n.diagramMarginY,i.colour=_,i.fill=x,i.num=h,i.actors=l,Q.drawTask(t,i,n,p),A.insert(i.x,i.y,i.x+i.width+n.taskMargin,300+5*30)}},"drawTasks"),_t={setConf:Ot,draw:Bt},Ft={parser:nt,db:yt,renderer:_t,styles:Pt,init:(0,s.e)(t=>{_t.setConf(t.journey),yt.clear()},"init")}}}]);
