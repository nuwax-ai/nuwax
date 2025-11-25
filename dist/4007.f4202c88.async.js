"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[4007],{53243:function(Bt,et,v){v.d(et,{q:function(){return it}});var st=v(57099),B=v(21489),it=(0,st.eW)((K,g)=>{let a;return g==="sandbox"&&(a=(0,B.Ys)("#i"+K)),(g==="sandbox"?(0,B.Ys)(a.nodes()[0].contentDocument.body):(0,B.Ys)("body")).select(`[id="${K}"]`)},"getDiagramElement")},54007:function(Bt,et,v){var H;v.d(et,{Ee:function(){return Oe},J8:function(){return W},_$:function(){return Ce},oI:function(){return Le}});var st=v(53243),B=v(73024),it=v(58108),K=v(74128),g=v(98994),a=v(57099),I=function(){var t=(0,a.eW)(function(j,c,h,o){for(h=h||{},o=j.length;o--;h[j[o]]=c);return h},"o"),e=[1,2],s=[1,3],n=[1,4],r=[2,4],u=[1,9],d=[1,11],S=[1,16],f=[1,17],E=[1,18],b=[1,19],k=[1,33],L=[1,20],A=[1,21],p=[1,22],D=[1,23],w=[1,24],O=[1,26],$=[1,27],R=[1,28],M=[1,29],St=[1,30],yt=[1,31],_t=[1,32],gt=[1,35],Et=[1,36],Tt=[1,37],bt=[1,38],Q=[1,34],y=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],kt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],se=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Ot={trace:(0,a.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:(0,a.eW)(function(c,h,o,_,T,i,ht){var l=i.length-1;switch(T){case 3:return _.setRootDoc(i[l]),i[l];break;case 4:this.$=[];break;case 5:i[l]!="nl"&&(i[l-1].push(i[l]),this.$=i[l-1]);break;case 6:case 7:this.$=i[l];break;case 8:this.$="nl";break;case 12:this.$=i[l];break;case 13:const Dt=i[l-1];Dt.description=_.trimColon(i[l]),this.$=Dt;break;case 14:this.$={stmt:"relation",state1:i[l-2],state2:i[l]};break;case 15:const vt=_.trimColon(i[l]);this.$={stmt:"relation",state1:i[l-3],state2:i[l-1],description:vt};break;case 19:this.$={stmt:"state",id:i[l-3],type:"default",description:"",doc:i[l-1]};break;case 20:var z=i[l],q=i[l-2].trim();if(i[l].match(":")){var ut=i[l].split(":");z=ut[0],q=[q,ut[1]]}this.$={stmt:"state",id:z,type:"default",description:q};break;case 21:this.$={stmt:"state",id:i[l-3],type:"default",description:i[l-5],doc:i[l-1]};break;case 22:this.$={stmt:"state",id:i[l],type:"fork"};break;case 23:this.$={stmt:"state",id:i[l],type:"join"};break;case 24:this.$={stmt:"state",id:i[l],type:"choice"};break;case 25:this.$={stmt:"state",id:_.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[l-1].trim(),note:{position:i[l-2].trim(),text:i[l].trim()}};break;case 29:this.$=i[l].trim(),_.setAccTitle(this.$);break;case 30:case 31:this.$=i[l].trim(),_.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[l-3],url:i[l-2],tooltip:i[l-1]};break;case 33:this.$={stmt:"click",id:i[l-3],url:i[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[l-1].trim(),classes:i[l].trim()};break;case 36:this.$={stmt:"style",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 37:this.$={stmt:"applyClass",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 38:_.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:_.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:_.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:_.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:n},{1:[3]},{3:5,4:e,5:s,6:n},{3:6,4:e,5:s,6:n},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],r,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:E,22:b,24:k,25:L,26:A,27:p,28:D,29:w,32:25,33:O,35:$,37:R,38:M,41:St,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:Q},t(y,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:f,19:E,22:b,24:k,25:L,26:A,27:p,28:D,29:w,32:25,33:O,35:$,37:R,38:M,41:St,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:Q},t(y,[2,7]),t(y,[2,8]),t(y,[2,9]),t(y,[2,10]),t(y,[2,11]),t(y,[2,12],{14:[1,40],15:[1,41]}),t(y,[2,16]),{18:[1,42]},t(y,[2,18],{20:[1,43]}),{23:[1,44]},t(y,[2,22]),t(y,[2,23]),t(y,[2,24]),t(y,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(y,[2,28]),{34:[1,49]},{36:[1,50]},t(y,[2,31]),{13:51,24:k,57:Q},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(kt,[2,44],{58:[1,56]}),t(kt,[2,45],{58:[1,57]}),t(y,[2,38]),t(y,[2,39]),t(y,[2,40]),t(y,[2,41]),t(y,[2,6]),t(y,[2,13]),{13:58,24:k,57:Q},t(y,[2,17]),t(se,r,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(y,[2,29]),t(y,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(y,[2,14],{14:[1,71]}),{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:E,21:[1,72],22:b,24:k,25:L,26:A,27:p,28:D,29:w,32:25,33:O,35:$,37:R,38:M,41:St,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:Q},t(y,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(y,[2,34]),t(y,[2,35]),t(y,[2,36]),t(y,[2,37]),t(kt,[2,46]),t(kt,[2,47]),t(y,[2,15]),t(y,[2,19]),t(se,r,{7:78}),t(y,[2,26]),t(y,[2,27]),{5:[1,79]},{5:[1,80]},{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:E,21:[1,81],22:b,24:k,25:L,26:A,27:p,28:D,29:w,32:25,33:O,35:$,37:R,38:M,41:St,45:yt,48:_t,51:gt,52:Et,53:Tt,54:bt,57:Q},t(y,[2,32]),t(y,[2,33]),t(y,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:(0,a.eW)(function(c,h){if(h.recoverable)this.trace(c);else{var o=new Error(c);throw o.hash=h,o}},"parseError"),parse:(0,a.eW)(function(c){var h=this,o=[0],_=[],T=[null],i=[],ht=this.table,l="",z=0,q=0,ut=0,Dt=2,vt=1,Ne=i.slice.call(arguments,1),m=Object.create(this.lexer),J={yy:{}};for(var Rt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Rt)&&(J.yy[Rt]=this.yy[Rt]);m.setInput(c,J.yy),J.yy.lexer=m,J.yy.parser=this,typeof m.yylloc>"u"&&(m.yylloc={});var Nt=m.yylloc;i.push(Nt);var we=m.options&&m.options.ranges;typeof J.yy.parseError=="function"?this.parseError=J.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Pe(N){o.length=o.length-2*N,T.length=T.length-N,i.length=i.length-N}(0,a.eW)(Pe,"popStack");function ie(){var N;return N=_.pop()||m.lex()||vt,typeof N!="number"&&(N instanceof Array&&(_=N,N=_.pop()),N=h.symbols_[N]||N),N}(0,a.eW)(ie,"lex");for(var x,wt,X,P,We,Pt,tt={},Ct,Y,re,At;;){if(X=o[o.length-1],this.defaultActions[X]?P=this.defaultActions[X]:((x===null||typeof x>"u")&&(x=ie()),P=ht[X]&&ht[X][x]),typeof P>"u"||!P.length||!P[0]){var Wt="";At=[];for(Ct in ht[X])this.terminals_[Ct]&&Ct>Dt&&At.push("'"+this.terminals_[Ct]+"'");m.showPosition?Wt="Parse error on line "+(z+1)+`:
`+m.showPosition()+`
Expecting `+At.join(", ")+", got '"+(this.terminals_[x]||x)+"'":Wt="Parse error on line "+(z+1)+": Unexpected "+(x==vt?"end of input":"'"+(this.terminals_[x]||x)+"'"),this.parseError(Wt,{text:m.match,token:this.terminals_[x]||x,line:m.yylineno,loc:Nt,expected:At})}if(P[0]instanceof Array&&P.length>1)throw new Error("Parse Error: multiple actions possible at state: "+X+", token: "+x);switch(P[0]){case 1:o.push(x),T.push(m.yytext),i.push(m.yylloc),o.push(P[1]),x=null,wt?(x=wt,wt=null):(q=m.yyleng,l=m.yytext,z=m.yylineno,Nt=m.yylloc,ut>0&&ut--);break;case 2:if(Y=this.productions_[P[1]][1],tt.$=T[T.length-Y],tt._$={first_line:i[i.length-(Y||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(Y||1)].first_column,last_column:i[i.length-1].last_column},we&&(tt._$.range=[i[i.length-(Y||1)].range[0],i[i.length-1].range[1]]),Pt=this.performAction.apply(tt,[l,q,z,J.yy,P[1],T,i].concat(Ne)),typeof Pt<"u")return Pt;Y&&(o=o.slice(0,-1*Y*2),T=T.slice(0,-1*Y),i=i.slice(0,-1*Y)),o.push(this.productions_[P[1]][0]),T.push(tt.$),i.push(tt._$),re=ht[o[o.length-2]][o[o.length-1]],o.push(re);break;case 3:return!0}}return!0},"parse")},Re=function(){var j={EOF:1,parseError:(0,a.eW)(function(h,o){if(this.yy.parser)this.yy.parser.parseError(h,o);else throw new Error(h)},"parseError"),setInput:(0,a.eW)(function(c,h){return this.yy=h||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,a.eW)(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var h=c.match(/(?:\r\n?|\n).*/g);return h?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:(0,a.eW)(function(c){var h=c.length,o=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-h),this.offset-=h;var _=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),o.length-1&&(this.yylineno-=o.length-1);var T=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:o?(o.length===_.length?this.yylloc.first_column:0)+_[_.length-o.length].length-o[0].length:this.yylloc.first_column-h},this.options.ranges&&(this.yylloc.range=[T[0],T[0]+this.yyleng-h]),this.yyleng=this.yytext.length,this},"unput"),more:(0,a.eW)(function(){return this._more=!0,this},"more"),reject:(0,a.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,a.eW)(function(c){this.unput(this.match.slice(c))},"less"),pastInput:(0,a.eW)(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,a.eW)(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,a.eW)(function(){var c=this.pastInput(),h=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+h+"^"},"showPosition"),test_match:(0,a.eW)(function(c,h){var o,_,T;if(this.options.backtrack_lexer&&(T={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(T.yylloc.range=this.yylloc.range.slice(0))),_=c[0].match(/(?:\r\n?|\n).*/g),_&&(this.yylineno+=_.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:_?_[_.length-1].length-_[_.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],o=this.performAction.call(this,this.yy,this,h,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),o)return o;if(this._backtrack){for(var i in T)this[i]=T[i];return!1}return!1},"test_match"),next:(0,a.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,h,o,_;this._more||(this.yytext="",this.match="");for(var T=this._currentRules(),i=0;i<T.length;i++)if(o=this._input.match(this.rules[T[i]]),o&&(!h||o[0].length>h[0].length)){if(h=o,_=i,this.options.backtrack_lexer){if(c=this.test_match(o,T[i]),c!==!1)return c;if(this._backtrack){h=!1;continue}else return!1}else if(!this.options.flex)break}return h?(c=this.test_match(h,T[_]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,a.eW)(function(){var h=this.next();return h||this.lex()},"lex"),begin:(0,a.eW)(function(h){this.conditionStack.push(h)},"begin"),popState:(0,a.eW)(function(){var h=this.conditionStack.length-1;return h>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,a.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,a.eW)(function(h){return h=this.conditionStack.length-1-Math.abs(h||0),h>=0?this.conditionStack[h]:"INITIAL"},"topState"),pushState:(0,a.eW)(function(h){this.begin(h)},"pushState"),stateStackSize:(0,a.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,a.eW)(function(h,o,_,T){var i=T;switch(_){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:break;case 9:break;case 10:return 5;case 11:break;case 12:break;case 13:break;case 14:break;case 15:return this.pushState("SCALE"),17;break;case 16:return 18;case 17:this.popState();break;case 18:return this.begin("acc_title"),33;break;case 19:return this.popState(),"acc_title_value";break;case 20:return this.begin("acc_descr"),35;break;case 21:return this.popState(),"acc_descr_value";break;case 22:this.begin("acc_descr_multiline");break;case 23:this.popState();break;case 24:return"acc_descr_multiline_value";case 25:return this.pushState("CLASSDEF"),41;break;case 26:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 27:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 28:return this.popState(),43;break;case 29:return this.pushState("CLASS"),48;break;case 30:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 31:return this.popState(),50;break;case 32:return this.pushState("STYLE"),45;break;case 33:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 34:return this.popState(),47;break;case 35:return this.pushState("SCALE"),17;break;case 36:return 18;case 37:this.popState();break;case 38:this.pushState("STATE");break;case 39:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),25;break;case 40:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),26;break;case 41:return this.popState(),o.yytext=o.yytext.slice(0,-10).trim(),27;break;case 42:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),25;break;case 43:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),26;break;case 44:return this.popState(),o.yytext=o.yytext.slice(0,-10).trim(),27;break;case 45:return 51;case 46:return 52;case 47:return 53;case 48:return 54;case 49:this.pushState("STATE_STRING");break;case 50:return this.pushState("STATE_ID"),"AS";break;case 51:return this.popState(),"ID";break;case 52:this.popState();break;case 53:return"STATE_DESCR";case 54:return 19;case 55:this.popState();break;case 56:return this.popState(),this.pushState("struct"),20;break;case 57:break;case 58:return this.popState(),21;break;case 59:break;case 60:return this.begin("NOTE"),29;break;case 61:return this.popState(),this.pushState("NOTE_ID"),59;break;case 62:return this.popState(),this.pushState("NOTE_ID"),60;break;case 63:this.popState(),this.pushState("FLOATING_NOTE");break;case 64:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 65:break;case 66:return"NOTE_TEXT";case 67:return this.popState(),"ID";break;case 68:return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 69:return this.popState(),o.yytext=o.yytext.substr(2).trim(),31;break;case 70:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),31;break;case 71:return 6;case 72:return 6;case 73:return 16;case 74:return 57;case 75:return 24;case 76:return o.yytext=o.yytext.trim(),14;break;case 77:return 15;case 78:return 28;case 79:return 58;case 80:return 5;case 81:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[12,13],inclusive:!1},struct:{rules:[12,13,25,29,32,38,45,46,47,48,57,58,59,60,74,75,76,77,78],inclusive:!1},FLOATING_NOTE_ID:{rules:[67],inclusive:!1},FLOATING_NOTE:{rules:[64,65,66],inclusive:!1},NOTE_TEXT:{rules:[69,70],inclusive:!1},NOTE_ID:{rules:[68],inclusive:!1},NOTE:{rules:[61,62,63],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[34],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[33],inclusive:!1},CLASS_STYLE:{rules:[31],inclusive:!1},CLASS:{rules:[30],inclusive:!1},CLASSDEFID:{rules:[28],inclusive:!1},CLASSDEF:{rules:[26,27],inclusive:!1},acc_descr_multiline:{rules:[23,24],inclusive:!1},acc_descr:{rules:[21],inclusive:!1},acc_title:{rules:[19],inclusive:!1},SCALE:{rules:[16,17,36,37],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[51],inclusive:!1},STATE_STRING:{rules:[52,53],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[12,13,39,40,41,42,43,44,49,50,54,55,56],inclusive:!1},ID:{rules:[12,13],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,18,20,22,25,29,32,35,38,56,60,71,72,73,74,75,76,77,79,80,81],inclusive:!0}}};return j}();Ot.lexer=Re;function mt(){this.yy={}}return(0,a.eW)(mt,"Parser"),mt.prototype=Ot,Ot.Parser=mt,new mt}();I.parser=I;var W=I,rt="TB",F="TB",at="dir",G="state",V="root",Z="relation",ae="classDef",ne="style",oe="applyClass",nt="default",$t="divider",Mt="fill:none",Yt="fill: #333",Ft="c",Gt="text",Vt="normal",xt="rect",Lt="rectWithTitle",ce="stateStart",le="stateEnd",Ut="divider",jt="roundedWithTitle",he="note",ue="noteGroup",ot="statediagram",de="state",fe=`${ot}-${de}`,Kt="transition",pe="note",Se="note-edge",ye=`${Kt} ${Se}`,_e=`${ot}-${pe}`,ge="cluster",Ee=`${ot}-${ge}`,Te="cluster-alt",be=`${ot}-${Te}`,Ht="parent",zt="note",ke="state",It="----",me=`${It}${zt}`,Jt=`${It}${Ht}`,Xt=(0,a.eW)((t,e=F)=>{if(!t.doc)return e;let s=e;for(const n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir"),De=(0,a.eW)(function(t,e){return e.db.getClasses()},"getClasses"),ve=(0,a.eW)(async function(t,e,s,n){a.cM.info("REF0:"),a.cM.info("Drawing state diagram (v2)",e);const{securityLevel:r,state:u,layout:d}=(0,g.nV)();n.db.extract(n.db.getRootDocV2());const S=n.db.getData(),f=(0,st.q)(e,r);S.type=n.type,S.layoutAlgorithm=d,S.nodeSpacing=u?.nodeSpacing||50,S.rankSpacing=u?.rankSpacing||50,S.markers=["barb"],S.diagramId=e,await(0,it.sY)(S,f);const E=8;try{(typeof n.db.getLinks=="function"?n.db.getLinks():new Map).forEach((k,L)=>{const A=typeof L=="string"?L:typeof L?.id=="string"?L.id:"";if(!A){a.cM.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(L));return}const p=f.node()?.querySelectorAll("g");let D;if(p?.forEach(R=>{R.textContent?.trim()===A&&(D=R)}),!D){a.cM.warn("\u26A0\uFE0F Could not find node matching text:",A);return}const w=D.parentNode;if(!w){a.cM.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",A);return}const O=document.createElementNS("http://www.w3.org/2000/svg","a"),$=k.url.replace(/^"+|"+$/g,"");if(O.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",$),O.setAttribute("target","_blank"),k.tooltip){const R=k.tooltip.replace(/^"+|"+$/g,"");O.setAttribute("title",R)}w.replaceChild(O,D),O.appendChild(D),a.cM.info("\u{1F517} Wrapped node in <a> tag for:",A,k.url)})}catch(b){a.cM.error("\u274C Error injecting clickable links:",b)}K.w8.insertTitle(f,"statediagramTitleText",u?.titleTopMargin??25,n.db.getDiagramTitle()),(0,B.j)(f,E,ot,u?.useMaxWidth??!0)},"draw"),Ce={getClasses:De,draw:ve,getDir:Xt},dt=new Map,U=0;function ft(t="",e=0,s="",n=It){const r=s!==null&&s.length>0?`${n}${s}`:"";return`${ke}-${t}${r}-${e}`}(0,a.eW)(ft,"stateDomId");var Ae=(0,a.eW)((t,e,s,n,r,u,d,S)=>{a.cM.trace("items",e),e.forEach(f=>{switch(f.stmt){case G:lt(t,f,s,n,r,u,d,S);break;case nt:lt(t,f,s,n,r,u,d,S);break;case Z:{lt(t,f.state1,s,n,r,u,d,S),lt(t,f.state2,s,n,r,u,d,S);const E={id:"edge"+U,start:f.state1.id,end:f.state2.id,arrowhead:"normal",arrowTypeEnd:"arrow_barb",style:Mt,labelStyle:"",label:g.SY.sanitizeText(f.description??"",(0,g.nV)()),arrowheadStyle:Yt,labelpos:Ft,labelType:Gt,thickness:Vt,classes:Kt,look:d};r.push(E),U++}break}})},"setupDoc"),Zt=(0,a.eW)((t,e=F)=>{let s=e;if(t.doc)for(const n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir");function ct(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(r=>{const u=s.get(r);u&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...u.styles])}));const n=t.find(r=>r.id===e.id);n?Object.assign(n,e):t.push(e)}(0,a.eW)(ct,"insertOrUpdateNode");function Qt(t){return t?.classes?.join(" ")??""}(0,a.eW)(Qt,"getClassesFromDbInfo");function qt(t){return t?.styles??[]}(0,a.eW)(qt,"getStylesFromDbInfo");var lt=(0,a.eW)((t,e,s,n,r,u,d,S)=>{const f=e.id,E=s.get(f),b=Qt(E),k=qt(E),L=(0,g.nV)();if(a.cM.info("dataFetcher parsedItem",e,E,k),f!=="root"){let A=xt;e.start===!0?A=ce:e.start===!1&&(A=le),e.type!==nt&&(A=e.type),dt.get(f)||dt.set(f,{id:f,shape:A,description:g.SY.sanitizeText(f,L),cssClasses:`${b} ${fe}`,cssStyles:k});const p=dt.get(f);e.description&&(Array.isArray(p.description)?(p.shape=Lt,p.description.push(e.description)):p.description?.length&&p.description.length>0?(p.shape=Lt,p.description===f?p.description=[e.description]:p.description=[p.description,e.description]):(p.shape=xt,p.description=e.description),p.description=g.SY.sanitizeTextOrArray(p.description,L)),p.description?.length===1&&p.shape===Lt&&(p.type==="group"?p.shape=jt:p.shape=xt),!p.type&&e.doc&&(a.cM.info("Setting cluster for XCX",f,Zt(e)),p.type="group",p.isGroup=!0,p.dir=Zt(e),p.shape=e.type===$t?Ut:jt,p.cssClasses=`${p.cssClasses} ${Ee} ${u?be:""}`);const D={labelStyle:"",shape:p.shape,label:p.description,cssClasses:p.cssClasses,cssCompiledStyles:[],cssStyles:p.cssStyles,id:f,dir:p.dir,domId:ft(f,U),type:p.type,isGroup:p.type==="group",padding:8,rx:10,ry:10,look:d};if(D.shape===Ut&&(D.label=""),t&&t.id!=="root"&&(a.cM.trace("Setting node ",f," to be child of its parent ",t.id),D.parentId=t.id),D.centerLabel=!0,e.note){const w={labelStyle:"",shape:he,label:e.note.text,cssClasses:_e,cssStyles:[],cssCompiledStyles:[],id:f+me+"-"+U,domId:ft(f,U,zt),type:p.type,isGroup:p.type==="group",padding:L.flowchart?.padding,look:d,position:e.note.position},O=f+Jt,$={labelStyle:"",shape:ue,label:e.note.text,cssClasses:p.cssClasses,cssStyles:[],id:f+Jt,domId:ft(f,U,Ht),type:"group",isGroup:!0,padding:16,look:d,position:e.note.position};U++,$.id=O,w.parentId=O,ct(n,$,S),ct(n,w,S),ct(n,D,S);let R=f,M=w.id;e.note.position==="left of"&&(R=w.id,M=f),r.push({id:R+"-"+M,start:R,end:M,arrowhead:"none",arrowTypeEnd:"",style:Mt,labelStyle:"",classes:ye,arrowheadStyle:Yt,labelpos:Ft,labelType:Gt,thickness:Vt,look:d})}else ct(n,D,S)}e.doc&&(a.cM.trace("Adding nodes children "),Ae(e,e.doc,s,n,r,!u,d,S))},"dataFetcher"),xe=(0,a.eW)(()=>{dt.clear(),U=0},"reset"),C={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},te=(0,a.eW)(()=>new Map,"newClassesList"),ee=(0,a.eW)(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),pt=(0,a.eW)(t=>JSON.parse(JSON.stringify(t)),"clone"),Le=(H=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=te(),this.documents={root:ee()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=g.eu,this.setAccTitle=g.GN,this.getAccDescription=g.Mx,this.setAccDescription=g.U$,this.setDiagramTitle=g.g2,this.getDiagramTitle=g.Kr,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(e){this.clear(!0);for(const r of Array.isArray(e)?e:e.doc)switch(r.stmt){case G:this.addState(r.id.trim(),r.type,r.doc,r.description,r.note);break;case Z:this.addRelation(r.state1,r.state2,r.description);break;case ae:this.addStyleClass(r.id.trim(),r.classes);break;case ne:this.handleStyleDef(r);break;case oe:this.setCssClass(r.id.trim(),r.styleClass);break;case"click":this.addLink(r.id,r.url,r.tooltip);break}const s=this.getStates(),n=(0,g.nV)();xe(),lt(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,n.look,this.classes);for(const r of this.nodes)if(Array.isArray(r.label)){if(r.description=r.label.slice(1),r.isGroup&&r.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${r.id}]`);r.label=r.label[0]}}handleStyleDef(e){const s=e.id.trim().split(","),n=e.styleClass.split(",");for(const r of s){let u=this.getState(r);if(!u){const d=r.trim();this.addState(d),u=this.getState(d)}u&&(u.styles=n.map(d=>d.replace(/;/g,"")?.trim()))}}setRootDoc(e){a.cM.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,n){if(s.stmt===Z){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===G&&(s.id===C.START_NODE?(s.id=e.id+(n?"_start":"_end"),s.start=n):s.id=s.id.trim()),s.stmt!==V&&s.stmt!==G||!s.doc)return;const r=[];let u=[];for(const d of s.doc)if(d.type===$t){const S=pt(d);S.doc=pt(u),r.push(S),u=[]}else u.push(d);if(r.length>0&&u.length>0){const d={stmt:G,id:(0,K.Ox)(),type:"divider",doc:pt(u)};r.push(pt(d)),s.doc=r}s.doc.forEach(d=>this.docTranslator(s,d,!0))}getRootDocV2(){return this.docTranslator({id:V,stmt:V},{id:V,stmt:V,doc:this.rootDoc},!0),{id:V,doc:this.rootDoc}}addState(e,s=nt,n=void 0,r=void 0,u=void 0,d=void 0,S=void 0,f=void 0){const E=e?.trim();if(!this.currentDocument.states.has(E))a.cM.info("Adding state ",E,r),this.currentDocument.states.set(E,{stmt:G,id:E,descriptions:[],type:s,doc:n,note:u,classes:[],styles:[],textStyles:[]});else{const b=this.currentDocument.states.get(E);if(!b)throw new Error(`State not found: ${E}`);b.doc||(b.doc=n),b.type||(b.type=s)}if(r&&(a.cM.info("Setting state description",E,r),(Array.isArray(r)?r:[r]).forEach(k=>this.addDescription(E,k.trim()))),u){const b=this.currentDocument.states.get(E);if(!b)throw new Error(`State not found: ${E}`);b.note=u,b.note.text=g.SY.sanitizeText(b.note.text,(0,g.nV)())}d&&(a.cM.info("Setting state classes",E,d),(Array.isArray(d)?d:[d]).forEach(k=>this.setCssClass(E,k.trim()))),S&&(a.cM.info("Setting state styles",E,S),(Array.isArray(S)?S:[S]).forEach(k=>this.setStyle(E,k.trim()))),f&&(a.cM.info("Setting state styles",E,S),(Array.isArray(f)?f:[f]).forEach(k=>this.setTextStyle(E,k.trim())))}clear(e){this.nodes=[],this.edges=[],this.documents={root:ee()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=te(),e||(this.links=new Map,(0,g.ZH)())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){a.cM.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,n){this.links.set(e,{url:s,tooltip:n}),a.cM.warn("Adding link",e,s,n)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===C.START_NODE?(this.startEndCount++,`${C.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=nt){return e===C.START_NODE?C.START_TYPE:s}endIdIfNeeded(e=""){return e===C.END_NODE?(this.startEndCount++,`${C.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=nt){return e===C.END_NODE?C.END_TYPE:s}addRelationObjs(e,s,n=""){const r=this.startIdIfNeeded(e.id.trim()),u=this.startTypeIfNeeded(e.id.trim(),e.type),d=this.startIdIfNeeded(s.id.trim()),S=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(r,u,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(d,S,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:r,id2:d,relationTitle:g.SY.sanitizeText(n,(0,g.nV)())})}addRelation(e,s,n){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,n);else if(typeof e=="string"&&typeof s=="string"){const r=this.startIdIfNeeded(e.trim()),u=this.startTypeIfNeeded(e),d=this.endIdIfNeeded(s.trim()),S=this.endTypeIfNeeded(s);this.addState(r,u),this.addState(d,S),this.currentDocument.relations.push({id1:r,id2:d,relationTitle:n?g.SY.sanitizeText(n,(0,g.nV)()):void 0})}}addDescription(e,s){const n=this.currentDocument.states.get(e),r=s.startsWith(":")?s.replace(":","").trim():s;n?.descriptions?.push(g.SY.sanitizeText(r,(0,g.nV)()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});const n=this.classes.get(e);s&&n&&s.split(C.STYLECLASS_SEP).forEach(r=>{const u=r.replace(/([^;]*);/,"$1").trim();if(RegExp(C.COLOR_KEYWORD).exec(r)){const S=u.replace(C.FILL_KEYWORD,C.BG_FILL).replace(C.COLOR_KEYWORD,C.FILL_KEYWORD);n.textStyles.push(S)}n.styles.push(u)})}getClasses(){return this.classes}setCssClass(e,s){e.split(",").forEach(n=>{let r=this.getState(n);if(!r){const u=n.trim();this.addState(u),r=this.getState(u)}r?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===at)}getDirection(){return this.getDirectionStatement()?.value??rt}setDirection(e){const s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:at,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){const e=(0,g.nV)();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:Xt(this.getRootDocV2())}}getConfig(){return(0,g.nV)().state}},(0,a.eW)(H,"StateDB"),H.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},H),Ie=(0,a.eW)(t=>`
defs #statediagram-barbEnd {
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
  stroke-width: 1;
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: 1;
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
  stroke-width: 1px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: 1px;
}
#statediagram-barbEnd {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: 1px;
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

#dependencyStart, #dependencyEnd {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: 1;
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}
`,"getStyles"),Oe=Ie},73024:function(Bt,et,v){v.d(et,{j:function(){return it}});var st=v(98994),B=v(57099),it=(0,B.eW)((a,I,W,rt)=>{a.attr("class",W);const{width:F,height:at,x:G,y:V}=K(a,I);(0,st.v2)(a,at,F,rt);const Z=g(G,V,F,at,I);a.attr("viewBox",Z),B.cM.debug(`viewBox configured: ${Z} with padding: ${I}`)},"setupViewPortForSVG"),K=(0,B.eW)((a,I)=>{const W=a.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:W.width+I*2,height:W.height+I*2,x:W.x,y:W.y}},"calculateDimensionsWithPadding"),g=(0,B.eW)((a,I,W,rt,F)=>`${a-F} ${I-F} ${W} ${rt}`,"createViewBox")}}]);})();
