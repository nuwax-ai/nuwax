"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[2943],{34172:function(Pt,st,D){D.d(st,{j:function(){return it}});var rt=D(33263),P=D(78719),it=(0,P.eW)((i,L,W,at)=>{i.attr("class",W);const{width:V,height:nt,x:U,y:j}=z(i,L);(0,rt.v2)(i,nt,V,at);const Q=g(U,j,V,nt,L);i.attr("viewBox",Q),P.cM.debug(`viewBox configured: ${Q} with padding: ${L}`)},"setupViewPortForSVG"),z=(0,P.eW)((i,L)=>{const W=i.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:W.width+L*2,height:W.height+L*2,x:W.x,y:W.y}},"calculateDimensionsWithPadding"),g=(0,P.eW)((i,L,W,at,V)=>`${i-V} ${L-V} ${W} ${at}`,"createViewBox")},254:function(Pt,st,D){D.d(st,{q:function(){return it}});var rt=D(78719),P=D(61134),it=(0,rt.eW)((z,g)=>{let i;return g==="sandbox"&&(i=(0,P.Ys)("#i"+z)),(g==="sandbox"?(0,P.Ys)(i.nodes()[0].contentDocument.body):(0,P.Ys)("body")).select(`[id="${z}"]`)},"getDiagramElement")},2943:function(Pt,st,D){var J;D.d(st,{Ee:function(){return Oe},J8:function(){return W},_$:function(){return Ce},oI:function(){return Le}});var rt=D(254),P=D(34172),it=D(805),z=D(52904),g=D(33263),i=D(78719),L=function(){var t=(0,i.eW)(function(K,c,h,n){for(h=h||{},n=K.length;n--;h[K[n]]=c);return h},"o"),e=[1,2],s=[1,3],o=[1,4],a=[2,4],d=[1,9],f=[1,11],p=[1,16],S=[1,17],E=[1,18],b=[1,19],k=[1,33],I=[1,20],C=[1,21],u=[1,22],O=[1,23],A=[1,24],B=[1,26],R=[1,27],M=[1,28],w=[1,29],ut=[1,30],yt=[1,31],_t=[1,32],gt=[1,35],Et=[1,36],Tt=[1,37],bt=[1,38],q=[1,34],y=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],kt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],se=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Ot={trace:(0,i.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:(0,i.eW)(function(c,h,n,_,T,r,tt){var l=r.length-1;switch(T){case 3:return _.setRootDoc(r[l]),r[l];break;case 4:this.$=[];break;case 5:r[l]!="nl"&&(r[l-1].push(r[l]),this.$=r[l-1]);break;case 6:case 7:this.$=r[l];break;case 8:this.$="nl";break;case 12:this.$=r[l];break;case 13:const Dt=r[l-1];Dt.description=_.trimColon(r[l]),this.$=Dt;break;case 14:this.$={stmt:"relation",state1:r[l-2],state2:r[l]};break;case 15:const vt=_.trimColon(r[l]);this.$={stmt:"relation",state1:r[l-3],state2:r[l-1],description:vt};break;case 19:this.$={stmt:"state",id:r[l-3],type:"default",description:"",doc:r[l-1]};break;case 20:var Y=r[l],F=r[l-2].trim();if(r[l].match(":")){var dt=r[l].split(":");Y=dt[0],F=[F,dt[1]]}this.$={stmt:"state",id:Y,type:"default",description:F};break;case 21:this.$={stmt:"state",id:r[l-3],type:"default",description:r[l-5],doc:r[l-1]};break;case 22:this.$={stmt:"state",id:r[l],type:"fork"};break;case 23:this.$={stmt:"state",id:r[l],type:"join"};break;case 24:this.$={stmt:"state",id:r[l],type:"choice"};break;case 25:this.$={stmt:"state",id:_.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:r[l-1].trim(),note:{position:r[l-2].trim(),text:r[l].trim()}};break;case 29:this.$=r[l].trim(),_.setAccTitle(this.$);break;case 30:case 31:this.$=r[l].trim(),_.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:r[l-3],url:r[l-2],tooltip:r[l-1]};break;case 33:this.$={stmt:"click",id:r[l-3],url:r[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:r[l-1].trim(),classes:r[l].trim()};break;case 36:this.$={stmt:"style",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 37:this.$={stmt:"applyClass",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 38:_.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:_.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:_.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:_.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:r[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:o},{1:[3]},{3:5,4:e,5:s,6:o},{3:6,4:e,5:s,6:o},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],a,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:p,17:S,19:E,22:b,24:k,25:I,26:C,27:u,28:O,29:A,32:25,33:B,35:R,37:M,38:w,41:ut,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:q},t(y,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:p,17:S,19:E,22:b,24:k,25:I,26:C,27:u,28:O,29:A,32:25,33:B,35:R,37:M,38:w,41:ut,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:q},t(y,[2,7]),t(y,[2,8]),t(y,[2,9]),t(y,[2,10]),t(y,[2,11]),t(y,[2,12],{14:[1,40],15:[1,41]}),t(y,[2,16]),{18:[1,42]},t(y,[2,18],{20:[1,43]}),{23:[1,44]},t(y,[2,22]),t(y,[2,23]),t(y,[2,24]),t(y,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(y,[2,28]),{34:[1,49]},{36:[1,50]},t(y,[2,31]),{13:51,24:k,57:q},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(kt,[2,44],{58:[1,56]}),t(kt,[2,45],{58:[1,57]}),t(y,[2,38]),t(y,[2,39]),t(y,[2,40]),t(y,[2,41]),t(y,[2,6]),t(y,[2,13]),{13:58,24:k,57:q},t(y,[2,17]),t(se,a,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(y,[2,29]),t(y,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(y,[2,14],{14:[1,71]}),{4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:p,17:S,19:E,21:[1,72],22:b,24:k,25:I,26:C,27:u,28:O,29:A,32:25,33:B,35:R,37:M,38:w,41:ut,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:q},t(y,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(y,[2,34]),t(y,[2,35]),t(y,[2,36]),t(y,[2,37]),t(kt,[2,46]),t(kt,[2,47]),t(y,[2,15]),t(y,[2,19]),t(se,a,{7:78}),t(y,[2,26]),t(y,[2,27]),{5:[1,79]},{5:[1,80]},{4:d,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:p,17:S,19:E,21:[1,81],22:b,24:k,25:I,26:C,27:u,28:O,29:A,32:25,33:B,35:R,37:M,38:w,41:ut,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:q},t(y,[2,32]),t(y,[2,33]),t(y,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:(0,i.eW)(function(c,h){if(h.recoverable)this.trace(c);else{var n=new Error(c);throw n.hash=h,n}},"parseError"),parse:(0,i.eW)(function(c){var h=this,n=[0],_=[],T=[null],r=[],tt=this.table,l="",Y=0,F=0,dt=0,Dt=2,vt=1,we=r.slice.call(arguments,1),m=Object.create(this.lexer),X={yy:{}};for(var Rt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Rt)&&(X.yy[Rt]=this.yy[Rt]);m.setInput(c,X.yy),X.yy.lexer=m,X.yy.parser=this,typeof m.yylloc>"u"&&(m.yylloc={});var wt=m.yylloc;r.push(wt);var Ne=m.options&&m.options.ranges;typeof X.yy.parseError=="function"?this.parseError=X.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function $e(N){n.length=n.length-2*N,T.length=T.length-N,r.length=r.length-N}(0,i.eW)($e,"popStack");function re(){var N;return N=_.pop()||m.lex()||vt,typeof N!="number"&&(N instanceof Array&&(_=N,N=_.pop()),N=h.symbols_[N]||N),N}(0,i.eW)(re,"lex");for(var x,Nt,Z,$,We,$t,et={},Ct,G,ie,At;;){if(Z=n[n.length-1],this.defaultActions[Z]?$=this.defaultActions[Z]:((x===null||typeof x>"u")&&(x=re()),$=tt[Z]&&tt[Z][x]),typeof $>"u"||!$.length||!$[0]){var Wt="";At=[];for(Ct in tt[Z])this.terminals_[Ct]&&Ct>Dt&&At.push("'"+this.terminals_[Ct]+"'");m.showPosition?Wt="Parse error on line "+(Y+1)+`:
`+m.showPosition()+`
Expecting `+At.join(", ")+", got '"+(this.terminals_[x]||x)+"'":Wt="Parse error on line "+(Y+1)+": Unexpected "+(x==vt?"end of input":"'"+(this.terminals_[x]||x)+"'"),this.parseError(Wt,{text:m.match,token:this.terminals_[x]||x,line:m.yylineno,loc:wt,expected:At})}if($[0]instanceof Array&&$.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Z+", token: "+x);switch($[0]){case 1:n.push(x),T.push(m.yytext),r.push(m.yylloc),n.push($[1]),x=null,Nt?(x=Nt,Nt=null):(F=m.yyleng,l=m.yytext,Y=m.yylineno,wt=m.yylloc,dt>0&&dt--);break;case 2:if(G=this.productions_[$[1]][1],et.$=T[T.length-G],et._$={first_line:r[r.length-(G||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(G||1)].first_column,last_column:r[r.length-1].last_column},Ne&&(et._$.range=[r[r.length-(G||1)].range[0],r[r.length-1].range[1]]),$t=this.performAction.apply(et,[l,F,Y,X.yy,$[1],T,r].concat(we)),typeof $t<"u")return $t;G&&(n=n.slice(0,-1*G*2),T=T.slice(0,-1*G),r=r.slice(0,-1*G)),n.push(this.productions_[$[1]][0]),T.push(et.$),r.push(et._$),ie=tt[n[n.length-2]][n[n.length-1]],n.push(ie);break;case 3:return!0}}return!0},"parse")},Re=function(){var K={EOF:1,parseError:(0,i.eW)(function(h,n){if(this.yy.parser)this.yy.parser.parseError(h,n);else throw new Error(h)},"parseError"),setInput:(0,i.eW)(function(c,h){return this.yy=h||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,i.eW)(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var h=c.match(/(?:\r\n?|\n).*/g);return h?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:(0,i.eW)(function(c){var h=c.length,n=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-h),this.offset-=h;var _=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var T=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===_.length?this.yylloc.first_column:0)+_[_.length-n.length].length-n[0].length:this.yylloc.first_column-h},this.options.ranges&&(this.yylloc.range=[T[0],T[0]+this.yyleng-h]),this.yyleng=this.yytext.length,this},"unput"),more:(0,i.eW)(function(){return this._more=!0,this},"more"),reject:(0,i.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,i.eW)(function(c){this.unput(this.match.slice(c))},"less"),pastInput:(0,i.eW)(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,i.eW)(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,i.eW)(function(){var c=this.pastInput(),h=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+h+"^"},"showPosition"),test_match:(0,i.eW)(function(c,h){var n,_,T;if(this.options.backtrack_lexer&&(T={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(T.yylloc.range=this.yylloc.range.slice(0))),_=c[0].match(/(?:\r\n?|\n).*/g),_&&(this.yylineno+=_.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:_?_[_.length-1].length-_[_.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],n=this.performAction.call(this,this.yy,this,h,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),n)return n;if(this._backtrack){for(var r in T)this[r]=T[r];return!1}return!1},"test_match"),next:(0,i.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,h,n,_;this._more||(this.yytext="",this.match="");for(var T=this._currentRules(),r=0;r<T.length;r++)if(n=this._input.match(this.rules[T[r]]),n&&(!h||n[0].length>h[0].length)){if(h=n,_=r,this.options.backtrack_lexer){if(c=this.test_match(n,T[r]),c!==!1)return c;if(this._backtrack){h=!1;continue}else return!1}else if(!this.options.flex)break}return h?(c=this.test_match(h,T[_]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,i.eW)(function(){var h=this.next();return h||this.lex()},"lex"),begin:(0,i.eW)(function(h){this.conditionStack.push(h)},"begin"),popState:(0,i.eW)(function(){var h=this.conditionStack.length-1;return h>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,i.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,i.eW)(function(h){return h=this.conditionStack.length-1-Math.abs(h||0),h>=0?this.conditionStack[h]:"INITIAL"},"topState"),pushState:(0,i.eW)(function(h){this.begin(h)},"pushState"),stateStackSize:(0,i.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,i.eW)(function(h,n,_,T){function r(){const l=n.yytext.indexOf("%%");if(l===0)return!1;if(l>0){const Y=n.yytext.slice(0,l),F=n.yytext.slice(l);F&&h.lexer.unput(F),n.yytext=Y}return!0}(0,i.eW)(r,"processId");var tt=T;switch(_){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;break;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;break;case 17:return this.popState(),"acc_title_value";break;case 18:return this.begin("acc_descr"),35;break;case 19:return this.popState(),"acc_descr_value";break;case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;break;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 25:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 26:return this.popState(),43;break;case 27:return this.pushState("CLASS"),48;break;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 29:return this.popState(),50;break;case 30:return this.pushState("STYLE"),45;break;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 32:return this.popState(),47;break;case 33:return this.pushState("SCALE"),17;break;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;break;case 38:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;break;case 39:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;break;case 40:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),25;break;case 41:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),26;break;case 42:return this.popState(),n.yytext=n.yytext.slice(0,-10).trim(),27;break;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";break;case 49:if(!r())return;return this.popState(),"ID";break;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:return 19;case 53:this.popState();break;case 54:return this.popState(),this.pushState("struct"),20;break;case 55:return this.popState(),21;break;case 56:break;case 57:return this.begin("NOTE"),29;break;case 58:return this.popState(),this.pushState("NOTE_ID"),59;break;case 59:return this.popState(),this.pushState("NOTE_ID"),60;break;case 60:this.popState(),this.pushState("FLOATING_NOTE");break;case 61:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 62:break;case 63:return"NOTE_TEXT";case 64:if(!r())return;return this.popState(),"ID";break;case 65:if(!r())return;return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 66:return this.popState(),n.yytext=n.yytext.substr(2).trim(),31;break;case 67:return this.popState(),n.yytext=n.yytext.slice(0,-8).trim(),31;break;case 68:return 6;case 69:return 6;case 70:return 16;case 71:return 57;case 72:return r()?24:void 0;case 73:return n.yytext=n.yytext.trim(),14;break;case 74:return 15;case 75:return 28;case 76:return 58;case 77:return 5;case 78:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,55,56,57,71,72,73,74,75,76],inclusive:!1},FLOATING_NOTE_ID:{rules:[64],inclusive:!1},FLOATING_NOTE:{rules:[61,62,63],inclusive:!1},NOTE_TEXT:{rules:[66,67],inclusive:!1},NOTE_ID:{rules:[65],inclusive:!1},NOTE:{rules:[58,59,60],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,54,57,68,69,70,71,72,73,74,76,77,78],inclusive:!0}}};return K}();Ot.lexer=Re;function mt(){this.yy={}}return(0,i.eW)(mt,"Parser"),mt.prototype=Ot,Ot.Parser=mt,new mt}();L.parser=L;var W=L,at="TB",V="TB",nt="dir",U="state",j="root",Q="relation",ae="classDef",ne="style",oe="applyClass",ot="default",Bt="divider",Mt="fill:none",Yt="fill: #333",Ft="c",Gt="markdown",Vt="normal",xt="rect",Lt="rectWithTitle",ce="stateStart",le="stateEnd",Ut="divider",jt="roundedWithTitle",he="note",ue="noteGroup",ct="statediagram",de="state",fe=`${ct}-${de}`,Ht="transition",Se="note",pe="note-edge",ye=`${Ht} ${pe}`,_e=`${ct}-${Se}`,ge="cluster",Ee=`${ct}-${ge}`,Te="cluster-alt",be=`${ct}-${Te}`,Kt="parent",zt="note",ke="state",It="----",me=`${It}${zt}`,Jt=`${It}${Kt}`,Xt=(0,i.eW)((t,e=V)=>{if(!t.doc)return e;let s=e;for(const o of t.doc)o.stmt==="dir"&&(s=o.value);return s},"getDir"),De=(0,i.eW)(function(t,e){return e.db.getClasses()},"getClasses"),ve=(0,i.eW)(async function(t,e,s,o){i.cM.info("REF0:"),i.cM.info("Drawing state diagram (v2)",e);const{securityLevel:a,state:d,layout:f}=(0,g.nV)();o.db.extract(o.db.getRootDocV2());const p=o.db.getData(),S=(0,rt.q)(e,a);p.type=o.type,p.layoutAlgorithm=f,p.nodeSpacing=d?.nodeSpacing||50,p.rankSpacing=d?.rankSpacing||50,(0,g.nV)().look==="neo"?p.markers=["barbNeo"]:p.markers=["barb"],p.diagramId=e,await(0,it.sY)(p,S);const b=8;try{(typeof o.db.getLinks=="function"?o.db.getLinks():new Map).forEach((I,C)=>{const u=typeof C=="string"?C:typeof C?.id=="string"?C.id:"";if(!u){i.cM.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(C));return}const O=S.node()?.querySelectorAll("g");let A;if(O?.forEach(w=>{w.textContent?.trim()===u&&(A=w)}),!A){i.cM.warn("\u26A0\uFE0F Could not find node matching text:",u);return}const B=A.parentNode;if(!B){i.cM.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",u);return}const R=document.createElementNS("http://www.w3.org/2000/svg","a"),M=I.url.replace(/^"+|"+$/g,"");if(R.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",M),R.setAttribute("target","_blank"),I.tooltip){const w=I.tooltip.replace(/^"+|"+$/g,"");R.setAttribute("title",w)}B.replaceChild(R,A),R.appendChild(A),i.cM.info("\u{1F517} Wrapped node in <a> tag for:",u,I.url)})}catch(k){i.cM.error("\u274C Error injecting clickable links:",k)}z.w8.insertTitle(S,"statediagramTitleText",d?.titleTopMargin??25,o.db.getDiagramTitle()),(0,P.j)(S,b,ct,d?.useMaxWidth??!0)},"draw"),Ce={getClasses:De,draw:ve,getDir:Xt},ft=new Map,H=0;function St(t="",e=0,s="",o=It){const a=s!==null&&s.length>0?`${o}${s}`:"";return`${ke}-${t}${a}-${e}`}(0,i.eW)(St,"stateDomId");var Ae=(0,i.eW)((t,e,s,o,a,d,f,p)=>{i.cM.trace("items",e),e.forEach(S=>{switch(S.stmt){case U:ht(t,S,s,o,a,d,f,p);break;case ot:ht(t,S,s,o,a,d,f,p);break;case Q:{ht(t,S.state1,s,o,a,d,f,p),ht(t,S.state2,s,o,a,d,f,p);const E=f==="neo",b={id:"edge"+H,start:S.state1.id,end:S.state2.id,arrowhead:"normal",arrowTypeEnd:E?"arrow_barb_neo":"arrow_barb",style:Mt,labelStyle:"",label:g.SY.sanitizeText(S.description??"",(0,g.nV)()),arrowheadStyle:Yt,labelpos:Ft,labelType:Gt,thickness:Vt,classes:Ht,look:f};a.push(b),H++}break}})},"setupDoc"),Zt=(0,i.eW)((t,e=V)=>{let s=e;if(t.doc)for(const o of t.doc)o.stmt==="dir"&&(s=o.value);return s},"getDir");function lt(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(a=>{const d=s.get(a);d&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...d.styles])}));const o=t.find(a=>a.id===e.id);o?Object.assign(o,e):t.push(e)}(0,i.eW)(lt,"insertOrUpdateNode");function Qt(t){return t?.classes?.join(" ")??""}(0,i.eW)(Qt,"getClassesFromDbInfo");function qt(t){return t?.styles??[]}(0,i.eW)(qt,"getStylesFromDbInfo");var ht=(0,i.eW)((t,e,s,o,a,d,f,p)=>{const S=e.id,E=s.get(S),b=Qt(E),k=qt(E),I=(0,g.nV)();if(i.cM.info("dataFetcher parsedItem",e,E,k),S!=="root"){let C=xt;e.start===!0?C=ce:e.start===!1&&(C=le),e.type!==ot&&(C=e.type),ft.get(S)||ft.set(S,{id:S,shape:C,description:g.SY.sanitizeText(S,I),cssClasses:`${b} ${fe}`,cssStyles:k});const u=ft.get(S);e.description&&(Array.isArray(u.description)?(u.shape=Lt,u.description.push(e.description)):u.description?.length&&u.description.length>0?(u.shape=Lt,u.description===S?u.description=[e.description]:u.description=[u.description,e.description]):(u.shape=xt,u.description=e.description),u.description=g.SY.sanitizeTextOrArray(u.description,I)),u.description?.length===1&&u.shape===Lt&&(u.type==="group"?u.shape=jt:u.shape=xt),!u.type&&e.doc&&(i.cM.info("Setting cluster for XCX",S,Zt(e)),u.type="group",u.isGroup=!0,u.dir=Zt(e),u.shape=e.type===Bt?Ut:jt,u.cssClasses=`${u.cssClasses} ${Ee} ${d?be:""}`);const O={labelStyle:"",shape:u.shape,label:u.description,cssClasses:u.cssClasses,cssCompiledStyles:[],cssStyles:u.cssStyles,id:S,dir:u.dir,domId:St(S,H),type:u.type,isGroup:u.type==="group",padding:8,rx:10,ry:10,look:f,labelType:"markdown"};if(O.shape===Ut&&(O.label=""),t&&t.id!=="root"&&(i.cM.trace("Setting node ",S," to be child of its parent ",t.id),O.parentId=t.id),O.centerLabel=!0,e.note){const A={labelStyle:"",shape:he,label:e.note.text,labelType:"markdown",cssClasses:_e,cssStyles:[],cssCompiledStyles:[],id:S+me+"-"+H,domId:St(S,H,zt),type:u.type,isGroup:u.type==="group",padding:I.flowchart?.padding,look:f,position:e.note.position},B=S+Jt,R={labelStyle:"",shape:ue,label:e.note.text,cssClasses:u.cssClasses,cssStyles:[],id:S+Jt,domId:St(S,H,Kt),type:"group",isGroup:!0,padding:16,look:f,position:e.note.position};H++,R.id=B,A.parentId=B,lt(o,R,p),lt(o,A,p),lt(o,O,p);let M=S,w=A.id;e.note.position==="left of"&&(M=A.id,w=S),a.push({id:M+"-"+w,start:M,end:w,arrowhead:"none",arrowTypeEnd:"",style:Mt,labelStyle:"",classes:ye,arrowheadStyle:Yt,labelpos:Ft,labelType:Gt,thickness:Vt,look:f})}else lt(o,O,p)}e.doc&&(i.cM.trace("Adding nodes children "),Ae(e,e.doc,s,o,a,!d,f,p))},"dataFetcher"),xe=(0,i.eW)(()=>{ft.clear(),H=0},"reset"),v={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},te=(0,i.eW)(()=>new Map,"newClassesList"),ee=(0,i.eW)(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),pt=(0,i.eW)(t=>JSON.parse(JSON.stringify(t)),"clone"),Le=(J=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=te(),this.documents={root:ee()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=g.eu,this.setAccTitle=g.GN,this.getAccDescription=g.Mx,this.setAccDescription=g.U$,this.setDiagramTitle=g.g2,this.getDiagramTitle=g.Kr,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(e){this.clear(!0);for(const a of Array.isArray(e)?e:e.doc)switch(a.stmt){case U:this.addState(a.id.trim(),a.type,a.doc,a.description,a.note);break;case Q:this.addRelation(a.state1,a.state2,a.description);break;case ae:this.addStyleClass(a.id.trim(),a.classes);break;case ne:this.handleStyleDef(a);break;case oe:this.setCssClass(a.id.trim(),a.styleClass);break;case"click":this.addLink(a.id,a.url,a.tooltip);break}const s=this.getStates(),o=(0,g.nV)();xe(),ht(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,o.look,this.classes);for(const a of this.nodes)if(Array.isArray(a.label)){if(a.description=a.label.slice(1),a.isGroup&&a.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${a.id}]`);a.label=a.label[0]}}handleStyleDef(e){const s=e.id.trim().split(","),o=e.styleClass.split(",");for(const a of s){let d=this.getState(a);if(!d){const f=a.trim();this.addState(f),d=this.getState(f)}d&&(d.styles=o.map(f=>f.replace(/;/g,"")?.trim()))}}setRootDoc(e){i.cM.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,o){if(s.stmt===Q){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===U&&(s.id===v.START_NODE?(s.id=e.id+(o?"_start":"_end"),s.start=o):s.id=s.id.trim()),s.stmt!==j&&s.stmt!==U||!s.doc)return;const a=[];let d=[];for(const f of s.doc)if(f.type===Bt){const p=pt(f);p.doc=pt(d),a.push(p),d=[]}else d.push(f);if(a.length>0&&d.length>0){const f={stmt:U,id:(0,z.Ox)(),type:"divider",doc:pt(d)};a.push(pt(f)),s.doc=a}s.doc.forEach(f=>this.docTranslator(s,f,!0))}getRootDocV2(){return this.docTranslator({id:j,stmt:j},{id:j,stmt:j,doc:this.rootDoc},!0),{id:j,doc:this.rootDoc}}addState(e,s=ot,o=void 0,a=void 0,d=void 0,f=void 0,p=void 0,S=void 0){const E=e?.trim();if(!this.currentDocument.states.has(E))i.cM.info("Adding state ",E,a),this.currentDocument.states.set(E,{stmt:U,id:E,descriptions:[],type:s,doc:o,note:d,classes:[],styles:[],textStyles:[]});else{const b=this.currentDocument.states.get(E);if(!b)throw new Error(`State not found: ${E}`);b.doc||(b.doc=o),b.type||(b.type=s)}if(a&&(i.cM.info("Setting state description",E,a),(Array.isArray(a)?a:[a]).forEach(k=>this.addDescription(E,k.trim()))),d){const b=this.currentDocument.states.get(E);if(!b)throw new Error(`State not found: ${E}`);b.note=d,b.note.text=g.SY.sanitizeText(b.note.text,(0,g.nV)())}f&&(i.cM.info("Setting state classes",E,f),(Array.isArray(f)?f:[f]).forEach(k=>this.setCssClass(E,k.trim()))),p&&(i.cM.info("Setting state styles",E,p),(Array.isArray(p)?p:[p]).forEach(k=>this.setStyle(E,k.trim()))),S&&(i.cM.info("Setting state styles",E,p),(Array.isArray(S)?S:[S]).forEach(k=>this.setTextStyle(E,k.trim())))}clear(e){this.nodes=[],this.edges=[],this.documents={root:ee()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=te(),e||(this.links=new Map,(0,g.ZH)())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){i.cM.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,o){this.links.set(e,{url:s,tooltip:o}),i.cM.warn("Adding link",e,s,o)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===v.START_NODE?(this.startEndCount++,`${v.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=ot){return e===v.START_NODE?v.START_TYPE:s}endIdIfNeeded(e=""){return e===v.END_NODE?(this.startEndCount++,`${v.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=ot){return e===v.END_NODE?v.END_TYPE:s}addRelationObjs(e,s,o=""){const a=this.startIdIfNeeded(e.id.trim()),d=this.startTypeIfNeeded(e.id.trim(),e.type),f=this.startIdIfNeeded(s.id.trim()),p=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(a,d,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(f,p,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:a,id2:f,relationTitle:g.SY.sanitizeText(o,(0,g.nV)())})}addRelation(e,s,o){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,o);else if(typeof e=="string"&&typeof s=="string"){const a=this.startIdIfNeeded(e.trim()),d=this.startTypeIfNeeded(e),f=this.endIdIfNeeded(s.trim()),p=this.endTypeIfNeeded(s);this.addState(a,d),this.addState(f,p),this.currentDocument.relations.push({id1:a,id2:f,relationTitle:o?g.SY.sanitizeText(o,(0,g.nV)()):void 0})}}addDescription(e,s){const o=this.currentDocument.states.get(e),a=s.startsWith(":")?s.replace(":","").trim():s;o?.descriptions?.push(g.SY.sanitizeText(a,(0,g.nV)()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});const o=this.classes.get(e);s&&o&&s.split(v.STYLECLASS_SEP).forEach(a=>{const d=a.replace(/([^;]*);/,"$1").trim();if(RegExp(v.COLOR_KEYWORD).exec(a)){const p=d.replace(v.FILL_KEYWORD,v.BG_FILL).replace(v.COLOR_KEYWORD,v.FILL_KEYWORD);o.textStyles.push(p)}o.styles.push(d)})}getClasses(){return this.classes}setCssClass(e,s){e.split(",").forEach(o=>{let a=this.getState(o);if(!a){const d=o.trim();this.addState(d),a=this.getState(d)}a?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===nt)}getDirection(){return this.getDirectionStatement()?.value??at}setDirection(e){const s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:nt,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){const e=(0,g.nV)();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:Xt(this.getRootDocV2())}}getConfig(){return(0,g.nV)().state}},(0,i.eW)(J,"StateDB"),J.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},J),Ie=(0,i.eW)(t=>`
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
`,"getStyles"),Oe=Ie}}]);})();
