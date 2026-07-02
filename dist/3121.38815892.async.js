"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[3121],{62801:function(Rt,et,k){k.d(et,{AD:function(){return U},AE:function(){return o},Mu:function(){return K},N6:function(){return lt},O:function(){return g},kc:function(){return rt},rB:function(){return P},yU:function(){return E}});var st=k(90687),I=k(69849),j=k(12657),X=k(40396),K=(0,I.e)((A,y)=>{const b=A.append("rect");if(b.attr("x",y.x),b.attr("y",y.y),b.attr("fill",y.fill),b.attr("stroke",y.stroke),b.attr("width",y.width),b.attr("height",y.height),y.name&&b.attr("name",y.name),y.rx&&b.attr("rx",y.rx),y.ry&&b.attr("ry",y.ry),y.attrs!==void 0)for(const x in y.attrs)b.attr(x,y.attrs[x]);return y.class&&b.attr("class",y.class),b},"drawRect"),g=(0,I.e)((A,y)=>{const b={x:y.startx,y:y.starty,width:y.stopx-y.startx,height:y.stopy-y.starty,fill:y.fill,stroke:y.stroke,class:"rect"};K(A,b).lower()},"drawBackgroundRect"),E=(0,I.e)((A,y)=>{const b=y.text.replace(st.Vw," "),x=A.append("text");x.attr("x",y.x),x.attr("y",y.y),x.attr("class","legend"),x.style("text-anchor",y.anchor),y.class&&x.attr("class",y.class);const O=x.append("tspan");return O.attr("x",y.x+y.textMargin*2),O.text(b),x},"drawText"),o=(0,I.e)((A,y,b,x)=>{const O=A.append("image");O.attr("x",y),O.attr("y",b);const it=(0,j.N)(x);O.attr("xlink:href",it)},"drawImage"),P=(0,I.e)((A,y,b,x)=>{const O=A.append("use");O.attr("x",y),O.attr("y",b);const it=(0,j.N)(x);O.attr("xlink:href",`#${it}`)},"drawEmbeddedImage"),rt=(0,I.e)(()=>({x:0,y:0,width:100,height:100,fill:"#EDF2AE",stroke:"#666",anchor:"start",rx:0,ry:0}),"getNoteRect"),U=(0,I.e)(()=>({x:0,y:0,width:100,height:100,"text-anchor":"start",style:"#666",textMargin:0,rx:0,ry:0,tspan:!0}),"getTextObj"),lt=(0,I.e)(()=>{let A=(0,X.Ys)(".mermaidTooltip");return A.empty()&&(A=(0,X.Ys)("body").append("div").attr("class","mermaidTooltip").style("opacity",0).style("position","absolute").style("text-align","center").style("max-width","200px").style("padding","2px").style("font-size","12px").style("background","#ffffde").style("border","1px solid #333").style("border-radius","2px").style("pointer-events","none").style("z-index","100")),A},"createTooltip")},93121:function(Rt,et,k){var at;k.d(et,{Ee:function(){return Pe},J8:function(){return lt},_$:function(){return Oe},oI:function(){return we}});var st=k(77209),I=k(31188),j=k(71673),X=k(62801),K=k(79655),g=k(90687),E=k(7004),o=k(69849),P=k(40396),rt=k(90432),U=function(){var t=(0,o.e)(function(tt,l,u,a){for(u=u||{},a=tt.length;a--;u[tt[a]]=l);return u},"o"),e=[1,2],s=[1,3],n=[1,4],i=[2,4],h=[1,9],f=[1,11],S=[1,16],p=[1,17],m=[1,18],D=[1,19],C=[1,33],Y=[1,20],w=[1,21],d=[1,22],M=[1,23],F=[1,24],$=[1,26],z=[1,27],B=[1,28],H=[1,29],V=[1,30],ct=[1,31],mt=[1,32],kt=[1,35],bt=[1,36],vt=[1,37],Dt=[1,38],ht=[1,34],_=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],xt=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],ne=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],$t={trace:(0,o.e)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:(0,o.e)(function(l,u,a,T,v,r,dt){var c=r.length-1;switch(v){case 3:return T.setRootDoc(r[c]),r[c];break;case 4:this.$=[];break;case 5:r[c]!="nl"&&(r[c-1].push(r[c]),this.$=r[c-1]);break;case 6:case 7:this.$=r[c];break;case 8:this.$="nl";break;case 12:this.$=r[c];break;case 13:const At=r[c-1];At.description=T.trimColon(r[c]),this.$=At;break;case 14:this.$={stmt:"relation",state1:r[c-2],state2:r[c]};break;case 15:const Lt=T.trimColon(r[c]);this.$={stmt:"relation",state1:r[c-3],state2:r[c-1],description:Lt};break;case 19:this.$={stmt:"state",id:r[c-3],type:"default",description:"",doc:r[c-1]};break;case 20:var J=r[c],Z=r[c-2].trim();if(r[c].match(":")){var _t=r[c].split(":");J=_t[0],Z=[Z,_t[1]]}this.$={stmt:"state",id:J,type:"default",description:Z};break;case 21:this.$={stmt:"state",id:r[c-3],type:"default",description:r[c-5],doc:r[c-1]};break;case 22:this.$={stmt:"state",id:r[c],type:"fork"};break;case 23:this.$={stmt:"state",id:r[c],type:"join"};break;case 24:this.$={stmt:"state",id:r[c],type:"choice"};break;case 25:this.$={stmt:"state",id:T.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:r[c-1].trim(),note:{position:r[c-2].trim(),text:r[c].trim()}};break;case 29:this.$=r[c].trim(),T.setAccTitle(this.$);break;case 30:case 31:this.$=r[c].trim(),T.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:r[c-3],url:r[c-2],tooltip:r[c-1]};break;case 33:this.$={stmt:"click",id:r[c-3],url:r[c-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:r[c-1].trim(),classes:r[c].trim()};break;case 36:this.$={stmt:"style",id:r[c-1].trim(),styleClass:r[c].trim()};break;case 37:this.$={stmt:"applyClass",id:r[c-1].trim(),styleClass:r[c].trim()};break;case 38:T.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:T.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:T.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:T.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:r[c].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:r[c-2].trim(),classes:[r[c].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:r[c-2].trim(),classes:[r[c].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:n},{1:[3]},{3:5,4:e,5:s,6:n},{3:6,4:e,5:s,6:n},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],i,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:h,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:m,22:D,24:C,25:Y,26:w,27:d,28:M,29:F,32:25,33:$,35:z,37:B,38:H,41:V,45:ct,48:mt,51:kt,52:bt,53:vt,54:Dt,57:ht},t(_,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:S,17:p,19:m,22:D,24:C,25:Y,26:w,27:d,28:M,29:F,32:25,33:$,35:z,37:B,38:H,41:V,45:ct,48:mt,51:kt,52:bt,53:vt,54:Dt,57:ht},t(_,[2,7]),t(_,[2,8]),t(_,[2,9]),t(_,[2,10]),t(_,[2,11]),t(_,[2,12],{14:[1,40],15:[1,41]}),t(_,[2,16]),{18:[1,42]},t(_,[2,18],{20:[1,43]}),{23:[1,44]},t(_,[2,22]),t(_,[2,23]),t(_,[2,24]),t(_,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(_,[2,28]),{34:[1,49]},{36:[1,50]},t(_,[2,31]),{13:51,24:C,57:ht},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(xt,[2,44],{58:[1,56]}),t(xt,[2,45],{58:[1,57]}),t(_,[2,38]),t(_,[2,39]),t(_,[2,40]),t(_,[2,41]),t(_,[2,6]),t(_,[2,13]),{13:58,24:C,57:ht},t(_,[2,17]),t(ne,i,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(_,[2,29]),t(_,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(_,[2,14],{14:[1,71]}),{4:h,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:m,21:[1,72],22:D,24:C,25:Y,26:w,27:d,28:M,29:F,32:25,33:$,35:z,37:B,38:H,41:V,45:ct,48:mt,51:kt,52:bt,53:vt,54:Dt,57:ht},t(_,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(_,[2,34]),t(_,[2,35]),t(_,[2,36]),t(_,[2,37]),t(xt,[2,46]),t(xt,[2,47]),t(_,[2,15]),t(_,[2,19]),t(ne,i,{7:78}),t(_,[2,26]),t(_,[2,27]),{5:[1,79]},{5:[1,80]},{4:h,5:f,8:8,9:10,10:12,11:13,12:14,13:15,16:S,17:p,19:m,21:[1,81],22:D,24:C,25:Y,26:w,27:d,28:M,29:F,32:25,33:$,35:z,37:B,38:H,41:V,45:ct,48:mt,51:kt,52:bt,53:vt,54:Dt,57:ht},t(_,[2,32]),t(_,[2,33]),t(_,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:(0,o.e)(function(l,u){if(u.recoverable)this.trace(l);else{var a=new Error(l);throw a.hash=u,a}},"parseError"),parse:(0,o.e)(function(l){var u=this,a=[0],T=[],v=[null],r=[],dt=this.table,c="",J=0,Z=0,_t=0,At=2,Lt=1,Be=r.slice.call(arguments,1),L=Object.create(this.lexer),nt={yy:{}};for(var Bt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Bt)&&(nt.yy[Bt]=this.yy[Bt]);L.setInput(l,nt.yy),nt.yy.lexer=L,nt.yy.parser=this,typeof L.yylloc>"u"&&(L.yylloc={});var Yt=L.yylloc;r.push(Yt);var Ye=L.options&&L.options.ranges;typeof nt.yy.parseError=="function"?this.parseError=nt.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Me(G){a.length=a.length-2*G,v.length=v.length-G,r.length=r.length-G}(0,o.e)(Me,"popStack");function oe(){var G;return G=T.pop()||L.lex()||Lt,typeof G!="number"&&(G instanceof Array&&(T=G,G=T.pop()),G=u.symbols_[G]||G),G}(0,o.e)(oe,"lex");for(var N,Mt,ot,W,Fe,Ft,ut={},Ot,Q,le,It;;){if(ot=a[a.length-1],this.defaultActions[ot]?W=this.defaultActions[ot]:((N===null||typeof N>"u")&&(N=oe()),W=dt[ot]&&dt[ot][N]),typeof W>"u"||!W.length||!W[0]){var Vt="";It=[];for(Ot in dt[ot])this.terminals_[Ot]&&Ot>At&&It.push("'"+this.terminals_[Ot]+"'");L.showPosition?Vt="Parse error on line "+(J+1)+`:
`+L.showPosition()+`
Expecting `+It.join(", ")+", got '"+(this.terminals_[N]||N)+"'":Vt="Parse error on line "+(J+1)+": Unexpected "+(N==Lt?"end of input":"'"+(this.terminals_[N]||N)+"'"),this.parseError(Vt,{text:L.match,token:this.terminals_[N]||N,line:L.yylineno,loc:Yt,expected:It})}if(W[0]instanceof Array&&W.length>1)throw new Error("Parse Error: multiple actions possible at state: "+ot+", token: "+N);switch(W[0]){case 1:a.push(N),v.push(L.yytext),r.push(L.yylloc),a.push(W[1]),N=null,Mt?(N=Mt,Mt=null):(Z=L.yyleng,c=L.yytext,J=L.yylineno,Yt=L.yylloc,_t>0&&_t--);break;case 2:if(Q=this.productions_[W[1]][1],ut.$=v[v.length-Q],ut._$={first_line:r[r.length-(Q||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(Q||1)].first_column,last_column:r[r.length-1].last_column},Ye&&(ut._$.range=[r[r.length-(Q||1)].range[0],r[r.length-1].range[1]]),Ft=this.performAction.apply(ut,[c,Z,J,nt.yy,W[1],v,r].concat(Be)),typeof Ft<"u")return Ft;Q&&(a=a.slice(0,-1*Q*2),v=v.slice(0,-1*Q),r=r.slice(0,-1*Q)),a.push(this.productions_[W[1]][0]),v.push(ut.$),r.push(ut._$),le=dt[a[a.length-2]][a[a.length-1]],a.push(le);break;case 3:return!0}}return!0},"parse")},$e=function(){var tt={EOF:1,parseError:(0,o.e)(function(u,a){if(this.yy.parser)this.yy.parser.parseError(u,a);else throw new Error(u)},"parseError"),setInput:(0,o.e)(function(l,u){return this.yy=u||this.yy||{},this._input=l,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,o.e)(function(){var l=this._input[0];this.yytext+=l,this.yyleng++,this.offset++,this.match+=l,this.matched+=l;var u=l.match(/(?:\r\n?|\n).*/g);return u?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),l},"input"),unput:(0,o.e)(function(l){var u=l.length,a=l.split(/(?:\r\n?|\n)/g);this._input=l+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-u),this.offset-=u;var T=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),a.length-1&&(this.yylineno-=a.length-1);var v=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:a?(a.length===T.length?this.yylloc.first_column:0)+T[T.length-a.length].length-a[0].length:this.yylloc.first_column-u},this.options.ranges&&(this.yylloc.range=[v[0],v[0]+this.yyleng-u]),this.yyleng=this.yytext.length,this},"unput"),more:(0,o.e)(function(){return this._more=!0,this},"more"),reject:(0,o.e)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,o.e)(function(l){this.unput(this.match.slice(l))},"less"),pastInput:(0,o.e)(function(){var l=this.matched.substr(0,this.matched.length-this.match.length);return(l.length>20?"...":"")+l.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,o.e)(function(){var l=this.match;return l.length<20&&(l+=this._input.substr(0,20-l.length)),(l.substr(0,20)+(l.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,o.e)(function(){var l=this.pastInput(),u=new Array(l.length+1).join("-");return l+this.upcomingInput()+`
`+u+"^"},"showPosition"),test_match:(0,o.e)(function(l,u){var a,T,v;if(this.options.backtrack_lexer&&(v={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(v.yylloc.range=this.yylloc.range.slice(0))),T=l[0].match(/(?:\r\n?|\n).*/g),T&&(this.yylineno+=T.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:T?T[T.length-1].length-T[T.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+l[0].length},this.yytext+=l[0],this.match+=l[0],this.matches=l,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(l[0].length),this.matched+=l[0],a=this.performAction.call(this,this.yy,this,u,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),a)return a;if(this._backtrack){for(var r in v)this[r]=v[r];return!1}return!1},"test_match"),next:(0,o.e)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var l,u,a,T;this._more||(this.yytext="",this.match="");for(var v=this._currentRules(),r=0;r<v.length;r++)if(a=this._input.match(this.rules[v[r]]),a&&(!u||a[0].length>u[0].length)){if(u=a,T=r,this.options.backtrack_lexer){if(l=this.test_match(a,v[r]),l!==!1)return l;if(this._backtrack){u=!1;continue}else return!1}else if(!this.options.flex)break}return u?(l=this.test_match(u,v[T]),l!==!1?l:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,o.e)(function(){var u=this.next();return u||this.lex()},"lex"),begin:(0,o.e)(function(u){this.conditionStack.push(u)},"begin"),popState:(0,o.e)(function(){var u=this.conditionStack.length-1;return u>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,o.e)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,o.e)(function(u){return u=this.conditionStack.length-1-Math.abs(u||0),u>=0?this.conditionStack[u]:"INITIAL"},"topState"),pushState:(0,o.e)(function(u){this.begin(u)},"pushState"),stateStackSize:(0,o.e)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,o.e)(function(u,a,T,v){function r(){const c=a.yytext.indexOf("%%");if(c===0)return!1;if(c>0){const J=a.yytext.slice(0,c),Z=a.yytext.slice(c);Z&&u.lexer.unput(Z),a.yytext=J}return!0}(0,o.e)(r,"processId");var dt=v;switch(T){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;break;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;break;case 17:return this.popState(),"acc_title_value";break;case 18:return this.begin("acc_descr"),35;break;case 19:return this.popState(),"acc_descr_value";break;case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;break;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 25:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 26:return this.popState(),43;break;case 27:return this.pushState("CLASS"),48;break;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 29:return this.popState(),50;break;case 30:return this.pushState("STYLE"),45;break;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 32:return this.popState(),47;break;case 33:return this.pushState("SCALE"),17;break;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;break;case 38:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;break;case 39:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;break;case 40:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;break;case 41:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;break;case 42:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;break;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";break;case 49:if(!r())return;return this.popState(),"ID";break;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:throw new Error('Error: State name must be a single word. Found: "'+a.yytext.trim()+'"');case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState("struct"),20;break;case 56:return this.popState(),21;break;case 57:break;case 58:return this.begin("NOTE"),29;break;case 59:return this.popState(),this.pushState("NOTE_ID"),59;break;case 60:return this.popState(),this.pushState("NOTE_ID"),60;break;case 61:this.popState(),this.pushState("FLOATING_NOTE");break;case 62:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 63:break;case 64:return"NOTE_TEXT";case 65:if(!r())return;return this.popState(),"ID";break;case 66:if(!r())return;return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 67:return this.popState(),a.yytext=a.yytext.substr(2).trim(),31;break;case 68:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),31;break;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:return r()?24:void 0;case 74:return a.yytext=a.yytext.trim(),14;break;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}};return tt}();$t.lexer=$e;function Ct(){this.yy={}}return(0,o.e)(Ct,"Parser"),Ct.prototype=$t,$t.Parser=Ct,new Ct}();U.parser=U;var lt=U,A="TB",y="TB",b="dir",x="state",O="root",it="relation",ce="classDef",he="style",de="applyClass",ft="default",Gt="divider",Wt="fill:none",Ut="fill: #333",jt="c",Kt="markdown",zt="normal",wt="rect",Nt="rectWithTitle",ue="stateStart",fe="stateEnd",Ht="divider",Xt="roundedWithTitle",pe="note",ye="noteGroup",pt="statediagram",Se="state",_e=`${pt}-${Se}`,Jt="transition",ge="note",Ee="note-edge",Te=`${Jt} ${Ee}`,me=`${pt}-${ge}`,ke="cluster",be=`${pt}-${ke}`,ve="cluster-alt",De=`${pt}-${ve}`,Zt="parent",Qt="note",xe="state",Pt="----",Ce=`${Pt}${Qt}`,qt=`${Pt}${Zt}`,te=(0,o.e)((t,e=y)=>{if(!t.doc)return e;let s=e;for(const n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir"),Ae=(0,o.e)(function(t,e){return e.db.getClasses()},"getClasses"),Le=(0,o.e)(async function(t,e,s,n){E.c.info("REF0:"),E.c.info("Drawing state diagram (v2)",e);const{securityLevel:i,state:h,layout:f}=(0,g.nV)();n.db.extract(n.db.getRootDocV2());const S=n.db.getData(),p=(0,st.q)(e,i);S.type=n.type,S.layoutAlgorithm=f,S.nodeSpacing=h?.nodeSpacing||50,S.rankSpacing=h?.rankSpacing||50,(0,g.nV)().look==="neo"?S.markers=["barbNeo"]:S.markers=["barb"],S.diagramId=e,await(0,j.sY)(S,p);const D=8;try{(typeof n.db.getLinks=="function"?n.db.getLinks():new Map).forEach((Y,w)=>{const d=typeof w=="string"?w:typeof w?.id=="string"?w.id:"",M=S.nodes.find(V=>V.id===d);if(!d){E.c.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(w));return}const F=p.node()?.querySelectorAll("g.node, g.rough-node");let $;if(F?.forEach(V=>{const ct=V.textContent?.trim();(V.id===M?.domId||ct===d)&&($=V)}),!$){E.c.warn("\u26A0\uFE0F Could not find node matching text:",d);return}const z=$.parentNode;if(!z){E.c.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",d);return}const B=document.createElementNS("http://www.w3.org/2000/svg","a"),H=Y.url.replace(/^"+|"+$/g,"");if(B.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",H),B.setAttribute("target","_blank"),Y.tooltip){const V=Y.tooltip.replace(/^"+|"+$/g,"");B.setAttribute("title",V),$.setAttribute("title",V)}z.replaceChild(B,$),B.appendChild($),E.c.info("\u{1F517} Wrapped node in <a> tag for:",d,Y.url)})}catch(C){E.c.error("\u274C Error injecting clickable links:",C)}K.w8.insertTitle(p,"statediagramTitleText",h?.titleTopMargin??25,n.db.getDiagramTitle()),(0,I.j)(p,D,pt,h?.useMaxWidth??!0)},"draw"),Oe={getClasses:Ae,draw:Le,getDir:te},gt=new Map,q=0;function Et(t="",e=0,s="",n=Pt){const i=s!==null&&s.length>0?`${n}${s}`:"";return`${xe}-${t}${i}-${e}`}(0,o.e)(Et,"stateDomId");var Ie=(0,o.e)((t,e,s,n,i,h,f,S)=>{E.c.trace("items",e),e.forEach(p=>{switch(p.stmt){case x:St(t,p,s,n,i,h,f,S);break;case ft:St(t,p,s,n,i,h,f,S);break;case it:{St(t,p.state1,s,n,i,h,f,S),St(t,p.state2,s,n,i,h,f,S);const m=f==="neo",D={id:"edge"+q,start:p.state1.id,end:p.state2.id,arrowhead:"normal",arrowTypeEnd:m?"arrow_barb_neo":"arrow_barb",style:Wt,labelStyle:"",label:g.SY.sanitizeText(p.description??"",(0,g.nV)()),arrowheadStyle:Ut,labelpos:jt,labelType:Kt,thickness:zt,classes:Jt,look:f};i.push(D),q++}break}})},"setupDoc"),ee=(0,o.e)((t,e=y)=>{let s=e;if(t.doc)for(const n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir");function yt(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(i=>{const h=s.get(i);h&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...h.styles])}));const n=t.find(i=>i.id===e.id);n?Object.assign(n,e):t.push(e)}(0,o.e)(yt,"insertOrUpdateNode");function se(t){return t?.classes?.join(" ")??""}(0,o.e)(se,"getClassesFromDbInfo");function re(t){return t?.styles??[]}(0,o.e)(re,"getStylesFromDbInfo");var St=(0,o.e)((t,e,s,n,i,h,f,S)=>{const p=e.id,m=s.get(p),D=se(m),C=re(m),Y=(0,g.nV)();if(E.c.info("dataFetcher parsedItem",e,m,C),p!=="root"){let w=wt;e.start===!0?w=ue:e.start===!1&&(w=fe),e.type!==ft&&(w=e.type),gt.get(p)||gt.set(p,{id:p,shape:w,description:g.SY.sanitizeText(p,Y),cssClasses:`${D} ${_e}`,cssStyles:C});const d=gt.get(p);e.description&&(Array.isArray(d.description)?(d.shape=Nt,d.description.push(e.description)):d.description?.length&&d.description.length>0?(d.shape=Nt,d.description===p?d.description=[e.description]:d.description=[d.description,e.description]):(d.shape=wt,d.description=e.description),d.description=g.SY.sanitizeTextOrArray(d.description,Y)),d.description?.length===1&&d.shape===Nt&&(d.type==="group"?d.shape=Xt:d.shape=wt),!d.type&&e.doc&&(E.c.info("Setting cluster for XCX",p,ee(e)),d.type="group",d.isGroup=!0,d.dir=ee(e),d.explicitDir=e.doc.some(F=>F.stmt==="dir"),d.shape=e.type===Gt?Ht:Xt,d.cssClasses=`${d.cssClasses} ${be} ${h?De:""}`);const M={labelStyle:"",shape:d.shape,label:d.description,cssClasses:d.cssClasses,cssCompiledStyles:[],cssStyles:d.cssStyles,id:p,dir:d.dir,domId:Et(p,q),type:d.type,isGroup:d.type==="group",padding:8,rx:10,ry:10,look:f,labelType:"markdown"};if(M.shape===Ht&&(M.label=""),t&&t.id!=="root"&&(E.c.trace("Setting node ",p," to be child of its parent ",t.id),M.parentId=t.id),M.centerLabel=!0,e.note){const F={labelStyle:"",shape:pe,label:e.note.text,labelType:"markdown",cssClasses:me,cssStyles:[],cssCompiledStyles:[],id:p+Ce+"-"+q,domId:Et(p,q,Qt),type:d.type,isGroup:d.type==="group",padding:Y.flowchart?.padding,look:f,position:e.note.position},$=p+qt,z={labelStyle:"",shape:ye,label:e.note.text,cssClasses:d.cssClasses,cssStyles:[],id:p+qt,domId:Et(p,q,Zt),type:"group",isGroup:!0,padding:16,look:f,position:e.note.position};q++,z.id=$,F.parentId=$,yt(n,z,S),yt(n,F,S),yt(n,M,S);let B=p,H=F.id;e.note.position==="left of"&&(B=F.id,H=p),i.push({id:B+"-"+H,start:B,end:H,arrowhead:"none",arrowTypeEnd:"",style:Wt,labelStyle:"",classes:Te,arrowheadStyle:Ut,labelpos:jt,labelType:Kt,thickness:zt,look:f})}else yt(n,M,S)}e.doc&&(E.c.trace("Adding nodes children "),Ie(e,e.doc,s,n,i,!h,f,S))},"dataFetcher"),Re=(0,o.e)(()=>{gt.clear(),q=0},"reset"),R={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},ie=(0,o.e)(()=>new Map,"newClassesList"),ae=(0,o.e)(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),Tt=(0,o.e)(t=>JSON.parse(JSON.stringify(t)),"clone"),we=(at=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=ie(),this.documents={root:ae()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=g.eu,this.setAccTitle=g.GN,this.getAccDescription=g.Mx,this.setAccDescription=g.U$,this.setDiagramTitle=g.g2,this.getDiagramTitle=g.Kr,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}extract(e){this.clear(!0);for(const i of Array.isArray(e)?e:e.doc)switch(i.stmt){case x:this.addState(i.id.trim(),i.type,i.doc,i.description,i.note);break;case it:this.addRelation(i.state1,i.state2,i.description);break;case ce:this.addStyleClass(i.id.trim(),i.classes);break;case he:this.handleStyleDef(i);break;case de:this.setCssClass(i.id.trim(),i.styleClass);break;case"click":this.addLink(i.id,i.url,i.tooltip);break}const s=this.getStates(),n=(0,g.nV)();Re(),St(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,n.look,this.classes);for(const i of this.nodes)if(Array.isArray(i.label)){if(i.description=i.label.slice(1),i.isGroup&&i.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${i.id}]`);i.label=i.label[0]}}handleStyleDef(e){const s=e.id.trim().split(","),n=e.styleClass.split(",");for(const i of s){let h=this.getState(i);if(!h){const f=i.trim();this.addState(f),h=this.getState(f)}h&&(h.styles=n.map(f=>f.replace(/;/g,"")?.trim()))}}setRootDoc(e){E.c.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,n){if(s.stmt===it){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===x&&(s.id===R.START_NODE?(s.id=e.id+(n?"_start":"_end"),s.start=n):s.id=s.id.trim()),s.stmt!==O&&s.stmt!==x||!s.doc)return;const i=[];let h=[];for(const f of s.doc)if(f.type===Gt){const S=Tt(f);S.doc=Tt(h),i.push(S),h=[]}else h.push(f);if(i.length>0&&h.length>0){const f={stmt:x,id:(0,K.Ox)(),type:"divider",doc:Tt(h)};i.push(Tt(f)),s.doc=i}s.doc.forEach(f=>this.docTranslator(s,f,!0))}getRootDocV2(){return this.docTranslator({id:O,stmt:O},{id:O,stmt:O,doc:this.rootDoc},!0),{id:O,doc:this.rootDoc}}addState(e,s=ft,n=void 0,i=void 0,h=void 0,f=void 0,S=void 0,p=void 0){const m=e?.trim();if(!this.currentDocument.states.has(m))E.c.info("Adding state ",m,i),this.currentDocument.states.set(m,{stmt:x,id:m,descriptions:[],type:s,doc:n,note:h,classes:[],styles:[],textStyles:[]});else{const D=this.currentDocument.states.get(m);if(!D)throw new Error(`State not found: ${m}`);D.doc||(D.doc=n),D.type||(D.type=s)}if(i&&(E.c.info("Setting state description",m,i),(Array.isArray(i)?i:[i]).forEach(C=>this.addDescription(m,C.trim()))),h){const D=this.currentDocument.states.get(m);if(!D)throw new Error(`State not found: ${m}`);D.note=h,D.note.text=g.SY.sanitizeText(D.note.text,(0,g.nV)())}f&&(E.c.info("Setting state classes",m,f),(Array.isArray(f)?f:[f]).forEach(C=>this.setCssClass(m,C.trim()))),S&&(E.c.info("Setting state styles",m,S),(Array.isArray(S)?S:[S]).forEach(C=>this.setStyle(m,C.trim()))),p&&(E.c.info("Setting state styles",m,S),(Array.isArray(p)?p:[p]).forEach(C=>this.setTextStyle(m,C.trim())))}clear(e){this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:ae()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=ie(),e||(this.links=new Map,(0,g.ZH)())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){E.c.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,n){this.links.set(e,{url:s,tooltip:n}),E.c.warn("Adding link",e,s,n)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===R.START_NODE?(this.startEndCount++,`${R.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=ft){return e===R.START_NODE?R.START_TYPE:s}endIdIfNeeded(e=""){return e===R.END_NODE?(this.startEndCount++,`${R.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=ft){return e===R.END_NODE?R.END_TYPE:s}addRelationObjs(e,s,n=""){const i=this.startIdIfNeeded(e.id.trim()),h=this.startTypeIfNeeded(e.id.trim(),e.type),f=this.startIdIfNeeded(s.id.trim()),S=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(i,h,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(f,S,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:i,id2:f,relationTitle:g.SY.sanitizeText(n,(0,g.nV)())})}addRelation(e,s,n){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,n);else if(typeof e=="string"&&typeof s=="string"){const i=this.startIdIfNeeded(e.trim()),h=this.startTypeIfNeeded(e),f=this.endIdIfNeeded(s.trim()),S=this.endTypeIfNeeded(s);this.addState(i,h),this.addState(f,S),this.currentDocument.relations.push({id1:i,id2:f,relationTitle:n?g.SY.sanitizeText(n,(0,g.nV)()):void 0})}}addDescription(e,s){const n=this.currentDocument.states.get(e),i=s.startsWith(":")?s.replace(":","").trim():s;n?.descriptions?.push(g.SY.sanitizeText(i,(0,g.nV)()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});const n=this.classes.get(e);s&&n&&s.split(R.STYLECLASS_SEP).forEach(i=>{const h=i.replace(/([^;]*);/,"$1").trim();if(RegExp(R.COLOR_KEYWORD).exec(i)){const S=h.replace(R.FILL_KEYWORD,R.BG_FILL).replace(R.COLOR_KEYWORD,R.FILL_KEYWORD);n.textStyles.push(S)}n.styles.push(h)})}getClasses(){return this.classes}setupToolTips(e){const s=(0,X.N6)();(0,P.Ys)(e).select("svg").selectAll("g.node, g.rough-node").on("mouseover",h=>{const f=(0,P.Ys)(h.currentTarget),S=f.attr("title");if(S===null)return;const p=h.currentTarget?.getBoundingClientRect();s.transition().duration(200).style("opacity",".9"),s.style("left",window.scrollX+p.left+(p.right-p.left)/2+"px").style("top",window.scrollY+p.bottom+"px"),s.html(rt.default.sanitize(S)),f.classed("hover",!0)}).on("mouseout",h=>{s.transition().duration(500).style("opacity",0),(0,P.Ys)(h.currentTarget).classed("hover",!1)})}setCssClass(e,s){e.split(",").forEach(n=>{let i=this.getState(n);if(!i){const h=n.trim();this.addState(h),i=this.getState(h)}i?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}bindFunctions(e){this.funs.forEach(s=>{s(e)})}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt===b)}getDirection(){return this.getDirectionStatement()?.value??A}setDirection(e){const s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:b,value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){const e=(0,g.nV)();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:te(this.getRootDocV2())}}getConfig(){return(0,g.nV)().state}},(0,o.e)(at,"StateDB"),at.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},at),Ne=(0,o.e)(t=>`
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
`,"getStyles"),Pe=Ne},31188:function(Rt,et,k){k.d(et,{j:function(){return X}});var st=k(90687),I=k(7004),j=k(69849),X=(0,j.e)((E,o,P,rt)=>{E.attr("class",P);const{width:U,height:lt,x:A,y}=K(E,o);(0,st.v2)(E,lt,U,rt);const b=g(A,y,U,lt,o);E.attr("viewBox",b),I.c.debug(`viewBox configured: ${b} with padding: ${o}`)},"setupViewPortForSVG"),K=(0,j.e)((E,o)=>{const P=E.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:P.width+o*2,height:P.height+o*2,x:P.x,y:P.y}},"calculateDimensionsWithPadding"),g=(0,j.e)((E,o,P,rt,U)=>`${E-U} ${o-U} ${P} ${rt}`,"createViewBox")},77209:function(Rt,et,k){k.d(et,{q:function(){return j}});var st=k(69849),I=k(40396),j=(0,st.e)((X,K)=>{let g;return K==="sandbox"&&(g=(0,I.Ys)("#i"+X)),(K==="sandbox"?(0,I.Ys)(g.nodes()[0].contentDocument.body):(0,I.Ys)("body")).select(`[id="${X}"]`)},"getDiagramElement")}}]);
