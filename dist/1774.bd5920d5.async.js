(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[1774],{6004:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";return function(it,M){var lt=M.prototype,$=lt.format;lt.format=function(i){var A=this,S=this.$locale();if(!this.isValid())return $.bind(this)(i);var U=this.$utils(),F=(i||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(Q){switch(Q){case"Q":return Math.ceil((A.$M+1)/3);case"Do":return S.ordinal(A.$D);case"gggg":return A.weekYear();case"GGGG":return A.isoWeekYear();case"wo":return S.ordinal(A.week(),"W");case"w":case"ww":return U.s(A.week(),Q==="w"?1:2,"0");case"W":case"WW":return U.s(A.isoWeek(),Q==="W"?1:2,"0");case"k":case"kk":return U.s(String(A.$H===0?24:A.$H),Q==="k"?1:2,"0");case"X":return Math.floor(A.$d.getTime()/1e3);case"x":return A.$d.getTime();case"z":return"["+A.offsetName()+"]";case"zzz":return"["+A.offsetName("long")+"]";default:return Q}});return $.bind(this)(F)}}})},69904:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},M=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,lt=/\d/,$=/\d\d/,i=/\d\d?/,A=/\d*[^-_:/,()\s\d]+/,S={},U=function(T){return(T=+T)+(T>68?1900:2e3)},F=function(T){return function(v){this[T]=+v}},Q=[/[+-]\d\d:?(\d\d)?|Z/,function(T){(this.zone||(this.zone={})).offset=function(v){if(!v||v==="Z")return 0;var B=v.match(/([+-]|\d\d)/g),Y=60*B[1]+(+B[2]||0);return Y===0?0:B[0]==="+"?-Y:Y}(T)}],J=function(T){var v=S[T];return v&&(v.indexOf?v:v.s.concat(v.f))},b=function(T,v){var B,Y=S.meridiem;if(Y){for(var st=1;st<=24;st+=1)if(T.indexOf(Y(st,0,v))>-1){B=st>12;break}}else B=T===(v?"pm":"PM");return B},ut={A:[A,function(T){this.afternoon=b(T,!1)}],a:[A,function(T){this.afternoon=b(T,!0)}],Q:[lt,function(T){this.month=3*(T-1)+1}],S:[lt,function(T){this.milliseconds=100*+T}],SS:[$,function(T){this.milliseconds=10*+T}],SSS:[/\d{3}/,function(T){this.milliseconds=+T}],s:[i,F("seconds")],ss:[i,F("seconds")],m:[i,F("minutes")],mm:[i,F("minutes")],H:[i,F("hours")],h:[i,F("hours")],HH:[i,F("hours")],hh:[i,F("hours")],D:[i,F("day")],DD:[$,F("day")],Do:[A,function(T){var v=S.ordinal,B=T.match(/\d+/);if(this.day=B[0],v)for(var Y=1;Y<=31;Y+=1)v(Y).replace(/\[|\]/g,"")===T&&(this.day=Y)}],w:[i,F("week")],ww:[$,F("week")],M:[i,F("month")],MM:[$,F("month")],MMM:[A,function(T){var v=J("months"),B=(J("monthsShort")||v.map(function(Y){return Y.slice(0,3)})).indexOf(T)+1;if(B<1)throw new Error;this.month=B%12||B}],MMMM:[A,function(T){var v=J("months").indexOf(T)+1;if(v<1)throw new Error;this.month=v%12||v}],Y:[/[+-]?\d+/,F("year")],YY:[$,function(T){this.year=U(T)}],YYYY:[/\d{4}/,F("year")],Z:Q,ZZ:Q};function yt(T){var v,B;v=T,B=S&&S.formats;for(var Y=(T=v.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(I,O,N){var V=N&&N.toUpperCase();return O||B[N]||it[N]||B[V].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(z,tt,dt){return tt||dt.slice(1)})})).match(M),st=Y.length,q=0;q<st;q+=1){var E=Y[q],h=ut[E],u=h&&h[0],w=h&&h[1];Y[q]=w?{regex:u,parser:w}:E.replace(/^\[|\]$/g,"")}return function(I){for(var O={},N=0,V=0;N<st;N+=1){var z=Y[N];if(typeof z=="string")V+=z.length;else{var tt=z.regex,dt=z.parser,vt=I.slice(V),rt=tt.exec(vt)[0];dt.call(O,rt),I=I.replace(rt,"")}}return function(gt){var Et=gt.afternoon;if(Et!==void 0){var ct=gt.hours;Et?ct<12&&(gt.hours+=12):ct===12&&(gt.hours=0),delete gt.afternoon}}(O),O}}return function(T,v,B){B.p.customParseFormat=!0,T&&T.parseTwoDigitYear&&(U=T.parseTwoDigitYear);var Y=v.prototype,st=Y.parse;Y.parse=function(q){var E=q.date,h=q.utc,u=q.args;this.$u=h;var w=u[1];if(typeof w=="string"){var I=u[2]===!0,O=u[3]===!0,N=I||O,V=u[2];O&&(V=u[2]),S=this.$locale(),!I&&V&&(S=B.Ls[V]),this.$d=function(vt,rt,gt,Et){try{if(["x","X"].indexOf(rt)>-1)return new Date((rt==="X"?1e3:1)*vt);var ct=yt(rt)(vt),Ot=ct.year,Mt=ct.month,se=ct.day,ie=ct.hours,re=ct.minutes,ne=ct.seconds,ae=ct.milliseconds,Zt=ct.zone,Qt=ct.week,$t=new Date,At=se||(Ot||Mt?1:$t.getDate()),Ft=Ot||$t.getFullYear(),Ct=0;Ot&&!Mt||(Ct=Mt>0?Mt-1:$t.getMonth());var St,Pt=ie||0,Vt=re||0,Rt=ne||0,Bt=ae||0;return Zt?new Date(Date.UTC(Ft,Ct,At,Pt,Vt,Rt,Bt+60*Zt.offset*1e3)):gt?new Date(Date.UTC(Ft,Ct,At,Pt,Vt,Rt,Bt)):(St=new Date(Ft,Ct,At,Pt,Vt,Rt,Bt),Qt&&(St=Et(St).week(Qt).toDate()),St)}catch{return new Date("")}}(E,w,h,B),this.init(),V&&V!==!0&&(this.$L=this.locale(V).$L),N&&E!=this.format(w)&&(this.$d=new Date("")),S={}}else if(w instanceof Array)for(var z=w.length,tt=1;tt<=z;tt+=1){u[1]=w[tt-1];var dt=B.apply(this,u);if(dt.isValid()){this.$d=dt.$d,this.$L=dt.$L,this.init();break}tt===z&&(this.$d=new Date(""))}else st.call(this,q)}}})},99036:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it,M,lt=1e3,$=6e4,i=36e5,A=864e5,S=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,U=31536e6,F=2628e6,Q=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,J={years:U,months:F,days:A,hours:i,minutes:$,seconds:lt,milliseconds:1,weeks:6048e5},b=function(E){return E instanceof st},ut=function(E,h,u){return new st(E,u,h.$l)},yt=function(E){return M.p(E)+"s"},T=function(E){return E<0},v=function(E){return T(E)?Math.ceil(E):Math.floor(E)},B=function(E){return Math.abs(E)},Y=function(E,h){return E?T(E)?{negative:!0,format:""+B(E)+h}:{negative:!1,format:""+E+h}:{negative:!1,format:""}},st=function(){function E(u,w,I){var O=this;if(this.$d={},this.$l=I,u===void 0&&(this.$ms=0,this.parseFromMilliseconds()),w)return ut(u*J[yt(w)],this);if(typeof u=="number")return this.$ms=u,this.parseFromMilliseconds(),this;if(typeof u=="object")return Object.keys(u).forEach(function(z){O.$d[yt(z)]=u[z]}),this.calMilliseconds(),this;if(typeof u=="string"){var N=u.match(Q);if(N){var V=N.slice(2).map(function(z){return z!=null?Number(z):0});return this.$d.years=V[0],this.$d.months=V[1],this.$d.weeks=V[2],this.$d.days=V[3],this.$d.hours=V[4],this.$d.minutes=V[5],this.$d.seconds=V[6],this.calMilliseconds(),this}}return this}var h=E.prototype;return h.calMilliseconds=function(){var u=this;this.$ms=Object.keys(this.$d).reduce(function(w,I){return w+(u.$d[I]||0)*J[I]},0)},h.parseFromMilliseconds=function(){var u=this.$ms;this.$d.years=v(u/U),u%=U,this.$d.months=v(u/F),u%=F,this.$d.days=v(u/A),u%=A,this.$d.hours=v(u/i),u%=i,this.$d.minutes=v(u/$),u%=$,this.$d.seconds=v(u/lt),u%=lt,this.$d.milliseconds=u},h.toISOString=function(){var u=Y(this.$d.years,"Y"),w=Y(this.$d.months,"M"),I=+this.$d.days||0;this.$d.weeks&&(I+=7*this.$d.weeks);var O=Y(I,"D"),N=Y(this.$d.hours,"H"),V=Y(this.$d.minutes,"M"),z=this.$d.seconds||0;this.$d.milliseconds&&(z+=this.$d.milliseconds/1e3,z=Math.round(1e3*z)/1e3);var tt=Y(z,"S"),dt=u.negative||w.negative||O.negative||N.negative||V.negative||tt.negative,vt=N.format||V.format||tt.format?"T":"",rt=(dt?"-":"")+"P"+u.format+w.format+O.format+vt+N.format+V.format+tt.format;return rt==="P"||rt==="-P"?"P0D":rt},h.toJSON=function(){return this.toISOString()},h.format=function(u){var w=u||"YYYY-MM-DDTHH:mm:ss",I={Y:this.$d.years,YY:M.s(this.$d.years,2,"0"),YYYY:M.s(this.$d.years,4,"0"),M:this.$d.months,MM:M.s(this.$d.months,2,"0"),D:this.$d.days,DD:M.s(this.$d.days,2,"0"),H:this.$d.hours,HH:M.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:M.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:M.s(this.$d.seconds,2,"0"),SSS:M.s(this.$d.milliseconds,3,"0")};return w.replace(S,function(O,N){return N||String(I[O])})},h.as=function(u){return this.$ms/J[yt(u)]},h.get=function(u){var w=this.$ms,I=yt(u);return I==="milliseconds"?w%=1e3:w=I==="weeks"?v(w/J[I]):this.$d[I],w||0},h.add=function(u,w,I){var O;return O=w?u*J[yt(w)]:b(u)?u.$ms:ut(u,this).$ms,ut(this.$ms+O*(I?-1:1),this)},h.subtract=function(u,w){return this.add(u,w,!0)},h.locale=function(u){var w=this.clone();return w.$l=u,w},h.clone=function(){return ut(this.$ms,this)},h.humanize=function(u){return it().add(this.$ms,"ms").locale(this.$l).fromNow(!u)},h.valueOf=function(){return this.asMilliseconds()},h.milliseconds=function(){return this.get("milliseconds")},h.asMilliseconds=function(){return this.as("milliseconds")},h.seconds=function(){return this.get("seconds")},h.asSeconds=function(){return this.as("seconds")},h.minutes=function(){return this.get("minutes")},h.asMinutes=function(){return this.as("minutes")},h.hours=function(){return this.get("hours")},h.asHours=function(){return this.as("hours")},h.days=function(){return this.get("days")},h.asDays=function(){return this.as("days")},h.weeks=function(){return this.get("weeks")},h.asWeeks=function(){return this.as("weeks")},h.months=function(){return this.get("months")},h.asMonths=function(){return this.as("months")},h.years=function(){return this.get("years")},h.asYears=function(){return this.as("years")},E}(),q=function(E,h,u){return E.add(h.years()*u,"y").add(h.months()*u,"M").add(h.days()*u,"d").add(h.hours()*u,"h").add(h.minutes()*u,"m").add(h.seconds()*u,"s").add(h.milliseconds()*u,"ms")};return function(E,h,u){it=u,M=u().$utils(),u.duration=function(O,N){var V=u.locale();return ut(O,{$l:V},N)},u.isDuration=b;var w=h.prototype.add,I=h.prototype.subtract;h.prototype.add=function(O,N){return b(O)?q(this,O,1):w.bind(this)(O,N)},h.prototype.subtract=function(O,N){return b(O)?q(this,O,-1):I.bind(this)(O,N)}}})},96353:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it="day";return function(M,lt,$){var i=function(U){return U.add(4-U.isoWeekday(),it)},A=lt.prototype;A.isoWeekYear=function(){return i(this).year()},A.isoWeek=function(U){if(!this.$utils().u(U))return this.add(7*(U-this.isoWeek()),it);var F,Q,J,b,ut=i(this),yt=(F=this.isoWeekYear(),Q=this.$u,J=(Q?$.utc:$)().year(F).startOf("year"),b=4-J.isoWeekday(),J.isoWeekday()>4&&(b+=7),J.add(b,it));return ut.diff(yt,"week")+1},A.isoWeekday=function(U){return this.$utils().u(U)?this.day()||7:this.day(this.day()%7?U:U-7)};var S=A.startOf;A.startOf=function(U,F){var Q=this.$utils(),J=!!Q.u(F)||F;return Q.p(U)==="isoweek"?J?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):S.bind(this)(U,F)}}})},61774:function(wt,it,M){"use strict";M.d(it,{diagram:function(){return Ze}});var lt=M(15514),$=M(55639),i=M(5750),A=M(12657),S=M(51218),U=M(96353),F=M(69904),Q=M(6004),J=M(99036),b=M(18701),ut=function(){var t=(0,i.eW)(function(y,c,l,f){for(l=l||{},f=y.length;f--;l[y[f]]=c);return l},"o"),r=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],a=[1,26],n=[1,27],o=[1,28],k=[1,29],x=[1,30],j=[1,31],nt=[1,32],Tt=[1,33],H=[1,34],at=[1,9],bt=[1,10],ht=[1,11],kt=[1,12],P=[1,13],Nt=[1,14],zt=[1,15],Ht=[1,16],Ut=[1,19],Lt=[1,20],jt=[1,21],Gt=[1,22],Xt=[1,23],Kt=[1,25],p=[1,35],D={trace:(0,i.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,i.eW)(function(c,l,f,d,g,s,G){var e=s.length-1;switch(g){case 1:return s[e-1];case 2:this.$=[];break;case 3:s[e-1].push(s[e]),this.$=s[e-1];break;case 4:case 5:this.$=s[e];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=s[e].substr(18);break;case 19:d.TopAxis(),this.$=s[e].substr(8);break;case 20:d.setAxisFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 21:d.setTickInterval(s[e].substr(13)),this.$=s[e].substr(13);break;case 22:d.setExcludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 23:d.setIncludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 24:d.setTodayMarker(s[e].substr(12)),this.$=s[e].substr(12);break;case 27:d.setDiagramTitle(s[e].substr(6)),this.$=s[e].substr(6);break;case 28:this.$=s[e].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=s[e].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(s[e].substr(8)),this.$=s[e].substr(8);break;case 33:d.addTask(s[e-1],s[e]),this.$="task";break;case 34:this.$=s[e-1],d.setClickEvent(s[e-1],s[e],null);break;case 35:this.$=s[e-2],d.setClickEvent(s[e-2],s[e-1],s[e]);break;case 36:this.$=s[e-2],d.setClickEvent(s[e-2],s[e-1],null),d.setLink(s[e-2],s[e]);break;case 37:this.$=s[e-3],d.setClickEvent(s[e-3],s[e-2],s[e-1]),d.setLink(s[e-3],s[e]);break;case 38:this.$=s[e-2],d.setClickEvent(s[e-2],s[e],null),d.setLink(s[e-2],s[e-1]);break;case 39:this.$=s[e-3],d.setClickEvent(s[e-3],s[e-1],s[e]),d.setLink(s[e-3],s[e-2]);break;case 40:this.$=s[e-1],d.setLink(s[e-1],s[e]);break;case 41:case 47:this.$=s[e-1]+" "+s[e];break;case 42:case 43:case 45:this.$=s[e-2]+" "+s[e-1]+" "+s[e];break;case 44:case 46:this.$=s[e-3]+" "+s[e-2]+" "+s[e-1]+" "+s[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(r,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:a,13:n,14:o,15:k,16:x,17:j,18:nt,19:18,20:Tt,21:H,22:at,23:bt,24:ht,25:kt,26:P,27:Nt,28:zt,29:Ht,30:Ut,31:Lt,33:jt,35:Gt,36:Xt,37:24,38:Kt,40:p},t(r,[2,7],{1:[2,1]}),t(r,[2,3]),{9:36,11:17,12:a,13:n,14:o,15:k,16:x,17:j,18:nt,19:18,20:Tt,21:H,22:at,23:bt,24:ht,25:kt,26:P,27:Nt,28:zt,29:Ht,30:Ut,31:Lt,33:jt,35:Gt,36:Xt,37:24,38:Kt,40:p},t(r,[2,5]),t(r,[2,6]),t(r,[2,17]),t(r,[2,18]),t(r,[2,19]),t(r,[2,20]),t(r,[2,21]),t(r,[2,22]),t(r,[2,23]),t(r,[2,24]),t(r,[2,25]),t(r,[2,26]),t(r,[2,27]),{32:[1,37]},{34:[1,38]},t(r,[2,30]),t(r,[2,31]),t(r,[2,32]),{39:[1,39]},t(r,[2,8]),t(r,[2,9]),t(r,[2,10]),t(r,[2,11]),t(r,[2,12]),t(r,[2,13]),t(r,[2,14]),t(r,[2,15]),t(r,[2,16]),{41:[1,40],43:[1,41]},t(r,[2,4]),t(r,[2,28]),t(r,[2,29]),t(r,[2,33]),t(r,[2,34],{42:[1,42],43:[1,43]}),t(r,[2,40],{41:[1,44]}),t(r,[2,35],{43:[1,45]}),t(r,[2,36]),t(r,[2,38],{42:[1,46]}),t(r,[2,37]),t(r,[2,39])],defaultActions:{},parseError:(0,i.eW)(function(c,l){if(l.recoverable)this.trace(c);else{var f=new Error(c);throw f.hash=l,f}},"parseError"),parse:(0,i.eW)(function(c){var l=this,f=[0],d=[],g=[null],s=[],G=this.table,e="",m=0,R=0,C=0,L=2,et=1,X=s.slice.call(arguments,1),K=Object.create(this.lexer),xt={yy:{}};for(var de in this.yy)Object.prototype.hasOwnProperty.call(this.yy,de)&&(xt.yy[de]=this.yy[de]);K.setInput(c,xt.yy),xt.yy.lexer=K,xt.yy.parser=this,typeof K.yylloc>"u"&&(K.yylloc={});var fe=K.yylloc;s.push(fe);var Qe=K.options&&K.options.ranges;typeof xt.yy.parseError=="function"?this.parseError=xt.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Je(ft){f.length=f.length-2*ft,g.length=g.length-ft,s.length=s.length-ft}(0,i.eW)(Je,"popStack");function We(){var ft;return ft=d.pop()||K.lex()||et,typeof ft!="number"&&(ft instanceof Array&&(d=ft,ft=d.pop()),ft=l.symbols_[ft]||ft),ft}(0,i.eW)(We,"lex");for(var ot,he,Wt,mt,qe,ke,Yt={},te,_t,Ee,ee;;){if(Wt=f[f.length-1],this.defaultActions[Wt]?mt=this.defaultActions[Wt]:((ot===null||typeof ot>"u")&&(ot=We()),mt=G[Wt]&&G[Wt][ot]),typeof mt>"u"||!mt.length||!mt[0]){var me="";ee=[];for(te in G[Wt])this.terminals_[te]&&te>L&&ee.push("'"+this.terminals_[te]+"'");K.showPosition?me="Parse error on line "+(m+1)+`:
`+K.showPosition()+`
Expecting `+ee.join(", ")+", got '"+(this.terminals_[ot]||ot)+"'":me="Parse error on line "+(m+1)+": Unexpected "+(ot==et?"end of input":"'"+(this.terminals_[ot]||ot)+"'"),this.parseError(me,{text:K.match,token:this.terminals_[ot]||ot,line:K.yylineno,loc:fe,expected:ee})}if(mt[0]instanceof Array&&mt.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Wt+", token: "+ot);switch(mt[0]){case 1:f.push(ot),g.push(K.yytext),s.push(K.yylloc),f.push(mt[1]),ot=null,he?(ot=he,he=null):(R=K.yyleng,e=K.yytext,m=K.yylineno,fe=K.yylloc,C>0&&C--);break;case 2:if(_t=this.productions_[mt[1]][1],Yt.$=g[g.length-_t],Yt._$={first_line:s[s.length-(_t||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(_t||1)].first_column,last_column:s[s.length-1].last_column},Qe&&(Yt._$.range=[s[s.length-(_t||1)].range[0],s[s.length-1].range[1]]),ke=this.performAction.apply(Yt,[e,R,m,xt.yy,mt[1],g,s].concat(X)),typeof ke<"u")return ke;_t&&(f=f.slice(0,-1*_t*2),g=g.slice(0,-1*_t),s=s.slice(0,-1*_t)),f.push(this.productions_[mt[1]][0]),g.push(Yt.$),s.push(Yt._$),Ee=G[f[f.length-2]][f[f.length-1]],f.push(Ee);break;case 3:return!0}}return!0},"parse")},W=function(){var y={EOF:1,parseError:(0,i.eW)(function(l,f){if(this.yy.parser)this.yy.parser.parseError(l,f);else throw new Error(l)},"parseError"),setInput:(0,i.eW)(function(c,l){return this.yy=l||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,i.eW)(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var l=c.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:(0,i.eW)(function(c){var l=c.length,f=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),f.length-1&&(this.yylineno-=f.length-1);var g=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:f?(f.length===d.length?this.yylloc.first_column:0)+d[d.length-f.length].length-f[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[g[0],g[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:(0,i.eW)(function(){return this._more=!0,this},"more"),reject:(0,i.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,i.eW)(function(c){this.unput(this.match.slice(c))},"less"),pastInput:(0,i.eW)(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,i.eW)(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,i.eW)(function(){var c=this.pastInput(),l=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:(0,i.eW)(function(c,l){var f,d,g;if(this.options.backtrack_lexer&&(g={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(g.yylloc.range=this.yylloc.range.slice(0))),d=c[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],f=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),f)return f;if(this._backtrack){for(var s in g)this[s]=g[s];return!1}return!1},"test_match"),next:(0,i.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,l,f,d;this._more||(this.yytext="",this.match="");for(var g=this._currentRules(),s=0;s<g.length;s++)if(f=this._input.match(this.rules[g[s]]),f&&(!l||f[0].length>l[0].length)){if(l=f,d=s,this.options.backtrack_lexer){if(c=this.test_match(f,g[s]),c!==!1)return c;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(c=this.test_match(l,g[d]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,i.eW)(function(){var l=this.next();return l||this.lex()},"lex"),begin:(0,i.eW)(function(l){this.conditionStack.push(l)},"begin"),popState:(0,i.eW)(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,i.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,i.eW)(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:(0,i.eW)(function(l){this.begin(l)},"pushState"),stateStackSize:(0,i.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,i.eW)(function(l,f,d,g){var s=g;switch(d){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return y}();D.lexer=W;function _(){this.yy={}}return(0,i.eW)(_,"Parser"),_.prototype=D,D.Parser=_,new _}();ut.parser=ut;var yt=ut;S.extend(U),S.extend(F),S.extend(Q);var T={friday:5,saturday:6},v="",B="",Y=void 0,st="",q=[],E=[],h=new Map,u=[],w=[],I="",O="",N=["active","done","crit","milestone","vert"],V=[],z="",tt=!1,dt=!1,vt="sunday",rt="saturday",gt=0,Et=(0,i.eW)(function(){u=[],w=[],I="",V=[],Jt=0,ce=void 0,qt=void 0,Z=[],v="",B="",O="",Y=void 0,st="",q=[],E=[],tt=!1,dt=!1,gt=0,h=new Map,z="",(0,$.ZH)(),vt="sunday",rt="saturday"},"clear"),ct=(0,i.eW)(function(t){z=t},"setDiagramId"),Ot=(0,i.eW)(function(t){B=t},"setAxisFormat"),Mt=(0,i.eW)(function(){return B},"getAxisFormat"),se=(0,i.eW)(function(t){Y=t},"setTickInterval"),ie=(0,i.eW)(function(){return Y},"getTickInterval"),re=(0,i.eW)(function(t){st=t},"setTodayMarker"),ne=(0,i.eW)(function(){return st},"getTodayMarker"),ae=(0,i.eW)(function(t){v=t},"setDateFormat"),Zt=(0,i.eW)(function(){tt=!0},"enableInclusiveEndDates"),Qt=(0,i.eW)(function(){return tt},"endDatesAreInclusive"),$t=(0,i.eW)(function(){dt=!0},"enableTopAxis"),At=(0,i.eW)(function(){return dt},"topAxisEnabled"),Ft=(0,i.eW)(function(t){O=t},"setDisplayMode"),Ct=(0,i.eW)(function(){return O},"getDisplayMode"),St=(0,i.eW)(function(){return v},"getDateFormat"),Pt=(0,i.eW)(function(t){q=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),Vt=(0,i.eW)(function(){return q},"getIncludes"),Rt=(0,i.eW)(function(t){E=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),Bt=(0,i.eW)(function(){return E},"getExcludes"),ye=(0,i.eW)(function(){return h},"getLinks"),Me=(0,i.eW)(function(t){I=t,u.push(t)},"addSection"),Ce=(0,i.eW)(function(){return u},"getSections"),Se=(0,i.eW)(function(){let t=xe();const r=10;let a=0;for(;!t&&a<r;)t=xe(),a++;return w=Z,w},"getTasks"),ge=(0,i.eW)(function(t,r,a,n){const o=t.format(r.trim()),k=t.format("YYYY-MM-DD");return n.includes(o)||n.includes(k)?!1:a.includes("weekends")&&(t.isoWeekday()===T[rt]||t.isoWeekday()===T[rt]+1)||a.includes(t.format("dddd").toLowerCase())?!0:a.includes(o)||a.includes(k)},"isInvalidDate"),Ie=(0,i.eW)(function(t){vt=t},"setWeekday"),Le=(0,i.eW)(function(){return vt},"getWeekday"),Ye=(0,i.eW)(function(t){rt=t},"setWeekend"),ve=(0,i.eW)(function(t,r,a,n){if(!a.length||t.manualEndTime)return;let o;t.startTime instanceof Date?o=S(t.startTime):o=S(t.startTime,r,!0),o=o.add(1,"d");let k;t.endTime instanceof Date?k=S(t.endTime):k=S(t.endTime,r,!0);const[x,j]=Oe(o,k,r,a,n);t.endTime=x.toDate(),t.renderEndTime=j},"checkTaskDates"),Oe=(0,i.eW)(function(t,r,a,n,o){let k=!1,x=null;for(;t<=r;)k||(x=r.toDate()),k=ge(t,a,n,o),k&&(r=r.add(1,"d")),t=t.add(1,"d");return[r,x]},"fixTaskDates"),oe=(0,i.eW)(function(t,r,a){if(a=a.trim(),(0,i.eW)(j=>{const nt=j.trim();return nt==="x"||nt==="X"},"isTimestampFormat")(r)&&/^\d+$/.test(a))return new Date(Number(a));const k=/^after\s+(?<ids>[\d\w- ]+)/.exec(a);if(k!==null){let j=null;for(const Tt of k.groups.ids.split(" ")){let H=Dt(Tt);H!==void 0&&(!j||H.endTime>j.endTime)&&(j=H)}if(j)return j.endTime;const nt=new Date;return nt.setHours(0,0,0,0),nt}let x=S(a,r.trim(),!0);if(x.isValid())return x.toDate();{i.cM.debug("Invalid date:"+a),i.cM.debug("With date format:"+r.trim());const j=new Date(a);if(j===void 0||isNaN(j.getTime())||j.getFullYear()<-1e4||j.getFullYear()>1e4)throw new Error("Invalid date:"+a);return j}},"getStartDate"),pe=(0,i.eW)(function(t){const r=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return r!==null?[Number.parseFloat(r[1]),r[2]]:[NaN,"ms"]},"parseDuration"),Te=(0,i.eW)(function(t,r,a,n=!1){a=a.trim();const k=/^until\s+(?<ids>[\d\w- ]+)/.exec(a);if(k!==null){let H=null;for(const bt of k.groups.ids.split(" ")){let ht=Dt(bt);ht!==void 0&&(!H||ht.startTime<H.startTime)&&(H=ht)}if(H)return H.startTime;const at=new Date;return at.setHours(0,0,0,0),at}let x=S(a,r.trim(),!0);if(x.isValid())return n&&(x=x.add(1,"d")),x.toDate();let j=S(t);const[nt,Tt]=pe(a);if(!Number.isNaN(nt)){const H=j.add(nt,Tt);H.isValid()&&(j=H)}return j.toDate()},"getEndDate"),Jt=0,It=(0,i.eW)(function(t){return t===void 0?(Jt=Jt+1,"task"+Jt):t},"parseId"),$e=(0,i.eW)(function(t,r){let a;r.substr(0,1)===":"?a=r.substr(1,r.length):a=r;const n=a.split(","),o={};le(n,o,N);for(let x=0;x<n.length;x++)n[x]=n[x].trim();let k="";switch(n.length){case 1:o.id=It(),o.startTime=t.endTime,k=n[0];break;case 2:o.id=It(),o.startTime=oe(void 0,v,n[0]),k=n[1];break;case 3:o.id=It(n[0]),o.startTime=oe(void 0,v,n[1]),k=n[2];break;default:}return k&&(o.endTime=Te(o.startTime,v,k,tt),o.manualEndTime=S(k,"YYYY-MM-DD",!0).isValid(),ve(o,v,E,q)),o},"compileData"),Ae=(0,i.eW)(function(t,r){let a;r.substr(0,1)===":"?a=r.substr(1,r.length):a=r;const n=a.split(","),o={};le(n,o,N);for(let k=0;k<n.length;k++)n[k]=n[k].trim();switch(n.length){case 1:o.id=It(),o.startTime={type:"prevTaskEnd",id:t},o.endTime={data:n[0]};break;case 2:o.id=It(),o.startTime={type:"getStartDate",startData:n[0]},o.endTime={data:n[1]};break;case 3:o.id=It(n[0]),o.startTime={type:"getStartDate",startData:n[1]},o.endTime={data:n[2]};break;default:}return o},"parseData"),ce,qt,Z=[],be={},Fe=(0,i.eW)(function(t,r){const a={section:I,type:I,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:r},task:t,classes:[]},n=Ae(qt,r);a.raw.startTime=n.startTime,a.raw.endTime=n.endTime,a.id=n.id,a.prevTaskId=qt,a.active=n.active,a.done=n.done,a.crit=n.crit,a.milestone=n.milestone,a.vert=n.vert,a.order=gt,gt++;const o=Z.push(a);qt=a.id,be[a.id]=o-1},"addTask"),Dt=(0,i.eW)(function(t){const r=be[t];return Z[r]},"findTaskById"),Pe=(0,i.eW)(function(t,r){const a={section:I,type:I,description:t,task:t,classes:[]},n=$e(ce,r);a.startTime=n.startTime,a.endTime=n.endTime,a.id=n.id,a.active=n.active,a.done=n.done,a.crit=n.crit,a.milestone=n.milestone,a.vert=n.vert,ce=a,w.push(a)},"addTaskOrg"),xe=(0,i.eW)(function(){const t=(0,i.eW)(function(a){const n=Z[a];let o="";switch(Z[a].raw.startTime.type){case"prevTaskEnd":{const k=Dt(n.prevTaskId);n.startTime=k.endTime;break}case"getStartDate":o=oe(void 0,v,Z[a].raw.startTime.startData),o&&(Z[a].startTime=o);break}return Z[a].startTime&&(Z[a].endTime=Te(Z[a].startTime,v,Z[a].raw.endTime.data,tt),Z[a].endTime&&(Z[a].processed=!0,Z[a].manualEndTime=S(Z[a].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),ve(Z[a],v,E,q))),Z[a].processed},"compileTask");let r=!0;for(const[a,n]of Z.entries())t(a),r=r&&n.processed;return r},"compileTasks"),Ve=(0,i.eW)(function(t,r){let a=r;(0,$.nV)().securityLevel!=="loose"&&(a=(0,A.N)(r)),t.split(",").forEach(function(n){Dt(n)!==void 0&&(we(n,()=>{window.open(a,"_self")}),h.set(n,a))}),_e(t,"clickable")},"setLink"),_e=(0,i.eW)(function(t,r){t.split(",").forEach(function(a){let n=Dt(a);n!==void 0&&n.classes.push(r)})},"setClass"),Re=(0,i.eW)(function(t,r,a){if((0,$.nV)().securityLevel!=="loose"||r===void 0)return;let n=[];if(typeof a=="string"){n=a.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let k=0;k<n.length;k++){let x=n[k].trim();x.startsWith('"')&&x.endsWith('"')&&(x=x.substr(1,x.length-2)),n[k]=x}}n.length===0&&n.push(t),Dt(t)!==void 0&&we(t,()=>{lt.w8.runFunc(r,...n)})},"setClickFun"),we=(0,i.eW)(function(t,r){V.push(function(){const a=z?`${z}-${t}`:t,n=document.querySelector(`[id="${a}"]`);n!==null&&n.addEventListener("click",function(){r()})},function(){const a=z?`${z}-${t}`:t,n=document.querySelector(`[id="${a}-text"]`);n!==null&&n.addEventListener("click",function(){r()})})},"pushFun"),Be=(0,i.eW)(function(t,r,a){t.split(",").forEach(function(n){Re(n,r,a)}),_e(t,"clickable")},"setClickEvent"),Ne=(0,i.eW)(function(t){V.forEach(function(r){r(t)})},"bindFunctions"),ze={getConfig:(0,i.eW)(()=>(0,$.nV)().gantt,"getConfig"),clear:Et,setDateFormat:ae,getDateFormat:St,enableInclusiveEndDates:Zt,endDatesAreInclusive:Qt,enableTopAxis:$t,topAxisEnabled:At,setAxisFormat:Ot,getAxisFormat:Mt,setTickInterval:se,getTickInterval:ie,setTodayMarker:re,getTodayMarker:ne,setAccTitle:$.GN,getAccTitle:$.eu,setDiagramTitle:$.g2,getDiagramTitle:$.Kr,setDiagramId:ct,setDisplayMode:Ft,getDisplayMode:Ct,setAccDescription:$.U$,getAccDescription:$.Mx,addSection:Me,getSections:Ce,getTasks:Se,addTask:Fe,findTaskById:Dt,addTaskOrg:Pe,setIncludes:Pt,getIncludes:Vt,setExcludes:Rt,getExcludes:Bt,setClickEvent:Be,setLink:Ve,getLinks:ye,bindFunctions:Ne,parseDuration:pe,isInvalidDate:ge,setWeekday:Ie,getWeekday:Le,setWeekend:Ye};function le(t,r,a){let n=!0;for(;n;)n=!1,a.forEach(function(o){const k="^\\s*"+o+"\\s*$",x=new RegExp(k);t[0].match(x)&&(r[o]=!0,t.shift(1),n=!0)})}(0,i.eW)(le,"getTaskTags"),S.extend(J);var He=(0,i.eW)(function(){i.cM.debug("Something is calling, setConf, remove the call")},"setConf"),De={monday:b.Ox9,tuesday:b.YDX,wednesday:b.EFj,thursday:b.Igq,friday:b.y2j,saturday:b.LqH,sunday:b.Zyz},Ue=(0,i.eW)((t,r)=>{let a=[...t].map(()=>-1/0),n=[...t].sort((k,x)=>k.startTime-x.startTime||k.order-x.order),o=0;for(const k of n)for(let x=0;x<a.length;x++)if(k.startTime>=a[x]){a[x]=k.endTime,k.order=x+r,x>o&&(o=x);break}return o},"getMaxIntersections"),pt,ue=1e4,je=(0,i.eW)(function(t,r,a,n){const o=(0,$.nV)().gantt;n.db.setDiagramId(r);const k=(0,$.nV)().securityLevel;let x;k==="sandbox"&&(x=(0,b.Ys)("#i"+r));const j=k==="sandbox"?(0,b.Ys)(x.nodes()[0].contentDocument.body):(0,b.Ys)("body"),nt=k==="sandbox"?x.nodes()[0].contentDocument:document,Tt=nt.getElementById(r);pt=Tt.parentElement.offsetWidth,pt===void 0&&(pt=1200),o.useWidth!==void 0&&(pt=o.useWidth);const H=n.db.getTasks();let at=[];for(const p of H)at.push(p.type);at=Kt(at);const bt={};let ht=2*o.topPadding;if(n.db.getDisplayMode()==="compact"||o.displayMode==="compact"){const p={};for(const W of H)p[W.section]===void 0?p[W.section]=[W]:p[W.section].push(W);let D=0;for(const W of Object.keys(p)){const _=Ue(p[W],D)+1;D+=_,ht+=_*(o.barHeight+o.barGap),bt[W]=_}}else{ht+=H.length*(o.barHeight+o.barGap);for(const p of at)bt[p]=H.filter(D=>D.type===p).length}Tt.setAttribute("viewBox","0 0 "+pt+" "+ht);const kt=j.select(`[id="${r}"]`),P=(0,b.Xf)().domain([(0,b.VV$)(H,function(p){return p.startTime}),(0,b.Fp7)(H,function(p){return p.endTime})]).rangeRound([0,pt-o.leftPadding-o.rightPadding]);function Nt(p,D){const W=p.startTime,_=D.startTime;let y=0;return W>_?y=1:W<_&&(y=-1),y}(0,i.eW)(Nt,"taskCompare"),H.sort(Nt),zt(H,pt,ht),(0,$.v2)(kt,ht,pt,o.useMaxWidth),kt.append("text").text(n.db.getDiagramTitle()).attr("x",pt/2).attr("y",o.titleTopMargin).attr("class","titleText");function zt(p,D,W){const _=o.barHeight,y=_+o.barGap,c=o.topPadding,l=o.leftPadding,f=(0,b.BYU)().domain([0,at.length]).range(["#00B9FA","#F95002"]).interpolate(b.JHv);Ut(y,c,l,D,W,p,n.db.getExcludes(),n.db.getIncludes()),jt(l,c,D,W),Ht(p,y,c,l,_,f,D,W),Gt(y,c,l,_,f),Xt(l,c,D,W)}(0,i.eW)(zt,"makeGantt");function Ht(p,D,W,_,y,c,l){p.sort((e,m)=>e.vert===m.vert?0:e.vert?1:-1);const d=[...new Set(p.map(e=>e.order))].map(e=>p.find(m=>m.order===e));kt.append("g").selectAll("rect").data(d).enter().append("rect").attr("x",0).attr("y",function(e,m){return m=e.order,m*D+W-2}).attr("width",function(){return l-o.rightPadding/2}).attr("height",D).attr("class",function(e){for(const[m,R]of at.entries())if(e.type===R)return"section section"+m%o.numberSectionStyles;return"section section0"}).enter();const g=kt.append("g").selectAll("rect").data(p).enter(),s=n.db.getLinks();if(g.append("rect").attr("id",function(e){return r+"-"+e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?P(e.startTime)+_+.5*(P(e.endTime)-P(e.startTime))-.5*y:P(e.startTime)+_}).attr("y",function(e,m){return m=e.order,e.vert?o.gridLineStartPadding:m*D+W}).attr("width",function(e){return e.milestone?y:e.vert?.08*y:P(e.renderEndTime||e.endTime)-P(e.startTime)}).attr("height",function(e){return e.vert?H.length*(o.barHeight+o.barGap)+o.barHeight*2:y}).attr("transform-origin",function(e,m){return m=e.order,(P(e.startTime)+_+.5*(P(e.endTime)-P(e.startTime))).toString()+"px "+(m*D+W+.5*y).toString()+"px"}).attr("class",function(e){const m="task";let R="";e.classes.length>0&&(R=e.classes.join(" "));let C=0;for(const[et,X]of at.entries())e.type===X&&(C=et%o.numberSectionStyles);let L="";return e.active?e.crit?L+=" activeCrit":L=" active":e.done?e.crit?L=" doneCrit":L=" done":e.crit&&(L+=" crit"),L.length===0&&(L=" task"),e.milestone&&(L=" milestone "+L),e.vert&&(L=" vert "+L),L+=C,L+=" "+R,m+L}),g.append("text").attr("id",function(e){return r+"-"+e.id+"-text"}).text(function(e){return e.task}).attr("font-size",o.fontSize).attr("x",function(e){let m=P(e.startTime),R=P(e.renderEndTime||e.endTime);if(e.milestone&&(m+=.5*(P(e.endTime)-P(e.startTime))-.5*y,R=m+y),e.vert)return P(e.startTime)+_;const C=this.getBBox().width;return C>R-m?R+C+1.5*o.leftPadding>l?m+_-5:R+_+5:(R-m)/2+m+_}).attr("y",function(e,m){return e.vert?o.gridLineStartPadding+H.length*(o.barHeight+o.barGap)+60:(m=e.order,m*D+o.barHeight/2+(o.fontSize/2-2)+W)}).attr("text-height",y).attr("class",function(e){const m=P(e.startTime);let R=P(e.endTime);e.milestone&&(R=m+y);const C=this.getBBox().width;let L="";e.classes.length>0&&(L=e.classes.join(" "));let et=0;for(const[K,xt]of at.entries())e.type===xt&&(et=K%o.numberSectionStyles);let X="";return e.active&&(e.crit?X="activeCritText"+et:X="activeText"+et),e.done?e.crit?X=X+" doneCritText"+et:X=X+" doneText"+et:e.crit&&(X=X+" critText"+et),e.milestone&&(X+=" milestoneText"),e.vert&&(X+=" vertText"),C>R-m?R+C+1.5*o.leftPadding>l?L+" taskTextOutsideLeft taskTextOutside"+et+" "+X:L+" taskTextOutsideRight taskTextOutside"+et+" "+X+" width-"+C:L+" taskText taskText"+et+" "+X+" width-"+C}),(0,$.nV)().securityLevel==="sandbox"){let e;e=(0,b.Ys)("#i"+r);const m=e.nodes()[0].contentDocument;g.filter(function(R){return s.has(R.id)}).each(function(R){var C=m.querySelector("#"+CSS.escape(r+"-"+R.id)),L=m.querySelector("#"+CSS.escape(r+"-"+R.id+"-text"));const et=C.parentNode;var X=m.createElement("a");X.setAttribute("xlink:href",s.get(R.id)),X.setAttribute("target","_top"),et.appendChild(X),X.appendChild(C),X.appendChild(L)})}}(0,i.eW)(Ht,"drawRects");function Ut(p,D,W,_,y,c,l,f){if(l.length===0&&f.length===0)return;let d,g;for(const{startTime:C,endTime:L}of c)(d===void 0||C<d)&&(d=C),(g===void 0||L>g)&&(g=L);if(!d||!g)return;if(S(g).diff(S(d),"year")>5){i.cM.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const s=n.db.getDateFormat(),G=[];let e=null,m=S(d);for(;m.valueOf()<=g;)n.db.isInvalidDate(m,s,l,f)?e?e.end=m:e={start:m,end:m}:e&&(G.push(e),e=null),m=m.add(1,"d");kt.append("g").selectAll("rect").data(G).enter().append("rect").attr("id",C=>r+"-exclude-"+C.start.format("YYYY-MM-DD")).attr("x",C=>P(C.start.startOf("day"))+W).attr("y",o.gridLineStartPadding).attr("width",C=>P(C.end.endOf("day"))-P(C.start.startOf("day"))).attr("height",y-D-o.gridLineStartPadding).attr("transform-origin",function(C,L){return(P(C.start)+W+.5*(P(C.end)-P(C.start))).toString()+"px "+(L*p+.5*y).toString()+"px"}).attr("class","exclude-range")}(0,i.eW)(Ut,"drawExcludeDays");function Lt(p,D,W,_){if(W<=0||p>D)return 1/0;const y=D-p,c=S.duration({[_??"day"]:W}).asMilliseconds();return c<=0?1/0:Math.ceil(y/c)}(0,i.eW)(Lt,"getEstimatedTickCount");function jt(p,D,W,_){const y=n.db.getDateFormat(),c=n.db.getAxisFormat();let l;c?l=c:y==="D"?l="%d":l=o.axisFormat??"%Y-%m-%d";let f=(0,b.LLu)(P).tickSize(-_+D+o.gridLineStartPadding).tickFormat((0,b.i$Z)(l));const g=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(n.db.getTickInterval()||o.tickInterval);if(g!==null){const s=parseInt(g[1],10);if(isNaN(s)||s<=0)i.cM.warn(`Invalid tick interval value: "${g[1]}". Skipping custom tick interval.`);else{const G=g[2],e=n.db.getWeekday()||o.weekday,m=P.domain(),R=m[0],C=m[1],L=Lt(R,C,s,G);if(L>ue)i.cM.warn(`The tick interval "${s}${G}" would generate ${L} ticks, which exceeds the maximum allowed (${ue}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(G){case"millisecond":f.ticks(b.U8T.every(s));break;case"second":f.ticks(b.S1K.every(s));break;case"minute":f.ticks(b.Z_i.every(s));break;case"hour":f.ticks(b.WQD.every(s));break;case"day":f.ticks(b.rr1.every(s));break;case"week":f.ticks(De[e].every(s));break;case"month":f.ticks(b.F0B.every(s));break}}}if(kt.append("g").attr("class","grid").attr("transform","translate("+p+", "+(_-50)+")").call(f).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),n.db.topAxisEnabled()||o.topAxis){let s=(0,b.F5q)(P).tickSize(-_+D+o.gridLineStartPadding).tickFormat((0,b.i$Z)(l));if(g!==null){const G=parseInt(g[1],10);if(isNaN(G)||G<=0)i.cM.warn(`Invalid tick interval value: "${g[1]}". Skipping custom tick interval.`);else{const e=g[2],m=n.db.getWeekday()||o.weekday,R=P.domain(),C=R[0],L=R[1];if(Lt(C,L,G,e)<=ue)switch(e){case"millisecond":s.ticks(b.U8T.every(G));break;case"second":s.ticks(b.S1K.every(G));break;case"minute":s.ticks(b.Z_i.every(G));break;case"hour":s.ticks(b.WQD.every(G));break;case"day":s.ticks(b.rr1.every(G));break;case"week":s.ticks(De[m].every(G));break;case"month":s.ticks(b.F0B.every(G));break}}}kt.append("g").attr("class","grid").attr("transform","translate("+p+", "+D+")").call(s).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}(0,i.eW)(jt,"makeGrid");function Gt(p,D){let W=0;const _=Object.keys(bt).map(y=>[y,bt[y]]);kt.append("g").selectAll("text").data(_).enter().append(function(y){const c=y[0].split($.SY.lineBreakRegex),l=-(c.length-1)/2,f=nt.createElementNS("http://www.w3.org/2000/svg","text");f.setAttribute("dy",l+"em");for(const[d,g]of c.entries()){const s=nt.createElementNS("http://www.w3.org/2000/svg","tspan");s.setAttribute("alignment-baseline","central"),s.setAttribute("x","10"),d>0&&s.setAttribute("dy","1em"),s.textContent=g,f.appendChild(s)}return f}).attr("x",10).attr("y",function(y,c){if(c>0)for(let l=0;l<c;l++)return W+=_[c-1][1],y[1]*p/2+W*p+D;else return y[1]*p/2+D}).attr("font-size",o.sectionFontSize).attr("class",function(y){for(const[c,l]of at.entries())if(y[0]===l)return"sectionTitle sectionTitle"+c%o.numberSectionStyles;return"sectionTitle"})}(0,i.eW)(Gt,"vertLabels");function Xt(p,D,W,_){const y=n.db.getTodayMarker();if(y==="off")return;const c=kt.append("g").attr("class","today"),l=new Date,f=c.append("line");f.attr("x1",P(l)+p).attr("x2",P(l)+p).attr("y1",o.titleTopMargin).attr("y2",_-o.titleTopMargin).attr("class","today"),y!==""&&f.attr("style",y.replace(/,/g,";"))}(0,i.eW)(Xt,"drawToday");function Kt(p){const D={},W=[];for(let _=0,y=p.length;_<y;++_)Object.prototype.hasOwnProperty.call(D,p[_])||(D[p[_]]=!0,W.push(p[_]));return W}(0,i.eW)(Kt,"checkUnique")},"draw"),Ge={setConf:He,draw:je},Xe=(0,i.eW)(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
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
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar \u2014 same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),Ke=Xe,Ze={parser:yt,db:ze,renderer:Ge,styles:Ke}}}]);})();
