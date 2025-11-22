(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[1673],{87434:function(we){(function(ae,P){we.exports=P()})(this,function(){"use strict";return function(ae,P){var he=P.prototype,S=he.format;he.format=function(s){var M=this,W=this.$locale();if(!this.isValid())return S.bind(this)(s);var V=this.$utils(),I=(s||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(N){switch(N){case"Q":return Math.ceil((M.$M+1)/3);case"Do":return W.ordinal(M.$D);case"gggg":return M.weekYear();case"GGGG":return M.isoWeekYear();case"wo":return W.ordinal(M.week(),"W");case"w":case"ww":return V.s(M.week(),N==="w"?1:2,"0");case"W":case"WW":return V.s(M.isoWeek(),N==="W"?1:2,"0");case"k":case"kk":return V.s(String(M.$H===0?24:M.$H),N==="k"?1:2,"0");case"X":return Math.floor(M.$d.getTime()/1e3);case"x":return M.$d.getTime();case"z":return"["+M.offsetName()+"]";case"zzz":return"["+M.offsetName("long")+"]";default:return N}});return S.bind(this)(I)}}})},90506:function(we){(function(ae,P){we.exports=P()})(this,function(){"use strict";var ae={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},P=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,he=/\d/,S=/\d\d/,s=/\d\d?/,M=/\d*[^-_:/,()\s\d]+/,W={},V=function(m){return(m=+m)+(m>68?1900:2e3)},I=function(m){return function(_){this[m]=+_}},N=[/[+-]\d\d:?(\d\d)?|Z/,function(m){(this.zone||(this.zone={})).offset=function(_){if(!_||_==="Z")return 0;var A=_.match(/([+-]|\d\d)/g),Y=60*A[1]+(+A[2]||0);return Y===0?0:A[0]==="+"?-Y:Y}(m)}],v=function(m){var _=W[m];return _&&(_.indexOf?_:_.s.concat(_.f))},fe=function(m,_){var A,Y=W.meridiem;if(Y){for(var G=1;G<=24;G+=1)if(m.indexOf(Y(G,0,_))>-1){A=G>12;break}}else A=m===(_?"pm":"PM");return A},Ae={A:[M,function(m){this.afternoon=fe(m,!1)}],a:[M,function(m){this.afternoon=fe(m,!0)}],Q:[he,function(m){this.month=3*(m-1)+1}],S:[he,function(m){this.milliseconds=100*+m}],SS:[S,function(m){this.milliseconds=10*+m}],SSS:[/\d{3}/,function(m){this.milliseconds=+m}],s:[s,I("seconds")],ss:[s,I("seconds")],m:[s,I("minutes")],mm:[s,I("minutes")],H:[s,I("hours")],h:[s,I("hours")],HH:[s,I("hours")],hh:[s,I("hours")],D:[s,I("day")],DD:[S,I("day")],Do:[M,function(m){var _=W.ordinal,A=m.match(/\d+/);if(this.day=A[0],_)for(var Y=1;Y<=31;Y+=1)_(Y).replace(/\[|\]/g,"")===m&&(this.day=Y)}],w:[s,I("week")],ww:[S,I("week")],M:[s,I("month")],MM:[S,I("month")],MMM:[M,function(m){var _=v("months"),A=(v("monthsShort")||_.map(function(Y){return Y.slice(0,3)})).indexOf(m)+1;if(A<1)throw new Error;this.month=A%12||A}],MMMM:[M,function(m){var _=v("months").indexOf(m)+1;if(_<1)throw new Error;this.month=_%12||_}],Y:[/[+-]?\d+/,I("year")],YY:[S,function(m){this.year=V(m)}],YYYY:[/\d{4}/,I("year")],Z:N,ZZ:N};function De(m){var _,A;_=m,A=W&&W.formats;for(var Y=(m=_.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(oe,le,$){var z=$&&$.toUpperCase();return le||A[$]||ae[$]||A[z].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(ee,te,re){return te||re.slice(1)})})).match(P),G=Y.length,j=0;j<G;j+=1){var ke=Y[j],ce=Ae[ke],X=ce&&ce[0],U=ce&&ce[1];Y[j]=U?{regex:X,parser:U}:ke.replace(/^\[|\]$/g,"")}return function(oe){for(var le={},$=0,z=0;$<G;$+=1){var ee=Y[$];if(typeof ee=="string")z+=ee.length;else{var te=ee.regex,re=ee.parser,pe=oe.slice(z),be=te.exec(pe)[0];re.call(le,be),oe=oe.replace(be,"")}}return function(me){var We=me.afternoon;if(We!==void 0){var Q=me.hours;We?Q<12&&(me.hours+=12):Q===12&&(me.hours=0),delete me.afternoon}}(le),le}}return function(m,_,A){A.p.customParseFormat=!0,m&&m.parseTwoDigitYear&&(V=m.parseTwoDigitYear);var Y=_.prototype,G=Y.parse;Y.parse=function(j){var ke=j.date,ce=j.utc,X=j.args;this.$u=ce;var U=X[1];if(typeof U=="string"){var oe=X[2]===!0,le=X[3]===!0,$=oe||le,z=X[2];le&&(z=X[2]),W=this.$locale(),!oe&&z&&(W=A.Ls[z]),this.$d=function(pe,be,me,We){try{if(["x","X"].indexOf(be)>-1)return new Date((be==="X"?1e3:1)*pe);var Q=De(be)(pe),Le=Q.year,Ee=Q.month,tt=Q.day,rt=Q.hours,st=Q.minutes,it=Q.seconds,nt=Q.milliseconds,Xe=Q.zone,$e=Q.week,Ye=new Date,Fe=tt||(Le||Ee?1:Ye.getDate()),Oe=Le||Ye.getFullYear(),Ce=0;Le&&!Ee||(Ce=Ee>0?Ee-1:Ye.getMonth());var Se,Pe=rt||0,Ve=st||0,Be=it||0,Re=nt||0;return Xe?new Date(Date.UTC(Oe,Ce,Fe,Pe,Ve,Be,Re+60*Xe.offset*1e3)):me?new Date(Date.UTC(Oe,Ce,Fe,Pe,Ve,Be,Re)):(Se=new Date(Oe,Ce,Fe,Pe,Ve,Be,Re),$e&&(Se=We(Se).week($e).toDate()),Se)}catch{return new Date("")}}(ke,U,ce,A),this.init(),z&&z!==!0&&(this.$L=this.locale(z).$L),$&&ke!=this.format(U)&&(this.$d=new Date("")),W={}}else if(U instanceof Array)for(var ee=U.length,te=1;te<=ee;te+=1){X[1]=U[te-1];var re=A.apply(this,X);if(re.isValid()){this.$d=re.$d,this.$L=re.$L,this.init();break}te===ee&&(this.$d=new Date(""))}else G.call(this,j)}}})},60264:function(we){(function(ae,P){we.exports=P()})(this,function(){"use strict";var ae="day";return function(P,he,S){var s=function(V){return V.add(4-V.isoWeekday(),ae)},M=he.prototype;M.isoWeekYear=function(){return s(this).year()},M.isoWeek=function(V){if(!this.$utils().u(V))return this.add(7*(V-this.isoWeek()),ae);var I,N,v,fe,Ae=s(this),De=(I=this.isoWeekYear(),N=this.$u,v=(N?S.utc:S)().year(I).startOf("year"),fe=4-v.isoWeekday(),v.isoWeekday()>4&&(fe+=7),v.add(fe,ae));return Ae.diff(De,"week")+1},M.isoWeekday=function(V){return this.$utils().u(V)?this.day()||7:this.day(this.day()%7?V:V-7)};var W=M.startOf;M.startOf=function(V,I){var N=this.$utils(),v=!!N.u(I)||I;return N.p(V)==="isoweek"?v?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):W.bind(this)(V,I)}}})},91673:function(we,ae,P){"use strict";P.d(ae,{diagram:function(){return Zt}});var he=P(74128),S=P(98994),s=P(57099),M=P(80357),W=P(24341),V=P(60264),I=P(90506),N=P(87434),v=P(21489),fe=function(){var e=(0,s.eW)(function(w,l,d,f){for(d=d||{},f=w.length;f--;d[w[f]]=l);return d},"o"),i=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],n=[1,26],c=[1,27],a=[1,28],y=[1,29],k=[1,30],J=[1,31],ue=[1,32],de=[1,33],O=[1,34],Z=[1,9],ge=[1,10],se=[1,11],ie=[1,12],E=[1,13],ze=[1,14],Ne=[1,15],Ue=[1,16],Ge=[1,19],je=[1,20],Ze=[1,21],He=[1,22],Ke=[1,23],g=[1,25],x=[1,35],b={trace:(0,s.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,s.eW)(function(l,d,f,u,h,t,o){var r=t.length-1;switch(h){case 1:return t[r-1];case 2:this.$=[];break;case 3:t[r-1].push(t[r]),this.$=t[r-1];break;case 4:case 5:this.$=t[r];break;case 6:case 7:this.$=[];break;case 8:u.setWeekday("monday");break;case 9:u.setWeekday("tuesday");break;case 10:u.setWeekday("wednesday");break;case 11:u.setWeekday("thursday");break;case 12:u.setWeekday("friday");break;case 13:u.setWeekday("saturday");break;case 14:u.setWeekday("sunday");break;case 15:u.setWeekend("friday");break;case 16:u.setWeekend("saturday");break;case 17:u.setDateFormat(t[r].substr(11)),this.$=t[r].substr(11);break;case 18:u.enableInclusiveEndDates(),this.$=t[r].substr(18);break;case 19:u.TopAxis(),this.$=t[r].substr(8);break;case 20:u.setAxisFormat(t[r].substr(11)),this.$=t[r].substr(11);break;case 21:u.setTickInterval(t[r].substr(13)),this.$=t[r].substr(13);break;case 22:u.setExcludes(t[r].substr(9)),this.$=t[r].substr(9);break;case 23:u.setIncludes(t[r].substr(9)),this.$=t[r].substr(9);break;case 24:u.setTodayMarker(t[r].substr(12)),this.$=t[r].substr(12);break;case 27:u.setDiagramTitle(t[r].substr(6)),this.$=t[r].substr(6);break;case 28:this.$=t[r].trim(),u.setAccTitle(this.$);break;case 29:case 30:this.$=t[r].trim(),u.setAccDescription(this.$);break;case 31:u.addSection(t[r].substr(8)),this.$=t[r].substr(8);break;case 33:u.addTask(t[r-1],t[r]),this.$="task";break;case 34:this.$=t[r-1],u.setClickEvent(t[r-1],t[r],null);break;case 35:this.$=t[r-2],u.setClickEvent(t[r-2],t[r-1],t[r]);break;case 36:this.$=t[r-2],u.setClickEvent(t[r-2],t[r-1],null),u.setLink(t[r-2],t[r]);break;case 37:this.$=t[r-3],u.setClickEvent(t[r-3],t[r-2],t[r-1]),u.setLink(t[r-3],t[r]);break;case 38:this.$=t[r-2],u.setClickEvent(t[r-2],t[r],null),u.setLink(t[r-2],t[r-1]);break;case 39:this.$=t[r-3],u.setClickEvent(t[r-3],t[r-1],t[r]),u.setLink(t[r-3],t[r-2]);break;case 40:this.$=t[r-1],u.setLink(t[r-1],t[r]);break;case 41:case 47:this.$=t[r-1]+" "+t[r];break;case 42:case 43:case 45:this.$=t[r-2]+" "+t[r-1]+" "+t[r];break;case 44:case 46:this.$=t[r-3]+" "+t[r-2]+" "+t[r-1]+" "+t[r];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(i,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:n,13:c,14:a,15:y,16:k,17:J,18:ue,19:18,20:de,21:O,22:Z,23:ge,24:se,25:ie,26:E,27:ze,28:Ne,29:Ue,30:Ge,31:je,33:Ze,35:He,36:Ke,37:24,38:g,40:x},e(i,[2,7],{1:[2,1]}),e(i,[2,3]),{9:36,11:17,12:n,13:c,14:a,15:y,16:k,17:J,18:ue,19:18,20:de,21:O,22:Z,23:ge,24:se,25:ie,26:E,27:ze,28:Ne,29:Ue,30:Ge,31:je,33:Ze,35:He,36:Ke,37:24,38:g,40:x},e(i,[2,5]),e(i,[2,6]),e(i,[2,17]),e(i,[2,18]),e(i,[2,19]),e(i,[2,20]),e(i,[2,21]),e(i,[2,22]),e(i,[2,23]),e(i,[2,24]),e(i,[2,25]),e(i,[2,26]),e(i,[2,27]),{32:[1,37]},{34:[1,38]},e(i,[2,30]),e(i,[2,31]),e(i,[2,32]),{39:[1,39]},e(i,[2,8]),e(i,[2,9]),e(i,[2,10]),e(i,[2,11]),e(i,[2,12]),e(i,[2,13]),e(i,[2,14]),e(i,[2,15]),e(i,[2,16]),{41:[1,40],43:[1,41]},e(i,[2,4]),e(i,[2,28]),e(i,[2,29]),e(i,[2,33]),e(i,[2,34],{42:[1,42],43:[1,43]}),e(i,[2,40],{41:[1,44]}),e(i,[2,35],{43:[1,45]}),e(i,[2,36]),e(i,[2,38],{42:[1,46]}),e(i,[2,37]),e(i,[2,39])],defaultActions:{},parseError:(0,s.eW)(function(l,d){if(d.recoverable)this.trace(l);else{var f=new Error(l);throw f.hash=d,f}},"parseError"),parse:(0,s.eW)(function(l){var d=this,f=[0],u=[],h=[null],t=[],o=this.table,r="",L=0,D=0,C=0,H=2,F=1,lt=t.slice.call(arguments,1),B=Object.create(this.lexer),xe={yy:{}};for(var ut in this.yy)Object.prototype.hasOwnProperty.call(this.yy,ut)&&(xe.yy[ut]=this.yy[ut]);B.setInput(l,xe.yy),xe.yy.lexer=B,xe.yy.parser=this,typeof B.yylloc>"u"&&(B.yylloc={});var dt=B.yylloc;t.push(dt);var Ht=B.options&&B.options.ranges;typeof xe.yy.parseError=="function"?this.parseError=xe.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Kt(q){f.length=f.length-2*q,h.length=h.length-q,t.length=t.length-q}(0,s.eW)(Kt,"popStack");function Dt(){var q;return q=u.pop()||B.lex()||F,typeof q!="number"&&(q instanceof Array&&(u=q,q=u.pop()),q=d.symbols_[q]||q),q}(0,s.eW)(Dt,"lex");for(var K,ft,_e,ne,Xt,ht,Ie={},qe,ve,Wt,et;;){if(_e=f[f.length-1],this.defaultActions[_e]?ne=this.defaultActions[_e]:((K===null||typeof K>"u")&&(K=Dt()),ne=o[_e]&&o[_e][K]),typeof ne>"u"||!ne.length||!ne[0]){var kt="";et=[];for(qe in o[_e])this.terminals_[qe]&&qe>H&&et.push("'"+this.terminals_[qe]+"'");B.showPosition?kt="Parse error on line "+(L+1)+`:
`+B.showPosition()+`
Expecting `+et.join(", ")+", got '"+(this.terminals_[K]||K)+"'":kt="Parse error on line "+(L+1)+": Unexpected "+(K==F?"end of input":"'"+(this.terminals_[K]||K)+"'"),this.parseError(kt,{text:B.match,token:this.terminals_[K]||K,line:B.yylineno,loc:dt,expected:et})}if(ne[0]instanceof Array&&ne.length>1)throw new Error("Parse Error: multiple actions possible at state: "+_e+", token: "+K);switch(ne[0]){case 1:f.push(K),h.push(B.yytext),t.push(B.yylloc),f.push(ne[1]),K=null,ft?(K=ft,ft=null):(D=B.yyleng,r=B.yytext,L=B.yylineno,dt=B.yylloc,C>0&&C--);break;case 2:if(ve=this.productions_[ne[1]][1],Ie.$=h[h.length-ve],Ie._$={first_line:t[t.length-(ve||1)].first_line,last_line:t[t.length-1].last_line,first_column:t[t.length-(ve||1)].first_column,last_column:t[t.length-1].last_column},Ht&&(Ie._$.range=[t[t.length-(ve||1)].range[0],t[t.length-1].range[1]]),ht=this.performAction.apply(Ie,[r,D,L,xe.yy,ne[1],h,t].concat(lt)),typeof ht<"u")return ht;ve&&(f=f.slice(0,-1*ve*2),h=h.slice(0,-1*ve),t=t.slice(0,-1*ve)),f.push(this.productions_[ne[1]][0]),h.push(Ie.$),t.push(Ie._$),Wt=o[f[f.length-2]][f[f.length-1]],f.push(Wt);break;case 3:return!0}}return!0},"parse")},T=function(){var w={EOF:1,parseError:(0,s.eW)(function(d,f){if(this.yy.parser)this.yy.parser.parseError(d,f);else throw new Error(d)},"parseError"),setInput:(0,s.eW)(function(l,d){return this.yy=d||this.yy||{},this._input=l,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,s.eW)(function(){var l=this._input[0];this.yytext+=l,this.yyleng++,this.offset++,this.match+=l,this.matched+=l;var d=l.match(/(?:\r\n?|\n).*/g);return d?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),l},"input"),unput:(0,s.eW)(function(l){var d=l.length,f=l.split(/(?:\r\n?|\n)/g);this._input=l+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-d),this.offset-=d;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),f.length-1&&(this.yylineno-=f.length-1);var h=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:f?(f.length===u.length?this.yylloc.first_column:0)+u[u.length-f.length].length-f[0].length:this.yylloc.first_column-d},this.options.ranges&&(this.yylloc.range=[h[0],h[0]+this.yyleng-d]),this.yyleng=this.yytext.length,this},"unput"),more:(0,s.eW)(function(){return this._more=!0,this},"more"),reject:(0,s.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,s.eW)(function(l){this.unput(this.match.slice(l))},"less"),pastInput:(0,s.eW)(function(){var l=this.matched.substr(0,this.matched.length-this.match.length);return(l.length>20?"...":"")+l.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,s.eW)(function(){var l=this.match;return l.length<20&&(l+=this._input.substr(0,20-l.length)),(l.substr(0,20)+(l.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,s.eW)(function(){var l=this.pastInput(),d=new Array(l.length+1).join("-");return l+this.upcomingInput()+`
`+d+"^"},"showPosition"),test_match:(0,s.eW)(function(l,d){var f,u,h;if(this.options.backtrack_lexer&&(h={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(h.yylloc.range=this.yylloc.range.slice(0))),u=l[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+l[0].length},this.yytext+=l[0],this.match+=l[0],this.matches=l,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(l[0].length),this.matched+=l[0],f=this.performAction.call(this,this.yy,this,d,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),f)return f;if(this._backtrack){for(var t in h)this[t]=h[t];return!1}return!1},"test_match"),next:(0,s.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var l,d,f,u;this._more||(this.yytext="",this.match="");for(var h=this._currentRules(),t=0;t<h.length;t++)if(f=this._input.match(this.rules[h[t]]),f&&(!d||f[0].length>d[0].length)){if(d=f,u=t,this.options.backtrack_lexer){if(l=this.test_match(f,h[t]),l!==!1)return l;if(this._backtrack){d=!1;continue}else return!1}else if(!this.options.flex)break}return d?(l=this.test_match(d,h[u]),l!==!1?l:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,s.eW)(function(){var d=this.next();return d||this.lex()},"lex"),begin:(0,s.eW)(function(d){this.conditionStack.push(d)},"begin"),popState:(0,s.eW)(function(){var d=this.conditionStack.length-1;return d>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,s.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,s.eW)(function(d){return d=this.conditionStack.length-1-Math.abs(d||0),d>=0?this.conditionStack[d]:"INITIAL"},"topState"),pushState:(0,s.eW)(function(d){this.begin(d)},"pushState"),stateStackSize:(0,s.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,s.eW)(function(d,f,u,h){var t=h;switch(u){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return w}();b.lexer=T;function p(){this.yy={}}return(0,s.eW)(p,"Parser"),p.prototype=b,b.Parser=p,new p}();fe.parser=fe;var Ae=fe;W.extend(V),W.extend(I),W.extend(N);var De={friday:5,saturday:6},m="",_="",A=void 0,Y="",G=[],j=[],ke=new Map,ce=[],X=[],U="",oe="",le=["active","done","crit","milestone","vert"],$=[],z=!1,ee=!1,te="sunday",re="saturday",pe=0,be=(0,s.eW)(function(){ce=[],X=[],U="",$=[],Qe=0,ct=void 0,Je=void 0,R=[],m="",_="",oe="",A=void 0,Y="",G=[],j=[],z=!1,ee=!1,pe=0,ke=new Map,(0,S.ZH)(),te="sunday",re="saturday"},"clear"),me=(0,s.eW)(function(e){_=e},"setAxisFormat"),We=(0,s.eW)(function(){return _},"getAxisFormat"),Q=(0,s.eW)(function(e){A=e},"setTickInterval"),Le=(0,s.eW)(function(){return A},"getTickInterval"),Ee=(0,s.eW)(function(e){Y=e},"setTodayMarker"),tt=(0,s.eW)(function(){return Y},"getTodayMarker"),rt=(0,s.eW)(function(e){m=e},"setDateFormat"),st=(0,s.eW)(function(){z=!0},"enableInclusiveEndDates"),it=(0,s.eW)(function(){return z},"endDatesAreInclusive"),nt=(0,s.eW)(function(){ee=!0},"enableTopAxis"),Xe=(0,s.eW)(function(){return ee},"topAxisEnabled"),$e=(0,s.eW)(function(e){oe=e},"setDisplayMode"),Ye=(0,s.eW)(function(){return oe},"getDisplayMode"),Fe=(0,s.eW)(function(){return m},"getDateFormat"),Oe=(0,s.eW)(function(e){G=e.toLowerCase().split(/[\s,]+/)},"setIncludes"),Ce=(0,s.eW)(function(){return G},"getIncludes"),Se=(0,s.eW)(function(e){j=e.toLowerCase().split(/[\s,]+/)},"setExcludes"),Pe=(0,s.eW)(function(){return j},"getExcludes"),Ve=(0,s.eW)(function(){return ke},"getLinks"),Be=(0,s.eW)(function(e){U=e,ce.push(e)},"addSection"),Re=(0,s.eW)(function(){return ce},"getSections"),mt=(0,s.eW)(function(){let e=Tt();const i=10;let n=0;for(;!e&&n<i;)e=Tt(),n++;return X=R,X},"getTasks"),yt=(0,s.eW)(function(e,i,n,c){const a=e.format(i.trim()),y=e.format("YYYY-MM-DD");return c.includes(a)||c.includes(y)?!1:n.includes("weekends")&&(e.isoWeekday()===De[re]||e.isoWeekday()===De[re]+1)||n.includes(e.format("dddd").toLowerCase())?!0:n.includes(a)||n.includes(y)},"isInvalidDate"),Et=(0,s.eW)(function(e){te=e},"setWeekday"),Ct=(0,s.eW)(function(){return te},"getWeekday"),St=(0,s.eW)(function(e){re=e},"setWeekend"),gt=(0,s.eW)(function(e,i,n,c){if(!n.length||e.manualEndTime)return;let a;e.startTime instanceof Date?a=W(e.startTime):a=W(e.startTime,i,!0),a=a.add(1,"d");let y;e.endTime instanceof Date?y=W(e.endTime):y=W(e.endTime,i,!0);const[k,J]=Mt(a,y,i,n,c);e.endTime=k.toDate(),e.renderEndTime=J},"checkTaskDates"),Mt=(0,s.eW)(function(e,i,n,c,a){let y=!1,k=null;for(;e<=i;)y||(k=i.toDate()),y=yt(e,n,c,a),y&&(i=i.add(1,"d")),e=e.add(1,"d");return[i,k]},"fixTaskDates"),at=(0,s.eW)(function(e,i,n){if(n=n.trim(),(i.trim()==="x"||i.trim()==="X")&&/^\d+$/.test(n))return new Date(Number(n));const a=/^after\s+(?<ids>[\d\w- ]+)/.exec(n);if(a!==null){let k=null;for(const ue of a.groups.ids.split(" ")){let de=Te(ue);de!==void 0&&(!k||de.endTime>k.endTime)&&(k=de)}if(k)return k.endTime;const J=new Date;return J.setHours(0,0,0,0),J}let y=W(n,i.trim(),!0);if(y.isValid())return y.toDate();{s.cM.debug("Invalid date:"+n),s.cM.debug("With date format:"+i.trim());const k=new Date(n);if(k===void 0||isNaN(k.getTime())||k.getFullYear()<-1e4||k.getFullYear()>1e4)throw new Error("Invalid date:"+n);return k}},"getStartDate"),vt=(0,s.eW)(function(e){const i=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(e.trim());return i!==null?[Number.parseFloat(i[1]),i[2]]:[NaN,"ms"]},"parseDuration"),pt=(0,s.eW)(function(e,i,n,c=!1){n=n.trim();const y=/^until\s+(?<ids>[\d\w- ]+)/.exec(n);if(y!==null){let O=null;for(const ge of y.groups.ids.split(" ")){let se=Te(ge);se!==void 0&&(!O||se.startTime<O.startTime)&&(O=se)}if(O)return O.startTime;const Z=new Date;return Z.setHours(0,0,0,0),Z}let k=W(n,i.trim(),!0);if(k.isValid())return c&&(k=k.add(1,"d")),k.toDate();let J=W(e);const[ue,de]=vt(n);if(!Number.isNaN(ue)){const O=J.add(ue,de);O.isValid()&&(J=O)}return J.toDate()},"getEndDate"),Qe=0,Me=(0,s.eW)(function(e){return e===void 0?(Qe=Qe+1,"task"+Qe):e},"parseId"),It=(0,s.eW)(function(e,i){let n;i.substr(0,1)===":"?n=i.substr(1,i.length):n=i;const c=n.split(","),a={};ot(c,a,le);for(let k=0;k<c.length;k++)c[k]=c[k].trim();let y="";switch(c.length){case 1:a.id=Me(),a.startTime=e.endTime,y=c[0];break;case 2:a.id=Me(),a.startTime=at(void 0,m,c[0]),y=c[1];break;case 3:a.id=Me(c[0]),a.startTime=at(void 0,m,c[1]),y=c[2];break;default:}return y&&(a.endTime=pt(a.startTime,m,y,z),a.manualEndTime=W(y,"YYYY-MM-DD",!0).isValid(),gt(a,m,j,G)),a},"compileData"),At=(0,s.eW)(function(e,i){let n;i.substr(0,1)===":"?n=i.substr(1,i.length):n=i;const c=n.split(","),a={};ot(c,a,le);for(let y=0;y<c.length;y++)c[y]=c[y].trim();switch(c.length){case 1:a.id=Me(),a.startTime={type:"prevTaskEnd",id:e},a.endTime={data:c[0]};break;case 2:a.id=Me(),a.startTime={type:"getStartDate",startData:c[0]},a.endTime={data:c[1]};break;case 3:a.id=Me(c[0]),a.startTime={type:"getStartDate",startData:c[1]},a.endTime={data:c[2]};break;default:}return a},"parseData"),ct,Je,R=[],bt={},Lt=(0,s.eW)(function(e,i){const n={section:U,type:U,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:i},task:e,classes:[]},c=At(Je,i);n.raw.startTime=c.startTime,n.raw.endTime=c.endTime,n.id=c.id,n.prevTaskId=Je,n.active=c.active,n.done=c.done,n.crit=c.crit,n.milestone=c.milestone,n.vert=c.vert,n.order=pe,pe++;const a=R.push(n);Je=n.id,bt[n.id]=a-1},"addTask"),Te=(0,s.eW)(function(e){const i=bt[e];return R[i]},"findTaskById"),Yt=(0,s.eW)(function(e,i){const n={section:U,type:U,description:e,task:e,classes:[]},c=It(ct,i);n.startTime=c.startTime,n.endTime=c.endTime,n.id=c.id,n.active=c.active,n.done=c.done,n.crit=c.crit,n.milestone=c.milestone,n.vert=c.vert,ct=n,X.push(n)},"addTaskOrg"),Tt=(0,s.eW)(function(){const e=(0,s.eW)(function(n){const c=R[n];let a="";switch(R[n].raw.startTime.type){case"prevTaskEnd":{const y=Te(c.prevTaskId);c.startTime=y.endTime;break}case"getStartDate":a=at(void 0,m,R[n].raw.startTime.startData),a&&(R[n].startTime=a);break}return R[n].startTime&&(R[n].endTime=pt(R[n].startTime,m,R[n].raw.endTime.data,z),R[n].endTime&&(R[n].processed=!0,R[n].manualEndTime=W(R[n].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),gt(R[n],m,j,G))),R[n].processed},"compileTask");let i=!0;for(const[n,c]of R.entries())e(n),i=i&&c.processed;return i},"compileTasks"),Ft=(0,s.eW)(function(e,i){let n=i;(0,S.nV)().securityLevel!=="loose"&&(n=(0,M.N)(i)),e.split(",").forEach(function(c){Te(c)!==void 0&&(_t(c,()=>{window.open(n,"_self")}),ke.set(c,n))}),xt(e,"clickable")},"setLink"),xt=(0,s.eW)(function(e,i){e.split(",").forEach(function(n){let c=Te(n);c!==void 0&&c.classes.push(i)})},"setClass"),Ot=(0,s.eW)(function(e,i,n){if((0,S.nV)().securityLevel!=="loose"||i===void 0)return;let c=[];if(typeof n=="string"){c=n.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let y=0;y<c.length;y++){let k=c[y].trim();k.startsWith('"')&&k.endsWith('"')&&(k=k.substr(1,k.length-2)),c[y]=k}}c.length===0&&c.push(e),Te(e)!==void 0&&_t(e,()=>{he.w8.runFunc(i,...c)})},"setClickFun"),_t=(0,s.eW)(function(e,i){$.push(function(){const n=document.querySelector(`[id="${e}"]`);n!==null&&n.addEventListener("click",function(){i()})},function(){const n=document.querySelector(`[id="${e}-text"]`);n!==null&&n.addEventListener("click",function(){i()})})},"pushFun"),Pt=(0,s.eW)(function(e,i,n){e.split(",").forEach(function(c){Ot(c,i,n)}),xt(e,"clickable")},"setClickEvent"),Vt=(0,s.eW)(function(e){$.forEach(function(i){i(e)})},"bindFunctions"),Bt={getConfig:(0,s.eW)(()=>(0,S.nV)().gantt,"getConfig"),clear:be,setDateFormat:rt,getDateFormat:Fe,enableInclusiveEndDates:st,endDatesAreInclusive:it,enableTopAxis:nt,topAxisEnabled:Xe,setAxisFormat:me,getAxisFormat:We,setTickInterval:Q,getTickInterval:Le,setTodayMarker:Ee,getTodayMarker:tt,setAccTitle:S.GN,getAccTitle:S.eu,setDiagramTitle:S.g2,getDiagramTitle:S.Kr,setDisplayMode:$e,getDisplayMode:Ye,setAccDescription:S.U$,getAccDescription:S.Mx,addSection:Be,getSections:Re,getTasks:mt,addTask:Lt,findTaskById:Te,addTaskOrg:Yt,setIncludes:Oe,getIncludes:Ce,setExcludes:Se,getExcludes:Pe,setClickEvent:Pt,setLink:Ft,getLinks:Ve,bindFunctions:Vt,parseDuration:vt,isInvalidDate:yt,setWeekday:Et,getWeekday:Ct,setWeekend:St};function ot(e,i,n){let c=!0;for(;c;)c=!1,n.forEach(function(a){const y="^\\s*"+a+"\\s*$",k=new RegExp(y);e[0].match(k)&&(i[a]=!0,e.shift(1),c=!0)})}(0,s.eW)(ot,"getTaskTags");var Rt=(0,s.eW)(function(){s.cM.debug("Something is calling, setConf, remove the call")},"setConf"),wt={monday:v.Ox9,tuesday:v.YDX,wednesday:v.EFj,thursday:v.Igq,friday:v.y2j,saturday:v.LqH,sunday:v.Zyz},zt=(0,s.eW)((e,i)=>{let n=[...e].map(()=>-1/0),c=[...e].sort((y,k)=>y.startTime-k.startTime||y.order-k.order),a=0;for(const y of c)for(let k=0;k<n.length;k++)if(y.startTime>=n[k]){n[k]=y.endTime,y.order=k+i,k>a&&(a=k);break}return a},"getMaxIntersections"),ye,Nt=(0,s.eW)(function(e,i,n,c){const a=(0,S.nV)().gantt,y=(0,S.nV)().securityLevel;let k;y==="sandbox"&&(k=(0,v.Ys)("#i"+i));const J=y==="sandbox"?(0,v.Ys)(k.nodes()[0].contentDocument.body):(0,v.Ys)("body"),ue=y==="sandbox"?k.nodes()[0].contentDocument:document,de=ue.getElementById(i);ye=de.parentElement.offsetWidth,ye===void 0&&(ye=1200),a.useWidth!==void 0&&(ye=a.useWidth);const O=c.db.getTasks();let Z=[];for(const g of O)Z.push(g.type);Z=Ke(Z);const ge={};let se=2*a.topPadding;if(c.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const g={};for(const b of O)g[b.section]===void 0?g[b.section]=[b]:g[b.section].push(b);let x=0;for(const b of Object.keys(g)){const T=zt(g[b],x)+1;x+=T,se+=T*(a.barHeight+a.barGap),ge[b]=T}}else{se+=O.length*(a.barHeight+a.barGap);for(const g of Z)ge[g]=O.filter(x=>x.type===g).length}de.setAttribute("viewBox","0 0 "+ye+" "+se);const ie=J.select(`[id="${i}"]`),E=(0,v.Xf)().domain([(0,v.VV$)(O,function(g){return g.startTime}),(0,v.Fp7)(O,function(g){return g.endTime})]).rangeRound([0,ye-a.leftPadding-a.rightPadding]);function ze(g,x){const b=g.startTime,T=x.startTime;let p=0;return b>T?p=1:b<T&&(p=-1),p}(0,s.eW)(ze,"taskCompare"),O.sort(ze),Ne(O,ye,se),(0,S.v2)(ie,se,ye,a.useMaxWidth),ie.append("text").text(c.db.getDiagramTitle()).attr("x",ye/2).attr("y",a.titleTopMargin).attr("class","titleText");function Ne(g,x,b){const T=a.barHeight,p=T+a.barGap,w=a.topPadding,l=a.leftPadding,d=(0,v.BYU)().domain([0,Z.length]).range(["#00B9FA","#F95002"]).interpolate(v.JHv);Ge(p,w,l,x,b,g,c.db.getExcludes(),c.db.getIncludes()),je(l,w,x,b),Ue(g,p,w,l,T,d,x,b),Ze(p,w,l,T,d),He(l,w,x,b)}(0,s.eW)(Ne,"makeGantt");function Ue(g,x,b,T,p,w,l){g.sort((o,r)=>o.vert===r.vert?0:o.vert?1:-1);const f=[...new Set(g.map(o=>o.order))].map(o=>g.find(r=>r.order===o));ie.append("g").selectAll("rect").data(f).enter().append("rect").attr("x",0).attr("y",function(o,r){return r=o.order,r*x+b-2}).attr("width",function(){return l-a.rightPadding/2}).attr("height",x).attr("class",function(o){for(const[r,L]of Z.entries())if(o.type===L)return"section section"+r%a.numberSectionStyles;return"section section0"}).enter();const u=ie.append("g").selectAll("rect").data(g).enter(),h=c.db.getLinks();if(u.append("rect").attr("id",function(o){return o.id}).attr("rx",3).attr("ry",3).attr("x",function(o){return o.milestone?E(o.startTime)+T+.5*(E(o.endTime)-E(o.startTime))-.5*p:E(o.startTime)+T}).attr("y",function(o,r){return r=o.order,o.vert?a.gridLineStartPadding:r*x+b}).attr("width",function(o){return o.milestone?p:o.vert?.08*p:E(o.renderEndTime||o.endTime)-E(o.startTime)}).attr("height",function(o){return o.vert?O.length*(a.barHeight+a.barGap)+a.barHeight*2:p}).attr("transform-origin",function(o,r){return r=o.order,(E(o.startTime)+T+.5*(E(o.endTime)-E(o.startTime))).toString()+"px "+(r*x+b+.5*p).toString()+"px"}).attr("class",function(o){const r="task";let L="";o.classes.length>0&&(L=o.classes.join(" "));let D=0;for(const[H,F]of Z.entries())o.type===F&&(D=H%a.numberSectionStyles);let C="";return o.active?o.crit?C+=" activeCrit":C=" active":o.done?o.crit?C=" doneCrit":C=" done":o.crit&&(C+=" crit"),C.length===0&&(C=" task"),o.milestone&&(C=" milestone "+C),o.vert&&(C=" vert "+C),C+=D,C+=" "+L,r+C}),u.append("text").attr("id",function(o){return o.id+"-text"}).text(function(o){return o.task}).attr("font-size",a.fontSize).attr("x",function(o){let r=E(o.startTime),L=E(o.renderEndTime||o.endTime);if(o.milestone&&(r+=.5*(E(o.endTime)-E(o.startTime))-.5*p,L=r+p),o.vert)return E(o.startTime)+T;const D=this.getBBox().width;return D>L-r?L+D+1.5*a.leftPadding>l?r+T-5:L+T+5:(L-r)/2+r+T}).attr("y",function(o,r){return o.vert?a.gridLineStartPadding+O.length*(a.barHeight+a.barGap)+60:(r=o.order,r*x+a.barHeight/2+(a.fontSize/2-2)+b)}).attr("text-height",p).attr("class",function(o){const r=E(o.startTime);let L=E(o.endTime);o.milestone&&(L=r+p);const D=this.getBBox().width;let C="";o.classes.length>0&&(C=o.classes.join(" "));let H=0;for(const[lt,B]of Z.entries())o.type===B&&(H=lt%a.numberSectionStyles);let F="";return o.active&&(o.crit?F="activeCritText"+H:F="activeText"+H),o.done?o.crit?F=F+" doneCritText"+H:F=F+" doneText"+H:o.crit&&(F=F+" critText"+H),o.milestone&&(F+=" milestoneText"),o.vert&&(F+=" vertText"),D>L-r?L+D+1.5*a.leftPadding>l?C+" taskTextOutsideLeft taskTextOutside"+H+" "+F:C+" taskTextOutsideRight taskTextOutside"+H+" "+F+" width-"+D:C+" taskText taskText"+H+" "+F+" width-"+D}),(0,S.nV)().securityLevel==="sandbox"){let o;o=(0,v.Ys)("#i"+i);const r=o.nodes()[0].contentDocument;u.filter(function(L){return h.has(L.id)}).each(function(L){var D=r.querySelector("#"+L.id),C=r.querySelector("#"+L.id+"-text");const H=D.parentNode;var F=r.createElement("a");F.setAttribute("xlink:href",h.get(L.id)),F.setAttribute("target","_top"),H.appendChild(F),F.appendChild(D),F.appendChild(C)})}}(0,s.eW)(Ue,"drawRects");function Ge(g,x,b,T,p,w,l,d){if(l.length===0&&d.length===0)return;let f,u;for(const{startTime:D,endTime:C}of w)(f===void 0||D<f)&&(f=D),(u===void 0||C>u)&&(u=C);if(!f||!u)return;if(W(u).diff(W(f),"year")>5){s.cM.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const h=c.db.getDateFormat(),t=[];let o=null,r=W(f);for(;r.valueOf()<=u;)c.db.isInvalidDate(r,h,l,d)?o?o.end=r:o={start:r,end:r}:o&&(t.push(o),o=null),r=r.add(1,"d");ie.append("g").selectAll("rect").data(t).enter().append("rect").attr("id",D=>"exclude-"+D.start.format("YYYY-MM-DD")).attr("x",D=>E(D.start.startOf("day"))+b).attr("y",a.gridLineStartPadding).attr("width",D=>E(D.end.endOf("day"))-E(D.start.startOf("day"))).attr("height",p-x-a.gridLineStartPadding).attr("transform-origin",function(D,C){return(E(D.start)+b+.5*(E(D.end)-E(D.start))).toString()+"px "+(C*g+.5*p).toString()+"px"}).attr("class","exclude-range")}(0,s.eW)(Ge,"drawExcludeDays");function je(g,x,b,T){const p=c.db.getDateFormat(),w=c.db.getAxisFormat();let l;w?l=w:p==="D"?l="%d":l=a.axisFormat??"%Y-%m-%d";let d=(0,v.LLu)(E).tickSize(-T+x+a.gridLineStartPadding).tickFormat((0,v.i$Z)(l));const u=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(c.db.getTickInterval()||a.tickInterval);if(u!==null){const h=u[1],t=u[2],o=c.db.getWeekday()||a.weekday;switch(t){case"millisecond":d.ticks(v.U8T.every(h));break;case"second":d.ticks(v.S1K.every(h));break;case"minute":d.ticks(v.Z_i.every(h));break;case"hour":d.ticks(v.WQD.every(h));break;case"day":d.ticks(v.rr1.every(h));break;case"week":d.ticks(wt[o].every(h));break;case"month":d.ticks(v.F0B.every(h));break}}if(ie.append("g").attr("class","grid").attr("transform","translate("+g+", "+(T-50)+")").call(d).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),c.db.topAxisEnabled()||a.topAxis){let h=(0,v.F5q)(E).tickSize(-T+x+a.gridLineStartPadding).tickFormat((0,v.i$Z)(l));if(u!==null){const t=u[1],o=u[2],r=c.db.getWeekday()||a.weekday;switch(o){case"millisecond":h.ticks(v.U8T.every(t));break;case"second":h.ticks(v.S1K.every(t));break;case"minute":h.ticks(v.Z_i.every(t));break;case"hour":h.ticks(v.WQD.every(t));break;case"day":h.ticks(v.rr1.every(t));break;case"week":h.ticks(wt[r].every(t));break;case"month":h.ticks(v.F0B.every(t));break}}ie.append("g").attr("class","grid").attr("transform","translate("+g+", "+x+")").call(h).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}(0,s.eW)(je,"makeGrid");function Ze(g,x){let b=0;const T=Object.keys(ge).map(p=>[p,ge[p]]);ie.append("g").selectAll("text").data(T).enter().append(function(p){const w=p[0].split(S.SY.lineBreakRegex),l=-(w.length-1)/2,d=ue.createElementNS("http://www.w3.org/2000/svg","text");d.setAttribute("dy",l+"em");for(const[f,u]of w.entries()){const h=ue.createElementNS("http://www.w3.org/2000/svg","tspan");h.setAttribute("alignment-baseline","central"),h.setAttribute("x","10"),f>0&&h.setAttribute("dy","1em"),h.textContent=u,d.appendChild(h)}return d}).attr("x",10).attr("y",function(p,w){if(w>0)for(let l=0;l<w;l++)return b+=T[w-1][1],p[1]*g/2+b*g+x;else return p[1]*g/2+x}).attr("font-size",a.sectionFontSize).attr("class",function(p){for(const[w,l]of Z.entries())if(p[0]===l)return"sectionTitle sectionTitle"+w%a.numberSectionStyles;return"sectionTitle"})}(0,s.eW)(Ze,"vertLabels");function He(g,x,b,T){const p=c.db.getTodayMarker();if(p==="off")return;const w=ie.append("g").attr("class","today"),l=new Date,d=w.append("line");d.attr("x1",E(l)+g).attr("x2",E(l)+g).attr("y1",a.titleTopMargin).attr("y2",T-a.titleTopMargin).attr("class","today"),p!==""&&d.attr("style",p.replace(/,/g,";"))}(0,s.eW)(He,"drawToday");function Ke(g){const x={},b=[];for(let T=0,p=g.length;T<p;++T)Object.prototype.hasOwnProperty.call(x,g[T])||(x[g[T]]=!0,b.push(g[T]));return b}(0,s.eW)(Ke,"checkUnique")},"draw"),Ut={setConf:Rt,draw:Nt},Gt=(0,s.eW)(e=>`
  .mermaid-main-font {
        font-family: ${e.fontFamily};
  }

  .exclude-range {
    fill: ${e.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${e.sectionBkgColor};
  }

  .section2 {
    fill: ${e.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${e.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${e.titleColor};
  }

  .sectionTitle1 {
    fill: ${e.titleColor};
  }

  .sectionTitle2 {
    fill: ${e.titleColor};
  }

  .sectionTitle3 {
    fill: ${e.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${e.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${e.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${e.fontFamily};
    fill: ${e.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${e.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${e.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${e.taskTextDarkColor};
    text-anchor: start;
    font-family: ${e.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${e.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${e.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${e.taskBkgColor};
    stroke: ${e.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${e.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${e.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${e.activeTaskBkgColor};
    stroke: ${e.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${e.doneTaskBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .vert {
    stroke: ${e.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${e.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.titleColor||e.textColor};
    font-family: ${e.fontFamily};
  }
`,"getStyles"),jt=Gt,Zt={parser:Ae,db:Bt,renderer:Ut,styles:jt}}}]);})();
