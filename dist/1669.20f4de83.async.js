"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[1669],{104797:function(It,et,D){D.d(et,{CP:function(){return P},Ck:function(){return lt},HT:function(){return V},PB:function(){return it},aC:function(){return o},lC:function(){return g},m:function(){return E},tk:function(){return j}});var st=D(767767),O=D(769120),W=D(234674),X=D(644892),j=(0,O.K)((A,y)=>{const v=A.append("rect");if(v.attr("x",y.x),v.attr("y",y.y),v.attr("fill",y.fill),v.attr("stroke",y.stroke),v.attr("width",y.width),v.attr("height",y.height),y.name&&v.attr("name",y.name),y.rx&&v.attr("rx",y.rx),y.ry&&v.attr("ry",y.ry),y.attrs!==void 0)for(const x in y.attrs)v.attr(x,y.attrs[x]);return y.class&&v.attr("class",y.class),v},"drawRect"),g=(0,O.K)((A,y)=>{const v={x:y.startx,y:y.starty,width:y.stopx-y.startx,height:y.stopy-y.starty,fill:y.fill,stroke:y.stroke,class:"rect"};j(A,v).lower()},"drawBackgroundRect"),E=(0,O.K)((A,y)=>{const v=y.text.replace(st.H1," "),x=A.append("text");x.attr("x",y.x),x.attr("y",y.y),x.attr("class","legend"),x.style("text-anchor",y.anchor),y.class&&x.attr("class",y.class);const R=x.append("tspan");return R.attr("x",y.x+y.textMargin*2),R.text(v),x},"drawText"),o=(0,O.K)((A,y,v,x)=>{const R=A.append("image");R.attr("x",y),R.attr("y",v);const rt=(0,W.J)(x);R.attr("xlink:href",rt)},"drawImage"),P=(0,O.K)((A,y,v,x)=>{const R=A.append("use");R.attr("x",y),R.attr("y",v);const rt=(0,W.J)(x);R.attr("xlink:href",`#${rt}`)},"drawEmbeddedImage"),it=(0,O.K)(()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),"getNoteRect"),V=(0,O.K)(()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0}),"getTextObj"),lt=(0,O.K)(()=>{let A=(0,X.Ltv)(".mermaidTooltip");return A.empty()&&(A=(0,X.Ltv)("body").append("div").attr("class","mermaidTooltip").style("opacity",0).style("position","absolute").style("text-align","center").style("max-width","200px").style("padding","2px").style("font-size","12px").style("background","#ffffde").style("border","1px solid #333").style("border-radius","2px").style("pointer-events","none").style("z-index","100")),A},"createTooltip")},341669:function(It,et,D){var nt;D.d(et,{Zk:function(){return lt},q7:function(){return Re},tM:function(){return Pe},u4:function(){return we}});var st=D(878988),O=D(428843),W=D(867822),X=D(104797),j=D(698981),g=D(767767),E=D(294654),o=D(769120),P=D(644892),it=D(927591),V=function(){var t=(0,o.K)(function(tt,l,d,n){for(d=d||{},n=tt.length;n--;d[tt[n]]=l);return d},"o"),e=[1,2],s=[1,3],a=[1,4],r=[2,4],h=[1,9],u=[1,11],S=[1,16],f=[1,17],m=[1,18],b=[1,19],C=[1,33],B=[1,20],w=[1,21],p=[1,22],Y=[1,23],U=[1,24],$=[1,26],H=[1,27],K=[1,28],z=[1,29],M=[1,30],ct=[1,31],mt=[1,32],Dt=[1,35],vt=[1,36],kt=[1,37],bt=[1,38],ht=[1,34],_=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],xt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],ae=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],$t={trace:(0,o.K)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:(0,o.K)(function(l,d,n,T,k,i,dt){var c=i.length-1;switch(k){case 3:return T.setRootDoc(i[c]),i[c];case 4:this.$=[];break;case 5:i[c]!="nl"&&(i[c-1].push(i[c]),this.$=i[c-1]);break;case 6:case 7:this.$=i[c];break;case 8:this.$="nl";break;case 12:this.$=i[c];break;case 13:const At=i[c-1];At.description=T.trimColon(i[c]),this.$=At;break;case 14:this.$={stmt:"relation",state1:i[c-2],state2:i[c]};break;case 15:const Lt=T.trimColon(i[c]);this.$={stmt:"relation",state1:i[c-3],state2:i[c-1],description:Lt};break;case 19:this.$={stmt:"state",id:i[c-3],type:"default",description:"",doc:i[c-1]};break;case 20:var J=i[c],Z=i[c-2].trim();if(i[c].match(":")){var _t=i[c].split(":");J=_t[0],Z=[Z,_t[1]]}this.$={stmt:"state",id:J,type:"default",description:Z};break;case 21:this.$={stmt:"state",id:i[c-3],type:"default",description:i[c-5],doc:i[c-1]};break;case 22:this.$={stmt:"state",id:i[c],type:"fork"};break;case 23:this.$={stmt:"state",id:i[c],type:"join"};break;case 24:this.$={stmt:"state",id:i[c],type:"choice"};break;case 25:this.$={stmt:"state",id:T.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[c-1].trim(),note:{position:i[c-2].trim(),text:i[c].trim()}};break;case 29:this.$=i[c].trim(),T.setAccTitle(this.$);break;case 30:case 31:this.$=i[c].trim(),T.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[c-3],url:i[c-2],tooltip:i[c-1]};break;case 33:this.$={stmt:"click",id:i[c-3],url:i[c-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[c-1].trim(),classes:i[c].trim()};break;case 36:this.$={stmt:"style",id:i[c-1].trim(),styleClass:i[c].trim()};break;case 37:this.$={stmt:"applyClass",id:i[c-1].trim(),styleClass:i[c].trim()};break;case 38:T.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:T.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:T.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:T.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[c].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[c-2].trim(),classes:[i[c].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[c-2].trim(),classes:[i[c].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:a},{1:[3]},{3:5,4:e,5:s,6:a},{3:6,4:e,5:s,6:a},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],r,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:h,5:u,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:m,22:b,24:C,25:B,26:w,27:p,28:Y,29:U,32:25,33:$,35:H,37:K,38:z,41:M,45:ct,48:mt,51:Dt,52:vt,53:kt,54:bt,57:ht},t(_,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:f,19:m,22:b,24:C,25:B,26:w,27:p,28:Y,29:U,32:25,33:$,35:H,37:K,38:z,41:M,45:ct,48:mt,51:Dt,52:vt,53:kt,54:bt,57:ht},t(_,[2,7]),t(_,[2,8]),t(_,[2,9]),t(_,[2,10]),t(_,[2,11]),t(_,[2,12],{14:[1,40],15:[1,41]}),t(_,[2,16]),{18:[1,42]},t(_,[2,18],{20:[1,43]}),{23:[1,44]},t(_,[2,22]),t(_,[2,23]),t(_,[2,24]),t(_,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(_,[2,28]),{34:[1,49]},{36:[1,50]},t(_,[2,31]),{13:51,24:C,57:ht},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(xt,[2,44],{58:[1,56]}),t(xt,[2,45],{58:[1,57]}),t(_,[2,38]),t(_,[2,39]),t(_,[2,40]),t(_,[2,41]),t(_,[2,6]),t(_,[2,13]),{13:58,24:C,57:ht},t(_,[2,17]),t(ae,r,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(_,[2,29]),t(_,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(_,[2,14],{14:[1,71]}),{4:h,5:u,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:m,21:[1,72],22:b,24:C,25:B,26:w,27:p,28:Y,29:U,32:25,33:$,35:H,37:K,38:z,41:M,45:ct,48:mt,51:Dt,52:vt,53:kt,54:bt,57:ht},t(_,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(_,[2,34]),t(_,[2,35]),t(_,[2,36]),t(_,[2,37]),t(xt,[2,46]),t(xt,[2,47]),t(_,[2,15]),t(_,[2,19]),t(ae,r,{7:78}),t(_,[2,26]),t(_,[2,27]),{5:[1,79]},{5:[1,80]},{4:h,5:u,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:m,21:[1,81],22:b,24:C,25:B,26:w,27:p,28:Y,29:U,32:25,33:$,35:H,37:K,38:z,41:M,45:ct,48:mt,51:Dt,52:vt,53:kt,54:bt,57:ht},t(_,[2,32]),t(_,[2,33]),t(_,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:(0,o.K)(function(l,d){if(d.recoverable)this.trace(l);else{var n=new Error(l);throw n.hash=d,n}},"parseError"),parse:(0,o.K)(function(l){var d=this,n=[0],T=[],k=[null],i=[],dt=this.table,c="",J=0,Z=0,_t=0,At=2,Lt=1,Ke=i.slice.call(arguments,1),L=Object.create(this.lexer),at={yy:{}};for(var Kt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Kt)&&(at.yy[Kt]=this.yy[Kt]);L.setInput(l,at.yy),at.yy.lexer=L,at.yy.parser=this,typeof L.yylloc>"u"&&(L.yylloc={});var Bt=L.yylloc;i.push(Bt);var Be=L.options&&L.options.ranges;typeof at.yy.parseError=="function"?this.parseError=at.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Ye(F){n.length=n.length-2*F,k.length=k.length-F,i.length=i.length-F}(0,o.K)(Ye,"popStack");function oe(){var F;return F=T.pop()||L.lex()||Lt,typeof F!="number"&&(F instanceof Array&&(T=F,F=T.pop()),F=d.symbols_[F]||F),F}(0,o.K)(oe,"lex");for(var N,Yt,ot,G,Me,Mt,ut={},Rt,Q,le,Ot;;){if(ot=n[n.length-1],this.defaultActions[ot]?G=this.defaultActions[ot]:((N===null||typeof N>"u")&&(N=oe()),G=dt[ot]&&dt[ot][N]),typeof G>"u"||!G.length||!G[0]){var Ft="";Ot=[];for(Rt in dt[ot])this.terminals_[Rt]&&Rt>At&&Ot.push("'"+this.terminals_[Rt]+"'");L.showPosition?Ft="Parse error on line "+(J+1)+`:
`+L.showPosition()+`
Expecting `+Ot.join(", ")+", got '"+(this.terminals_[N]||N)+"'":Ft="Parse error on line "+(J+1)+": Unexpected "+(N==Lt?"end of input":"'"+(this.terminals_[N]||N)+"'"),this.parseError(Ft,{text:L.match,token:this.terminals_[N]||N,line:L.yylineno,loc:Bt,expected:Ot})}if(G[0]instanceof Array&&G.length>1)throw new Error("Parse Error: multiple actions possible at state: "+ot+", token: "+N);switch(G[0]){case 1:n.push(N),k.push(L.yytext),i.push(L.yylloc),n.push(G[1]),N=null,Yt?(N=Yt,Yt=null):(Z=L.yyleng,c=L.yytext,J=L.yylineno,Bt=L.yylloc,_t>0&&_t--);break;case 2:if(Q=this.productions_[G[1]][1],ut.$=k[k.length-Q],ut._$={first_line:i[i.length-(Q||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(Q||1)].first_column,last_column:i[i.length-1].last_column},Be&&(ut._$.range=[i[i.length-(Q||1)].range[0],i[i.length-1].range[1]]),Mt=this.performAction.apply(ut,[c,Z,J,at.yy,G[1],k,i].concat(Ke)),typeof Mt<"u")return Mt;Q&&(n=n.slice(0,-1*Q*2),k=k.slice(0,-1*Q),i=i.slice(0,-1*Q)),n.push(this.productions_[G[1]][0]),k.push(ut.$),i.push(ut._$),le=dt[n[n.length-2]][n[n.length-1]],n.push(le);break;case 3:return!0}}return!0},"parse")},$e=function(){var tt={EOF:1,parseError:(0,o.K)(function(d,n){if(this.yy.parser)this.yy.parser.parseError(d,n);else throw new Error(d)},"parseError"),setInput:(0,o.K)(function(l,d){return this.yy=d||this.yy||{},this._input=l,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,o.K)(function(){var l=this._input[0];this.yytext+=l,this.yyleng++,this.offset++,this.match+=l,this.matched+=l;var d=l.match(/(?:\r\n?|\n).*/g);return d?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),l},"input"),unput:(0,o.K)(function(l){var d=l.length,n=l.split(/(?:\r\n?|\n)/g);this._input=l+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-d),this.offset-=d;var T=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var k=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===T.length?this.yylloc.first_column:0)+T[T.length-n.length].length-n[0].length:this.yylloc.first_column-d},this.options.ranges&&(this.yylloc.range=[k[0],k[0]+this.yyleng-d]),this.yyleng=this.yytext.length,this},"unput"),more:(0,o.K)(function(){return this._more=!0,this},"more"),reject:(0,o.K)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,o.K)(function(l){this.unput(this.match.slice(l))},"less"),pastInput:(0,o.K)(function(){var l=this.matched.substr(0,this.matched.length-this.match.length);return(l.length>20?"...":"")+l.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,o.K)(function(){var l=this.match;return l.length<20&&(l+=this._input.substr(0,20-l.length)),(l.substr(0,20)+(l.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,o.K)(function(){var l=this.pastInput(),d=new Array(l.length+1).join("-");return l+this.upcomingInput()+`
`+d+"^"},"showPosition"),test_match:(0,o.K)(function(l,d){var n,T,k;if(this.options.backtrack_lexer&&(k={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(k.yylloc.range=this.yylloc.range.slice(0))),T=l[0].match(/(?:\r\n?|\n).*/g),T&&(this.yylineno+=T.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:T?T[T.length-1].length-T[T.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+l[0].length},this.yytext+=l[0],this.match+=l[0],this.matches=l,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(l[0].length),this.matched+=l[0],n=this.performAction.call(this,this.yy,this,d,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),n)return n;if(this._backtrack){for(var i in k)this[i]=k[i];return!1}return!1},"test_match"),next:(0,o.K)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var l,d,n,T;this._more||(this.yytext="",this.match="");for(var k=this._currentRules(),i=0;i<k.length;i++)if(n=this._input.match(this.rules[k[i]]),n&&(!d||n[0].length>d[0].length)){if(d=n,T=i,this.options.backtrack_lexer){if(l=this.test_match(n,k[i]),l!==!1)return l;if(this._backtrack){d=!1;continue}else return!1}else if(!this.options.flex)break}return d?(l=this.test_match(d,k[T]),l!==!1?l:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,o.K)(function(){var d=this.next();return d||this.lex()},"lex"),begin:(0,o.K)(function(d){this.conditionStack.push(d)},"begin"),popState:(0,o.K)(function(){var d=this.conditionStack.length-1;return d>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,o.K)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,o.K)(function(d){return d=this.conditionStack.length-1-Math.abs(d||0),d>=0?this.conditionStack[d]:"INITIAL"},"topState"),pushState:(0,o.K)(function(d){this.begin(d)},"pushState"),stateStackSize:(0,o.K)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,o.K)(function(d,n,T,k){function i(){const c=n.yytext.indexOf("%%");if(c===0)return!1;if(c>0){const J=n.yytext.slice(0,c),Z=n.yytext.slice(c);Z&&d.lexer.unput(Z),n.yytext=J}return!0}(0,o.K)(i,"processId");var dt=k;switch(T){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;case 17:return this.popState(),"acc_title_value";case 18:return this.begin("acc_descr"),35;case 19:return this.popState(),"acc_descr_value";case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 25:return this.popState(),this.pushState("CLASSDEFID"),42;case 26:return this.popState(),43;case 27:return this.pushState("CLASS"),48;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;case 29:return this.popState(),50;case 30:return this.pushState("STYLE"),45;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 32:return this.popState(),47;case 33:return this.pushState("SCALE"),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";case 49:return i()?(this.popState(),"ID"):void 0;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:throw new Error('Error: State name must be a single word. Found: "'+n.yytext.trim()+'"');case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState("struct"),20;case 56:return this.popState(),21;case 57:break;case 58:return this.begin("NOTE"),29;case 59:return this.popState(),this.pushState("NOTE_ID"),59;case 60:return this.popState(),this.pushState("NOTE_ID"),60;case 61:this.popState(),this.pushState("FLOATING_NOTE");break;case 62:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 63:break;case 64:return"NOTE_TEXT";case 65:return i()?(this.popState(),"ID"):void 0;case 66:return i()?(this.popState(),this.pushState("NOTE_TEXT"),24):void 0;case 67:return this.popState(),n.yytext=n.yytext.substr(2).trim(),31;case 68:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),31;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:return i()?24:void 0;case 74:return n.yytext=n.yytext.trim(),14;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}};return tt}();$t.lexer=$e;function Ct(){this.yy={}}return(0,o.K)(Ct,"Parser"),Ct.prototype=$t,$t.Parser=Ct,new Ct}();V.parser=V;var lt=V,A="TB",y="TB",v="dir",x="state",R="root",rt="relation",ce="classDef",he="style",de="applyClass",ft="default",Gt="divider",Vt="fill:none",Ut="fill: #333",Wt="c",jt="markdown",Ht="normal",wt="rect",Nt="rectWithTitle",ue="stateStart",fe="stateEnd",zt="divider",Xt="roundedWithTitle",pe="note",ye="noteGroup",pt="statediagram",Se="state",_e=`${pt}-${Se}`,Jt="transition",ge="note",Ee="note-edge",Te=`${Jt} ${Ee}`,me=`${pt}-${ge}`,De="cluster",ve=`${pt}-${De}`,ke="cluster-alt",be=`${pt}-${ke}`,Zt="parent",Qt="note",xe="state",Pt="----",Ce=`${Pt}${Qt}`,qt=`${Pt}${Zt}`,te=(0,o.K)((t,e=y)=>{if(!t.doc)return e;let s=e;for(const a of t.doc)a.stmt==="dir"&&(s=a.value);return s},"getDir"),Ae=(0,o.K)(function(t,e){return e.db.getClasses()},"getClasses"),Le=(0,o.K)(async function(t,e,s,a){E.R.info("REF0:"),E.R.info("Drawing state diagram (v2)",e);const{securityLevel:r,state:h,layout:u}=(0,g.D7)();a.db.extract(a.db.getRootDocV2());const S=a.db.getData(),f=(0,st.A)(e,r);S.type=a.type,S.layoutAlgorithm=u,S.nodeSpacing=h?.nodeSpacing||50,S.rankSpacing=h?.rankSpacing||50,(0,g.D7)().look==="neo"?S.markers=["barbNeo"]:S.markers=["barb"],S.diagramId=e,await(0,W.XX)(S,f);const b=8;try{(typeof a.db.getLinks=="function"?a.db.getLinks():new Map).forEach((B,w)=>{const p=typeof w=="string"?w:typeof w?.id=="string"?w.id:"",Y=S.nodes.find(M=>M.id===p);if(!p){E.R.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(w));return}const U=f.node()?.querySelectorAll("g.node, g.rough-node");let $;if(U?.forEach(M=>{const ct=M.textContent?.trim();(M.id===Y?.domId||ct===p)&&($=M)}),!$){E.R.warn("\u26A0\uFE0F Could not find node matching text:",p);return}const H=$.parentNode;if(!H){E.R.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",p);return}const K=document.createElementNS("http://www.w3.org/2000/svg","a"),z=B.url.replace(/^"+|"+$/g,"");if(K.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",z),K.setAttribute("target","_blank"),B.tooltip){const M=B.tooltip.replace(/^"+|"+$/g,"");K.setAttribute("title",M),$.setAttribute("title",M)}H.replaceChild(K,$),K.appendChild($),E.R.info("\u{1F517} Wrapped node in <a> tag for:",p,B.url)})}catch(C){E.R.error("\u274C Error injecting clickable links:",C)}j._K.insertTitle(f,"statediagramTitleText",h?.titleTopMargin??25,a.db.getDiagramTitle()),(0,O.P)(f,b,pt,h?.useMaxWidth??!0)},"draw"),Re={getClasses:Ae,draw:Le,getDir:te},gt=new Map,q=0;function Et(t="",e=0,s="",a=Pt){const r=s!==null&&s.length>0?`${a}${s}`:"";return`${xe}-${t}${r}-${e}`}(0,o.K)(Et,"stateDomId");var Oe=(0,o.K)((t,e,s,a,r,h,u,S)=>{E.R.trace("items",e),e.forEach(f=>{switch(f.stmt){case x:St(t,f,s,a,r,h,u,S);break;case ft:St(t,f,s,a,r,h,u,S);break;case rt:{St(t,f.state1,s,a,r,h,u,S),St(t,f.state2,s,a,r,h,u,S);const m=u==="neo",b={id:"edge"+q,start:f.state1.id,end:f.state2.id,arrowhead:"normal",arrowTypeEnd:m?"arrow_barb_neo":"arrow_barb",style:Vt,labelStyle:"",label:g.Y2.sanitizeText(f.description??"",(0,g.D7)()),arrowheadStyle:Ut,labelpos:Wt,labelType:jt,thickness:Ht,classes:Jt,look:u};r.push(b),q++}break}})},"setupDoc"),ee=(0,o.K)((t,e=y)=>{let s=e;if(t.doc)for(const a of t.doc)a.stmt==="dir"&&(s=a.value);return s},"getDir");function yt(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(r=>{const h=s.get(r);h&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...h.styles])}));const a=t.find(r=>r.id===e.id);a?Object.assign(a,e):t.push(e)}(0,o.K)(yt,"insertOrUpdateNode");function se(t){return t?.classes?.join(" ")??""}(0,o.K)(se,"getClassesFromDbInfo");function ie(t){return t?.styles??[]}(0,o.K)(ie,"getStylesFromDbInfo");var St=(0,o.K)((t,e,s,a,r,h,u,S)=>{const f=e.id,m=s.get(f),b=se(m),C=ie(m),B=(0,g.D7)();if(E.R.info("dataFetcher parsedItem",e,m,C),f!=="root"){let w=wt;e.start===!0?w=ue:e.start===!1&&(w=fe),e.type!==ft&&(w=e.type),gt.get(f)||gt.set(f,{id:f,shape:w,description:g.Y2.sanitizeText(f,B),cssClasses:`${b} ${_e}`,cssStyles:C});const p=gt.get(f);e.description&&(Array.isArray(p.description)?(p.shape=Nt,p.description.push(e.description)):p.description?.length&&p.description.length>0?(p.shape=Nt,p.description===f?p.description=[e.description]:p.description=[p.description,e.description]):(p.shape=wt,p.description=e.description),p.description=g.Y2.sanitizeTextOrArray(p.description,B)),p.description?.length===1&&p.shape===Nt&&(p.type==="group"?p.shape=Xt:p.shape=wt),!p.type&&e.doc&&(E.R.info("Setting cluster for XCX",f,ee(e)),p.type="group",p.isGroup=!0,p.dir=ee(e),p.shape=e.type===Gt?zt:Xt,p.cssClasses=`${p.cssClasses} ${ve} ${h?be:""}`);const Y={labelStyle:"",shape:p.shape,label:p.description,cssClasses:p.cssClasses,cssCompiledStyles:[],cssStyles:p.cssStyles,id:f,dir:p.dir,domId:Et(f,q),type:p.type,isGroup:p.type==="group",padding:8,rx:10,ry:10,look:u,labelType:"markdown"};if(Y.shape===zt&&(Y.label=""),t&&t.id!=="root"&&(E.R.trace("Setting node ",f," to be child of its parent ",t.id),Y.parentId=t.id),Y.centerLabel=!0,e.note){const U={labelStyle:"",shape:pe,label:e.note.text,labelType:"markdown",cssClasses:me,cssStyles:[],cssCompiledStyles:[],id:f+Ce+"-"+q,domId:Et(f,q,Qt),type:p.type,isGroup:p.type==="group",padding:B.flowchart?.padding,look:u,position:e.note.position},$=f+qt,H={labelStyle:"",shape:ye,label:e.note.text,cssClasses:p.cssClasses,cssStyles:[],id:f+qt,domId:Et(f,q,Zt),type:"group",isGroup:!0,padding:16,look:u,position:e.note.position};q++,H.id=$,U.parentId=$,yt(a,H,S),yt(a,U,S),yt(a,Y,S);let K=f,z=U.id;e.note.position==="left of"&&(K=U.id,z=f),r.push({id:K+"-"+z,start:K,end:z,arrowhead:"none",arrowTypeEnd:"",style:Vt,labelStyle:"",classes:Te,arrowheadStyle:Ut,labelpos:Wt,labelType:jt,thickness:Ht,look:u})}else yt(a,Y,S)}e.doc&&(E.R.trace("Adding nodes children "),Oe(e,e.doc,s,a,r,!h,u,S))},"dataFetcher"),Ie=(0,o.K)(()=>{gt.clear(),q=0},"reset"),I={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},re=(0,o.K)(()=>new Map,"newClassesList"),ne=(0,o.K)(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),Tt=(0,o.K)(t=>JSON.parse(JSON.stringify(t)),"clone"),we=(nt=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=re(),this.documents={root:ne()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=g.iN,this.setAccTitle=g.SV,this.getAccDescription=g.m7,this.setAccDescription=g.EI,this.setDiagramTitle=g.ke,this.getDiagramTitle=g.ab,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}extract(e){this.clear(!0);for(const r of Array.isArray(e)?e:e.doc)switch(r.stmt){case x:this.addState(r.id.trim(),r.type,r.doc,r.description,r.note);break;case rt:this.addRelation(r.state1,r.state2,r.description);break;case ce:this.addStyleClass(r.id.trim(),r.classes);break;case he:this.handleStyleDef(r);break;case de:this.setCssClass(r.id.trim(),r.styleClass);break;case"click":this.addLink(r.id,r.url,r.tooltip);break}const s=this.getStates(),a=(0,g.D7)();Ie(),St(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,a.look,this.classes);for(const r of this.nodes)if(Array.isArray(r.label)){if(r.description=r.label.slice(1),r.isGroup&&r.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${r.id}]`);r.label=r.label[0]}}handleStyleDef(e){const s=e.id.trim().split(","),a=e.styleClass.split(",");for(const r of s){let h=this.getState(r);if(!h){const u=r.trim();this.addState(u),h=this.getState(u)}h&&(h.styles=a.map(u=>u.replace(/;/g,"")?.trim()))}}setRootDoc(e){E.R.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,a){if(s.stmt===rt){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===x&&(s.id===I.START_NODE?(s.id=e.id+(a?"_start":"_end"),s.start=a):s.id=s.id.trim()),s.stmt!==R&&s.stmt!==x||!s.doc)return;const r=[];let h=[];for(const u of s.doc)if(u.type===Gt){const S=Tt(u);S.doc=Tt(h),r.push(S),h=[]}else h.push(u);if(r.length>0&&h.length>0){const u={stmt:x,id:(0,j.$C)(),type:"divider",doc:Tt(h)};r.push(Tt(u)),s.doc=r}s.doc.forEach(u=>this.docTranslator(s,u,!0))}getRootDocV2(){return this.docTranslator({id:R,stmt:R},{id:R,stmt:R,doc:this.rootDoc},!0),{id:R,doc:this.rootDoc}}addState(e,s=ft,a=void 0,r=void 0,h=void 0,u=void 0,S=void 0,f=void 0){const m=e?.trim();if(!this.currentDocument.states.has(m))E.R.info("Adding state ",m,r),this.currentDocument.states.set(m,{stmt:x,id:m,descriptions:[],type:s,doc:a,note:h,classes:[],styles:[],textStyles:[]});else{const b=this.currentDocument.states.get(m);if(!b)throw new Error(`State not found: ${m}`);b.doc||(b.doc=a),b.type||(b.type=s)}if(r&&(E.R.info("Setting state description",m,r),(Array.isArray(r)?r:[r]).forEach(C=>this.addDescription(m,C.trim()))),h){const b=this.currentDocument.states.get(m);if(!b)throw new Error(`State not found: ${m}`);b.note=h,b.note.text=g.Y2.sanitizeText(b.note.text,(0,g.D7)())}u&&(E.R.info("Setting state classes",m,u),(Array.isArray(u)?u:[u]).forEach(C=>this.setCssClass(m,C.trim()))),S&&(E.R.info("Setting state styles",m,S),(Array.isArray(S)?S:[S]).forEach(C=>this.setStyle(m,C.trim()))),f&&(E.R.info("Setting state styles",m,S),(Array.isArray(f)?f:[f]).forEach(C=>this.setTextStyle(m,C.trim())))}clear(e){this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:ne()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=re(),e||(this.links=new Map,(0,g.IU)())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){E.R.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,a){this.links.set(e,{url:s,tooltip:a}),E.R.warn("Adding link",e,s,a)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===I.START_NODE?(this.startEndCount++,`${I.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=ft){return e===I.START_NODE?I.START_TYPE:s}endIdIfNeeded(e=""){return e===I.END_NODE?(this.startEndCount++,`${I.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=ft){return e===I.END_NODE?I.END_TYPE:s}addRelationObjs(e,s,a=""){const r=this.startIdIfNeeded(e.id.trim()),h=this.startTypeIfNeeded(e.id.trim(),e.type),u=this.startIdIfNeeded(s.id.trim()),S=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(r,h,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(u,S,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:r,id2:u,relationTitle:g.Y2.sanitizeText(a,(0,g.D7)())})}addRelation(e,s,a){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,a);else if(typeof e=="string"&&typeof s=="string"){const r=this.startIdIfNeeded(e.trim()),h=this.startTypeIfNeeded(e),u=this.endIdIfNeeded(s.trim()),S=this.endTypeIfNeeded(s);this.addState(r,h),this.addState(u,S),this.currentDocument.relations.push({id1:r,id2:u,relationTitle:a?g.Y2.sanitizeText(a,(0,g.D7)()):void 0})}}addDescription(e,s){const a=this.currentDocument.states.get(e),r=s.startsWith(":")?s.replace(":","").trim():s;a?.descriptions?.push(g.Y2.sanitizeText(r,(0,g.D7)()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});const a=this.classes.get(e);s&&a&&s.split(I.STYLECLASS_SEP).forEach(r=>{const h=r.replace(/([^;]*);/,"$1").trim();if(RegExp(I.COLOR_KEYWORD).exec(r)){const S=h.replace(I.FILL_KEYWORD,I.BG_FILL).replace(I.COLOR_KEYWORD,I.FILL_KEYWORD);a.textStyles.push(S)}a.styles.push(h)})}getClasses(){return this.classes}setupToolTips(e){const s=(0,X.Ck)();(0,P.Ltv)(e).select("svg").selectAll("g.node, g.rough-node").on("mouseover",h=>{const u=(0,P.Ltv)(h.currentTarget),S=u.attr("title");if(S===null)return;const f=h.currentTarget?.getBoundingClientRect();s.transition().duration(200).style("opacity",".9"),s.style("left",window.scrollX+f.left+(f.right-f.left)/2+"px").style("top",window.scrollY+f.bottom+"px"),s.html(it.default.sanitize(S)),u.classed("hover",!0)}).on("mouseout",h=>{s.transition().duration(500).style("opacity",0),(0,P.Ltv)(h.currentTarget).classed("hover",!1)})}setCssClass(e,s){e.split(",").forEach(a=>{let r=this.getState(a);if(!r){const h=a.trim();this.addState(h),r=this.getState(h)}r?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}bindFunctions(e){this.funs.forEach(s=>{s(e)})}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===v)}getDirection(){return this.getDirectionStatement()?.value??A}setDirection(e){const s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:v,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){const e=(0,g.D7)();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:te(this.getRootDocV2())}}getConfig(){return(0,g.D7)().state}},(0,o.K)(nt,"StateDB"),nt.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},nt),Ne=(0,o.K)(t=>`
defs [id$="-barbEnd"] {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: ${t.strokeWidth||1};
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: ${t.strokeWidth||1}px;
}
[id$="-barbEnd"] {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${t.mainBkg};
  stroke: ${t.useGradient?"url("+t.svgId+"-gradient)":t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${t.radius}px;
  ry: ${t.radius}px;
  filter: ${t.dropShadow?t.dropShadow.replace("url(#drop-shadow)",`url(${t.svgId}-drop-shadow)`):"none"}
}
`,"getStyles"),Pe=Ne},428843:function(It,et,D){D.d(et,{P:function(){return X}});var st=D(767767),O=D(294654),W=D(769120),X=(0,W.K)((E,o,P,it)=>{E.attr("class",P);const{width:V,height:lt,x:A,y}=j(E,o);(0,st.a$)(E,lt,V,it);const v=g(A,y,V,lt,o);E.attr("viewBox",v),O.R.debug(`viewBox configured: ${v} with padding: ${o}`)},"setupViewPortForSVG"),j=(0,W.K)((E,o)=>{const P=E.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:P.width+o*2,height:P.height+o*2,x:P.x,y:P.y}},"calculateDimensionsWithPadding"),g=(0,W.K)((E,o,P,it,V)=>`${E-V} ${o-V} ${P} ${it}`,"createViewBox")},878988:function(It,et,D){D.d(et,{A:function(){return W}});var st=D(769120),O=D(644892),W=(0,st.K)((X,j)=>{let g;return j==="sandbox"&&(g=(0,O.Ltv)("#i"+X)),(j==="sandbox"?(0,O.Ltv)(g.nodes()[0].contentDocument.body):(0,O.Ltv)("body")).select(`[id="${X}"]`)},"getDiagramElement")}}]);
