"use strict";(()=>{(self.webpackChunk=self.webpackChunk||[]).push([[695],{49881:function(Wt,st,L){L.d(st,{q:function(){return it}});var W=L(27246),j=L(15102),it=(0,W.eW)((H,s)=>{let D;return s==="sandbox"&&(D=(0,j.Ys)("#i"+H)),(s==="sandbox"?(0,j.Ys)(D.nodes()[0].contentDocument.body):(0,j.Ys)("body")).select(`[id="${H}"]`)},"getDiagramElement")},40695:function(Wt,st,L){var K;L.d(st,{Ee:function(){return Ie},J8:function(){return P},_$:function(){return ve},oI:function(){return xe}});var W=L(49881),j=L(31059),it=L(3152),H=L(11495),s=L(27246),D=function(){var t=(0,s.eW)(function(U,c,h,o){for(h=h||{},o=U.length;o--;h[U[o]]=c);return h},"o"),e=[1,2],i=[1,3],n=[1,4],a=[2,4],u=[1,9],d=[1,11],S=[1,16],f=[1,17],g=[1,18],T=[1,19],b=[1,33],x=[1,20],C=[1,21],p=[1,22],m=[1,23],N=[1,24],I=[1,26],$=[1,27],O=[1,28],M=[1,29],pt=[1,30],St=[1,31],yt=[1,32],_t=[1,35],gt=[1,36],Et=[1,37],Tt=[1,38],q=[1,34],y=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],bt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],ee=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],It={trace:(0,s.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:(0,s.eW)(function(c,h,o,_,E,r,lt){var l=r.length-1;switch(E){case 3:return _.setRootDoc(r[l]),r[l];break;case 4:this.$=[];break;case 5:r[l]!="nl"&&(r[l-1].push(r[l]),this.$=r[l-1]);break;case 6:case 7:this.$=r[l];break;case 8:this.$="nl";break;case 12:this.$=r[l];break;case 13:const mt=r[l-1];mt.description=_.trimColon(r[l]),this.$=mt;break;case 14:this.$={stmt:"relation",state1:r[l-2],state2:r[l]};break;case 15:const Dt=_.trimColon(r[l]);this.$={stmt:"relation",state1:r[l-3],state2:r[l-1],description:Dt};break;case 19:this.$={stmt:"state",id:r[l-3],type:"default",description:"",doc:r[l-1]};break;case 20:var z=r[l],tt=r[l-2].trim();if(r[l].match(":")){var ht=r[l].split(":");z=ht[0],tt=[tt,ht[1]]}this.$={stmt:"state",id:z,type:"default",description:tt};break;case 21:this.$={stmt:"state",id:r[l-3],type:"default",description:r[l-5],doc:r[l-1]};break;case 22:this.$={stmt:"state",id:r[l],type:"fork"};break;case 23:this.$={stmt:"state",id:r[l],type:"join"};break;case 24:this.$={stmt:"state",id:r[l],type:"choice"};break;case 25:this.$={stmt:"state",id:_.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:r[l-1].trim(),note:{position:r[l-2].trim(),text:r[l].trim()}};break;case 29:this.$=r[l].trim(),_.setAccTitle(this.$);break;case 30:case 31:this.$=r[l].trim(),_.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:r[l-3],url:r[l-2],tooltip:r[l-1]};break;case 33:this.$={stmt:"click",id:r[l-3],url:r[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:r[l-1].trim(),classes:r[l].trim()};break;case 36:this.$={stmt:"style",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 37:this.$={stmt:"applyClass",id:r[l-1].trim(),styleClass:r[l].trim()};break;case 38:_.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:_.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:_.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:_.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:r[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:r[l-2].trim(),classes:[r[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:i,6:n},{1:[3]},{3:5,4:e,5:i,6:n},{3:6,4:e,5:i,6:n},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],a,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:g,22:T,24:b,25:x,26:C,27:p,28:m,29:N,32:25,33:I,35:$,37:O,38:M,41:pt,45:St,48:yt,51:_t,52:gt,53:Et,54:Tt,57:q},t(y,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:f,19:g,22:T,24:b,25:x,26:C,27:p,28:m,29:N,32:25,33:I,35:$,37:O,38:M,41:pt,45:St,48:yt,51:_t,52:gt,53:Et,54:Tt,57:q},t(y,[2,7]),t(y,[2,8]),t(y,[2,9]),t(y,[2,10]),t(y,[2,11]),t(y,[2,12],{14:[1,40],15:[1,41]}),t(y,[2,16]),{18:[1,42]},t(y,[2,18],{20:[1,43]}),{23:[1,44]},t(y,[2,22]),t(y,[2,23]),t(y,[2,24]),t(y,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(y,[2,28]),{34:[1,49]},{36:[1,50]},t(y,[2,31]),{13:51,24:b,57:q},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(bt,[2,44],{58:[1,56]}),t(bt,[2,45],{58:[1,57]}),t(y,[2,38]),t(y,[2,39]),t(y,[2,40]),t(y,[2,41]),t(y,[2,6]),t(y,[2,13]),{13:58,24:b,57:q},t(y,[2,17]),t(ee,a,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(y,[2,29]),t(y,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(y,[2,14],{14:[1,71]}),{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:g,21:[1,72],22:T,24:b,25:x,26:C,27:p,28:m,29:N,32:25,33:I,35:$,37:O,38:M,41:pt,45:St,48:yt,51:_t,52:gt,53:Et,54:Tt,57:q},t(y,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(y,[2,34]),t(y,[2,35]),t(y,[2,36]),t(y,[2,37]),t(bt,[2,46]),t(bt,[2,47]),t(y,[2,15]),t(y,[2,19]),t(ee,a,{7:78}),t(y,[2,26]),t(y,[2,27]),{5:[1,79]},{5:[1,80]},{4:u,5:d,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:f,19:g,21:[1,81],22:T,24:b,25:x,26:C,27:p,28:m,29:N,32:25,33:I,35:$,37:O,38:M,41:pt,45:St,48:yt,51:_t,52:gt,53:Et,54:Tt,57:q},t(y,[2,32]),t(y,[2,33]),t(y,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:(0,s.eW)(function(c,h){if(h.recoverable)this.trace(c);else{var o=new Error(c);throw o.hash=h,o}},"parseError"),parse:(0,s.eW)(function(c){var h=this,o=[0],_=[],E=[null],r=[],lt=this.table,l="",z=0,tt=0,ht=0,mt=2,Dt=1,Re=r.slice.call(arguments,1),k=Object.create(this.lexer),X={yy:{}};for(var Ot in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Ot)&&(X.yy[Ot]=this.yy[Ot]);k.setInput(c,X.yy),X.yy.lexer=k,X.yy.parser=this,typeof k.yylloc>"u"&&(k.yylloc={});var Rt=k.yylloc;r.push(Rt);var Ne=k.options&&k.options.ranges;typeof X.yy.parseError=="function"?this.parseError=X.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function we(R){o.length=o.length-2*R,E.length=E.length-R,r.length=r.length-R}(0,s.eW)(we,"popStack");function se(){var R;return R=_.pop()||k.lex()||Dt,typeof R!="number"&&(R instanceof Array&&(_=R,R=_.pop()),R=h.symbols_[R]||R),R}(0,s.eW)(se,"lex");for(var A,Nt,J,w,Pe,wt,et={},vt,B,ie,Ct;;){if(J=o[o.length-1],this.defaultActions[J]?w=this.defaultActions[J]:((A===null||typeof A>"u")&&(A=se()),w=lt[J]&&lt[J][A]),typeof w>"u"||!w.length||!w[0]){var Pt="";Ct=[];for(vt in lt[J])this.terminals_[vt]&&vt>mt&&Ct.push("'"+this.terminals_[vt]+"'");k.showPosition?Pt="Parse error on line "+(z+1)+`:
`+k.showPosition()+`
Expecting `+Ct.join(", ")+", got '"+(this.terminals_[A]||A)+"'":Pt="Parse error on line "+(z+1)+": Unexpected "+(A==Dt?"end of input":"'"+(this.terminals_[A]||A)+"'"),this.parseError(Pt,{text:k.match,token:this.terminals_[A]||A,line:k.yylineno,loc:Rt,expected:Ct})}if(w[0]instanceof Array&&w.length>1)throw new Error("Parse Error: multiple actions possible at state: "+J+", token: "+A);switch(w[0]){case 1:o.push(A),E.push(k.yytext),r.push(k.yylloc),o.push(w[1]),A=null,Nt?(A=Nt,Nt=null):(tt=k.yyleng,l=k.yytext,z=k.yylineno,Rt=k.yylloc,ht>0&&ht--);break;case 2:if(B=this.productions_[w[1]][1],et.$=E[E.length-B],et._$={first_line:r[r.length-(B||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(B||1)].first_column,last_column:r[r.length-1].last_column},Ne&&(et._$.range=[r[r.length-(B||1)].range[0],r[r.length-1].range[1]]),wt=this.performAction.apply(et,[l,tt,z,X.yy,w[1],E,r].concat(Re)),typeof wt<"u")return wt;B&&(o=o.slice(0,-1*B*2),E=E.slice(0,-1*B),r=r.slice(0,-1*B)),o.push(this.productions_[w[1]][0]),E.push(et.$),r.push(et._$),ie=lt[o[o.length-2]][o[o.length-1]],o.push(ie);break;case 3:return!0}}return!0},"parse")},Oe=function(){var U={EOF:1,parseError:(0,s.eW)(function(h,o){if(this.yy.parser)this.yy.parser.parseError(h,o);else throw new Error(h)},"parseError"),setInput:(0,s.eW)(function(c,h){return this.yy=h||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,s.eW)(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var h=c.match(/(?:\r\n?|\n).*/g);return h?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:(0,s.eW)(function(c){var h=c.length,o=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-h),this.offset-=h;var _=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),o.length-1&&(this.yylineno-=o.length-1);var E=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:o?(o.length===_.length?this.yylloc.first_column:0)+_[_.length-o.length].length-o[0].length:this.yylloc.first_column-h},this.options.ranges&&(this.yylloc.range=[E[0],E[0]+this.yyleng-h]),this.yyleng=this.yytext.length,this},"unput"),more:(0,s.eW)(function(){return this._more=!0,this},"more"),reject:(0,s.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,s.eW)(function(c){this.unput(this.match.slice(c))},"less"),pastInput:(0,s.eW)(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,s.eW)(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,s.eW)(function(){var c=this.pastInput(),h=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+h+"^"},"showPosition"),test_match:(0,s.eW)(function(c,h){var o,_,E;if(this.options.backtrack_lexer&&(E={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(E.yylloc.range=this.yylloc.range.slice(0))),_=c[0].match(/(?:\r\n?|\n).*/g),_&&(this.yylineno+=_.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:_?_[_.length-1].length-_[_.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],o=this.performAction.call(this,this.yy,this,h,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),o)return o;if(this._backtrack){for(var r in E)this[r]=E[r];return!1}return!1},"test_match"),next:(0,s.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,h,o,_;this._more||(this.yytext="",this.match="");for(var E=this._currentRules(),r=0;r<E.length;r++)if(o=this._input.match(this.rules[E[r]]),o&&(!h||o[0].length>h[0].length)){if(h=o,_=r,this.options.backtrack_lexer){if(c=this.test_match(o,E[r]),c!==!1)return c;if(this._backtrack){h=!1;continue}else return!1}else if(!this.options.flex)break}return h?(c=this.test_match(h,E[_]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,s.eW)(function(){var h=this.next();return h||this.lex()},"lex"),begin:(0,s.eW)(function(h){this.conditionStack.push(h)},"begin"),popState:(0,s.eW)(function(){var h=this.conditionStack.length-1;return h>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,s.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,s.eW)(function(h){return h=this.conditionStack.length-1-Math.abs(h||0),h>=0?this.conditionStack[h]:"INITIAL"},"topState"),pushState:(0,s.eW)(function(h){this.begin(h)},"pushState"),stateStackSize:(0,s.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,s.eW)(function(h,o,_,E){var r=E;switch(_){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:break;case 9:break;case 10:return 5;case 11:break;case 12:break;case 13:break;case 14:break;case 15:return this.pushState("SCALE"),17;break;case 16:return 18;case 17:this.popState();break;case 18:return this.begin("acc_title"),33;break;case 19:return this.popState(),"acc_title_value";break;case 20:return this.begin("acc_descr"),35;break;case 21:return this.popState(),"acc_descr_value";break;case 22:this.begin("acc_descr_multiline");break;case 23:this.popState();break;case 24:return"acc_descr_multiline_value";case 25:return this.pushState("CLASSDEF"),41;break;case 26:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 27:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 28:return this.popState(),43;break;case 29:return this.pushState("CLASS"),48;break;case 30:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 31:return this.popState(),50;break;case 32:return this.pushState("STYLE"),45;break;case 33:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 34:return this.popState(),47;break;case 35:return this.pushState("SCALE"),17;break;case 36:return 18;case 37:this.popState();break;case 38:this.pushState("STATE");break;case 39:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),25;break;case 40:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),26;break;case 41:return this.popState(),o.yytext=o.yytext.slice(0,-10).trim(),27;break;case 42:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),25;break;case 43:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),26;break;case 44:return this.popState(),o.yytext=o.yytext.slice(0,-10).trim(),27;break;case 45:return 51;case 46:return 52;case 47:return 53;case 48:return 54;case 49:this.pushState("STATE_STRING");break;case 50:return this.pushState("STATE_ID"),"AS";break;case 51:return this.popState(),"ID";break;case 52:this.popState();break;case 53:return"STATE_DESCR";case 54:return 19;case 55:this.popState();break;case 56:return this.popState(),this.pushState("struct"),20;break;case 57:break;case 58:return this.popState(),21;break;case 59:break;case 60:return this.begin("NOTE"),29;break;case 61:return this.popState(),this.pushState("NOTE_ID"),59;break;case 62:return this.popState(),this.pushState("NOTE_ID"),60;break;case 63:this.popState(),this.pushState("FLOATING_NOTE");break;case 64:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 65:break;case 66:return"NOTE_TEXT";case 67:return this.popState(),"ID";break;case 68:return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 69:return this.popState(),o.yytext=o.yytext.substr(2).trim(),31;break;case 70:return this.popState(),o.yytext=o.yytext.slice(0,-8).trim(),31;break;case 71:return 6;case 72:return 6;case 73:return 16;case 74:return 57;case 75:return 24;case 76:return o.yytext=o.yytext.trim(),14;break;case 77:return 15;case 78:return 28;case 79:return 58;case 80:return 5;case 81:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[12,13],inclusive:!1},struct:{rules:[12,13,25,29,32,38,45,46,47,48,57,58,59,60,74,75,76,77,78],inclusive:!1},FLOATING_NOTE_ID:{rules:[67],inclusive:!1},FLOATING_NOTE:{rules:[64,65,66],inclusive:!1},NOTE_TEXT:{rules:[69,70],inclusive:!1},NOTE_ID:{rules:[68],inclusive:!1},NOTE:{rules:[61,62,63],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[34],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[33],inclusive:!1},CLASS_STYLE:{rules:[31],inclusive:!1},CLASS:{rules:[30],inclusive:!1},CLASSDEFID:{rules:[28],inclusive:!1},CLASSDEF:{rules:[26,27],inclusive:!1},acc_descr_multiline:{rules:[23,24],inclusive:!1},acc_descr:{rules:[21],inclusive:!1},acc_title:{rules:[19],inclusive:!1},SCALE:{rules:[16,17,36,37],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[51],inclusive:!1},STATE_STRING:{rules:[52,53],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[12,13,39,40,41,42,43,44,49,50,54,55,56],inclusive:!1},ID:{rules:[12,13],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,18,20,22,25,29,32,35,38,56,60,71,72,73,74,75,76,77,79,80,81],inclusive:!0}}};return U}();It.lexer=Oe;function kt(){this.yy={}}return(0,s.eW)(kt,"Parser"),kt.prototype=It,It.Parser=kt,new kt}();D.parser=D;var P=D,Q="TB",Y="TB",rt="dir",F="state",V="root",Z="relation",re="classDef",ae="style",ne="applyClass",at="default",$t="divider",Mt="fill:none",Bt="fill: #333",Yt="c",Ft="text",Vt="normal",At="rect",xt="rectWithTitle",oe="stateStart",ce="stateEnd",Gt="divider",Ut="roundedWithTitle",le="note",he="noteGroup",nt="statediagram",ue="state",de=`${nt}-${ue}`,jt="transition",fe="note",pe="note-edge",Se=`${jt} ${pe}`,ye=`${nt}-${fe}`,_e="cluster",ge=`${nt}-${_e}`,Ee="cluster-alt",Te=`${nt}-${Ee}`,Ht="parent",Kt="note",be="state",Lt="----",ke=`${Lt}${Kt}`,zt=`${Lt}${Ht}`,Xt=(0,s.eW)((t,e=Y)=>{if(!t.doc)return e;let i=e;for(const n of t.doc)n.stmt==="dir"&&(i=n.value);return i},"getDir"),me=(0,s.eW)(function(t,e){return e.db.getClasses()},"getClasses"),De=(0,s.eW)(async function(t,e,i,n){s.cM.info("REF0:"),s.cM.info("Drawing state diagram (v2)",e);const{securityLevel:a,state:u,layout:d}=(0,s.nV)();n.db.extract(n.db.getRootDocV2());const S=n.db.getData(),f=(0,W.q)(e,a);S.type=n.type,S.layoutAlgorithm=d,S.nodeSpacing=u?.nodeSpacing||50,S.rankSpacing=u?.rankSpacing||50,S.markers=["barb"],S.diagramId=e,await(0,it.sY)(S,f);const g=8;try{(typeof n.db.getLinks=="function"?n.db.getLinks():new Map).forEach((b,x)=>{const C=typeof x=="string"?x:typeof x?.id=="string"?x.id:"";if(!C){s.cM.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(x));return}const p=f.node()?.querySelectorAll("g");let m;if(p?.forEach(O=>{O.textContent?.trim()===C&&(m=O)}),!m){s.cM.warn("\u26A0\uFE0F Could not find node matching text:",C);return}const N=m.parentNode;if(!N){s.cM.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",C);return}const I=document.createElementNS("http://www.w3.org/2000/svg","a"),$=b.url.replace(/^"+|"+$/g,"");if(I.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",$),I.setAttribute("target","_blank"),b.tooltip){const O=b.tooltip.replace(/^"+|"+$/g,"");I.setAttribute("title",O)}N.replaceChild(I,m),I.appendChild(m),s.cM.info("\u{1F517} Wrapped node in <a> tag for:",C,b.url)})}catch(T){s.cM.error("\u274C Error injecting clickable links:",T)}H.w8.insertTitle(f,"statediagramTitleText",u?.titleTopMargin??25,n.db.getDiagramTitle()),(0,j.j)(f,g,nt,u?.useMaxWidth??!0)},"draw"),ve={getClasses:me,draw:De,getDir:Xt},ut=new Map,G=0;function dt(t="",e=0,i="",n=Lt){const a=i!==null&&i.length>0?`${n}${i}`:"";return`${be}-${t}${a}-${e}`}(0,s.eW)(dt,"stateDomId");var Ce=(0,s.eW)((t,e,i,n,a,u,d,S)=>{s.cM.trace("items",e),e.forEach(f=>{switch(f.stmt){case F:ct(t,f,i,n,a,u,d,S);break;case at:ct(t,f,i,n,a,u,d,S);break;case Z:{ct(t,f.state1,i,n,a,u,d,S),ct(t,f.state2,i,n,a,u,d,S);const g={id:"edge"+G,start:f.state1.id,end:f.state2.id,arrowhead:"normal",arrowTypeEnd:"arrow_barb",style:Mt,labelStyle:"",label:s.SY.sanitizeText(f.description??"",(0,s.nV)()),arrowheadStyle:Bt,labelpos:Yt,labelType:Ft,thickness:Vt,classes:jt,look:d};a.push(g),G++}break}})},"setupDoc"),Jt=(0,s.eW)((t,e=Y)=>{let i=e;if(t.doc)for(const n of t.doc)n.stmt==="dir"&&(i=n.value);return i},"getDir");function ot(t,e,i){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(a=>{const u=i.get(a);u&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...u.styles])}));const n=t.find(a=>a.id===e.id);n?Object.assign(n,e):t.push(e)}(0,s.eW)(ot,"insertOrUpdateNode");function Qt(t){return t?.classes?.join(" ")??""}(0,s.eW)(Qt,"getClassesFromDbInfo");function Zt(t){return t?.styles??[]}(0,s.eW)(Zt,"getStylesFromDbInfo");var ct=(0,s.eW)((t,e,i,n,a,u,d,S)=>{const f=e.id,g=i.get(f),T=Qt(g),b=Zt(g),x=(0,s.nV)();if(s.cM.info("dataFetcher parsedItem",e,g,b),f!=="root"){let C=At;e.start===!0?C=oe:e.start===!1&&(C=ce),e.type!==at&&(C=e.type),ut.get(f)||ut.set(f,{id:f,shape:C,description:s.SY.sanitizeText(f,x),cssClasses:`${T} ${de}`,cssStyles:b});const p=ut.get(f);e.description&&(Array.isArray(p.description)?(p.shape=xt,p.description.push(e.description)):p.description?.length&&p.description.length>0?(p.shape=xt,p.description===f?p.description=[e.description]:p.description=[p.description,e.description]):(p.shape=At,p.description=e.description),p.description=s.SY.sanitizeTextOrArray(p.description,x)),p.description?.length===1&&p.shape===xt&&(p.type==="group"?p.shape=Ut:p.shape=At),!p.type&&e.doc&&(s.cM.info("Setting cluster for XCX",f,Jt(e)),p.type="group",p.isGroup=!0,p.dir=Jt(e),p.shape=e.type===$t?Gt:Ut,p.cssClasses=`${p.cssClasses} ${ge} ${u?Te:""}`);const m={labelStyle:"",shape:p.shape,label:p.description,cssClasses:p.cssClasses,cssCompiledStyles:[],cssStyles:p.cssStyles,id:f,dir:p.dir,domId:dt(f,G),type:p.type,isGroup:p.type==="group",padding:8,rx:10,ry:10,look:d};if(m.shape===Gt&&(m.label=""),t&&t.id!=="root"&&(s.cM.trace("Setting node ",f," to be child of its parent ",t.id),m.parentId=t.id),m.centerLabel=!0,e.note){const N={labelStyle:"",shape:le,label:e.note.text,cssClasses:ye,cssStyles:[],cssCompiledStyles:[],id:f+ke+"-"+G,domId:dt(f,G,Kt),type:p.type,isGroup:p.type==="group",padding:x.flowchart?.padding,look:d,position:e.note.position},I=f+zt,$={labelStyle:"",shape:he,label:e.note.text,cssClasses:p.cssClasses,cssStyles:[],id:f+zt,domId:dt(f,G,Ht),type:"group",isGroup:!0,padding:16,look:d,position:e.note.position};G++,$.id=I,N.parentId=I,ot(n,$,S),ot(n,N,S),ot(n,m,S);let O=f,M=N.id;e.note.position==="left of"&&(O=N.id,M=f),a.push({id:O+"-"+M,start:O,end:M,arrowhead:"none",arrowTypeEnd:"",style:Mt,labelStyle:"",classes:Se,arrowheadStyle:Bt,labelpos:Yt,labelType:Ft,thickness:Vt,look:d})}else ot(n,m,S)}e.doc&&(s.cM.trace("Adding nodes children "),Ce(e,e.doc,i,n,a,!u,d,S))},"dataFetcher"),Ae=(0,s.eW)(()=>{ut.clear(),G=0},"reset"),v={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},qt=(0,s.eW)(()=>new Map,"newClassesList"),te=(0,s.eW)(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),ft=(0,s.eW)(t=>JSON.parse(JSON.stringify(t)),"clone"),xe=(K=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=qt(),this.documents={root:te()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=s.eu,this.setAccTitle=s.GN,this.getAccDescription=s.Mx,this.setAccDescription=s.U$,this.setDiagramTitle=s.g2,this.getDiagramTitle=s.Kr,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(e){this.clear(!0);for(const a of Array.isArray(e)?e:e.doc)switch(a.stmt){case F:this.addState(a.id.trim(),a.type,a.doc,a.description,a.note);break;case Z:this.addRelation(a.state1,a.state2,a.description);break;case re:this.addStyleClass(a.id.trim(),a.classes);break;case ae:this.handleStyleDef(a);break;case ne:this.setCssClass(a.id.trim(),a.styleClass);break;case"click":this.addLink(a.id,a.url,a.tooltip);break}const i=this.getStates(),n=(0,s.nV)();Ae(),ct(void 0,this.getRootDocV2(),i,this.nodes,this.edges,!0,n.look,this.classes);for(const a of this.nodes)if(Array.isArray(a.label)){if(a.description=a.label.slice(1),a.isGroup&&a.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${a.id}]`);a.label=a.label[0]}}handleStyleDef(e){const i=e.id.trim().split(","),n=e.styleClass.split(",");for(const a of i){let u=this.getState(a);if(!u){const d=a.trim();this.addState(d),u=this.getState(d)}u&&(u.styles=n.map(d=>d.replace(/;/g,"")?.trim()))}}setRootDoc(e){s.cM.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,i,n){if(i.stmt===Z){this.docTranslator(e,i.state1,!0),this.docTranslator(e,i.state2,!1);return}if(i.stmt===F&&(i.id===v.START_NODE?(i.id=e.id+(n?"_start":"_end"),i.start=n):i.id=i.id.trim()),i.stmt!==V&&i.stmt!==F||!i.doc)return;const a=[];let u=[];for(const d of i.doc)if(d.type===$t){const S=ft(d);S.doc=ft(u),a.push(S),u=[]}else u.push(d);if(a.length>0&&u.length>0){const d={stmt:F,id:(0,H.Ox)(),type:"divider",doc:ft(u)};a.push(ft(d)),i.doc=a}i.doc.forEach(d=>this.docTranslator(i,d,!0))}getRootDocV2(){return this.docTranslator({id:V,stmt:V},{id:V,stmt:V,doc:this.rootDoc},!0),{id:V,doc:this.rootDoc}}addState(e,i=at,n=void 0,a=void 0,u=void 0,d=void 0,S=void 0,f=void 0){const g=e?.trim();if(!this.currentDocument.states.has(g))s.cM.info("Adding state ",g,a),this.currentDocument.states.set(g,{stmt:F,id:g,descriptions:[],type:i,doc:n,note:u,classes:[],styles:[],textStyles:[]});else{const T=this.currentDocument.states.get(g);if(!T)throw new Error(`State not found: ${g}`);T.doc||(T.doc=n),T.type||(T.type=i)}if(a&&(s.cM.info("Setting state description",g,a),(Array.isArray(a)?a:[a]).forEach(b=>this.addDescription(g,b.trim()))),u){const T=this.currentDocument.states.get(g);if(!T)throw new Error(`State not found: ${g}`);T.note=u,T.note.text=s.SY.sanitizeText(T.note.text,(0,s.nV)())}d&&(s.cM.info("Setting state classes",g,d),(Array.isArray(d)?d:[d]).forEach(b=>this.setCssClass(g,b.trim()))),S&&(s.cM.info("Setting state styles",g,S),(Array.isArray(S)?S:[S]).forEach(b=>this.setStyle(g,b.trim()))),f&&(s.cM.info("Setting state styles",g,S),(Array.isArray(f)?f:[f]).forEach(b=>this.setTextStyle(g,b.trim())))}clear(e){this.nodes=[],this.edges=[],this.documents={root:te()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=qt(),e||(this.links=new Map,(0,s.ZH)())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){s.cM.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,i,n){this.links.set(e,{url:i,tooltip:n}),s.cM.warn("Adding link",e,i,n)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===v.START_NODE?(this.startEndCount++,`${v.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",i=at){return e===v.START_NODE?v.START_TYPE:i}endIdIfNeeded(e=""){return e===v.END_NODE?(this.startEndCount++,`${v.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",i=at){return e===v.END_NODE?v.END_TYPE:i}addRelationObjs(e,i,n=""){const a=this.startIdIfNeeded(e.id.trim()),u=this.startTypeIfNeeded(e.id.trim(),e.type),d=this.startIdIfNeeded(i.id.trim()),S=this.startTypeIfNeeded(i.id.trim(),i.type);this.addState(a,u,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(d,S,i.doc,i.description,i.note,i.classes,i.styles,i.textStyles),this.currentDocument.relations.push({id1:a,id2:d,relationTitle:s.SY.sanitizeText(n,(0,s.nV)())})}addRelation(e,i,n){if(typeof e=="object"&&typeof i=="object")this.addRelationObjs(e,i,n);else if(typeof e=="string"&&typeof i=="string"){const a=this.startIdIfNeeded(e.trim()),u=this.startTypeIfNeeded(e),d=this.endIdIfNeeded(i.trim()),S=this.endTypeIfNeeded(i);this.addState(a,u),this.addState(d,S),this.currentDocument.relations.push({id1:a,id2:d,relationTitle:n?s.SY.sanitizeText(n,(0,s.nV)()):void 0})}}addDescription(e,i){const n=this.currentDocument.states.get(e),a=i.startsWith(":")?i.replace(":","").trim():i;n?.descriptions?.push(s.SY.sanitizeText(a,(0,s.nV)()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,i=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});const n=this.classes.get(e);i&&n&&i.split(v.STYLECLASS_SEP).forEach(a=>{const u=a.replace(/([^;]*);/,"$1").trim();if(RegExp(v.COLOR_KEYWORD).exec(a)){const S=u.replace(v.FILL_KEYWORD,v.BG_FILL).replace(v.COLOR_KEYWORD,v.FILL_KEYWORD);n.textStyles.push(S)}n.styles.push(u)})}getClasses(){return this.classes}setCssClass(e,i){e.split(",").forEach(n=>{let a=this.getState(n);if(!a){const u=n.trim();this.addState(u),a=this.getState(u)}a?.classes?.push(i)})}setStyle(e,i){this.getState(e)?.styles?.push(i)}setTextStyle(e,i){this.getState(e)?.textStyles?.push(i)}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===rt)}getDirection(){return this.getDirectionStatement()?.value??Q}setDirection(e){const i=this.getDirectionStatement();i?i.value=e:this.rootDoc.unshift({stmt:rt,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){const e=(0,s.nV)();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:Xt(this.getRootDocV2())}}getConfig(){return(0,s.nV)().state}},(0,s.eW)(K,"StateDB"),K.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},K),Le=(0,s.eW)(t=>`
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
`,"getStyles"),Ie=Le},31059:function(Wt,st,L){L.d(st,{j:function(){return j}});var W=L(27246),j=(0,W.eW)((s,D,P,Q)=>{s.attr("class",P);const{width:Y,height:rt,x:F,y:V}=it(s,D);(0,W.v2)(s,rt,Y,Q);const Z=H(F,V,Y,rt,D);s.attr("viewBox",Z),W.cM.debug(`viewBox configured: ${Z} with padding: ${D}`)},"setupViewPortForSVG"),it=(0,W.eW)((s,D)=>{const P=s.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:P.width+D*2,height:P.height+D*2,x:P.x,y:P.y}},"calculateDimensionsWithPadding"),H=(0,W.eW)((s,D,P,Q,Y)=>`${s-Y} ${D-Y} ${P} ${Q}`,"createViewBox")}}]);})();
