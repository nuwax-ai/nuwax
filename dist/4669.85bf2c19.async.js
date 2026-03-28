(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4669],{6004:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";return function(it,M){var lt=M.prototype,A=lt.format;lt.format=function(i){var $=this,S=this.$locale();if(!this.isValid())return A.bind(this)(i);var H=this.$utils(),F=(i||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(Q){switch(Q){case"Q":return Math.ceil(($.$M+1)/3);case"Do":return S.ordinal($.$D);case"gggg":return $.weekYear();case"GGGG":return $.isoWeekYear();case"wo":return S.ordinal($.week(),"W");case"w":case"ww":return H.s($.week(),Q==="w"?1:2,"0");case"W":case"WW":return H.s($.isoWeek(),Q==="W"?1:2,"0");case"k":case"kk":return H.s(String($.$H===0?24:$.$H),Q==="k"?1:2,"0");case"X":return Math.floor($.$d.getTime()/1e3);case"x":return $.$d.getTime();case"z":return"["+$.offsetName()+"]";case"zzz":return"["+$.offsetName("long")+"]";default:return Q}});return A.bind(this)(F)}}})},69904:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},M=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,lt=/\d/,A=/\d\d/,i=/\d\d?/,$=/\d*[^-_:/,()\s\d]+/,S={},H=function(T){return(T=+T)+(T>68?1900:2e3)},F=function(T){return function(v){this[T]=+v}},Q=[/[+-]\d\d:?(\d\d)?|Z/,function(T){(this.zone||(this.zone={})).offset=function(v){if(!v||v==="Z")return 0;var N=v.match(/([+-]|\d\d)/g),O=60*N[1]+(+N[2]||0);return O===0?0:N[0]==="+"?-O:O}(T)}],J=function(T){var v=S[T];return v&&(v.indexOf?v:v.s.concat(v.f))},b=function(T,v){var N,O=S.meridiem;if(O){for(var et=1;et<=24;et+=1)if(T.indexOf(O(et,0,v))>-1){N=et>12;break}}else N=T===(v?"pm":"PM");return N},ut={A:[$,function(T){this.afternoon=b(T,!1)}],a:[$,function(T){this.afternoon=b(T,!0)}],Q:[lt,function(T){this.month=3*(T-1)+1}],S:[lt,function(T){this.milliseconds=100*+T}],SS:[A,function(T){this.milliseconds=10*+T}],SSS:[/\d{3}/,function(T){this.milliseconds=+T}],s:[i,F("seconds")],ss:[i,F("seconds")],m:[i,F("minutes")],mm:[i,F("minutes")],H:[i,F("hours")],h:[i,F("hours")],HH:[i,F("hours")],hh:[i,F("hours")],D:[i,F("day")],DD:[A,F("day")],Do:[$,function(T){var v=S.ordinal,N=T.match(/\d+/);if(this.day=N[0],v)for(var O=1;O<=31;O+=1)v(O).replace(/\[|\]/g,"")===T&&(this.day=O)}],w:[i,F("week")],ww:[A,F("week")],M:[i,F("month")],MM:[A,F("month")],MMM:[$,function(T){var v=J("months"),N=(J("monthsShort")||v.map(function(O){return O.slice(0,3)})).indexOf(T)+1;if(N<1)throw new Error;this.month=N%12||N}],MMMM:[$,function(T){var v=J("months").indexOf(T)+1;if(v<1)throw new Error;this.month=v%12||v}],Y:[/[+-]?\d+/,F("year")],YY:[A,function(T){this.year=H(T)}],YYYY:[/\d{4}/,F("year")],Z:Q,ZZ:Q};function yt(T){var v,N;v=T,N=S&&S.formats;for(var O=(T=v.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(I,Y,B){var R=B&&B.toUpperCase();return Y||N[B]||it[B]||N[R].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(U,st,dt){return st||dt.slice(1)})})).match(M),et=O.length,q=0;q<et;q+=1){var E=O[q],h=ut[E],u=h&&h[0],w=h&&h[1];O[q]=w?{regex:u,parser:w}:E.replace(/^\[|\]$/g,"")}return function(I){for(var Y={},B=0,R=0;B<et;B+=1){var U=O[B];if(typeof U=="string")R+=U.length;else{var st=U.regex,dt=U.parser,gt=I.slice(R),ot=st.exec(gt)[0];dt.call(Y,ot),I=I.replace(ot,"")}}return function(vt){var Et=vt.afternoon;if(Et!==void 0){var ct=vt.hours;Et?ct<12&&(vt.hours+=12):ct===12&&(vt.hours=0),delete vt.afternoon}}(Y),Y}}return function(T,v,N){N.p.customParseFormat=!0,T&&T.parseTwoDigitYear&&(H=T.parseTwoDigitYear);var O=v.prototype,et=O.parse;O.parse=function(q){var E=q.date,h=q.utc,u=q.args;this.$u=h;var w=u[1];if(typeof w=="string"){var I=u[2]===!0,Y=u[3]===!0,B=I||Y,R=u[2];Y&&(R=u[2]),S=this.$locale(),!I&&R&&(S=N.Ls[R]),this.$d=function(gt,ot,vt,Et){try{if(["x","X"].indexOf(ot)>-1)return new Date((ot==="X"?1e3:1)*gt);var ct=yt(ot)(gt),Yt=ct.year,Mt=ct.month,se=ct.day,ie=ct.hours,re=ct.minutes,ne=ct.seconds,ae=ct.milliseconds,Xt=ct.zone,Qt=ct.week,At=new Date,$t=se||(Yt||Mt?1:At.getDate()),Ft=Yt||At.getFullYear(),Ct=0;Yt&&!Mt||(Ct=Mt>0?Mt-1:At.getMonth());var St,Pt=ie||0,Rt=re||0,Vt=ne||0,Nt=ae||0;return Xt?new Date(Date.UTC(Ft,Ct,$t,Pt,Rt,Vt,Nt+60*Xt.offset*1e3)):vt?new Date(Date.UTC(Ft,Ct,$t,Pt,Rt,Vt,Nt)):(St=new Date(Ft,Ct,$t,Pt,Rt,Vt,Nt),Qt&&(St=Et(St).week(Qt).toDate()),St)}catch{return new Date("")}}(E,w,h,N),this.init(),R&&R!==!0&&(this.$L=this.locale(R).$L),B&&E!=this.format(w)&&(this.$d=new Date("")),S={}}else if(w instanceof Array)for(var U=w.length,st=1;st<=U;st+=1){u[1]=w[st-1];var dt=N.apply(this,u);if(dt.isValid()){this.$d=dt.$d,this.$L=dt.$L,this.init();break}st===U&&(this.$d=new Date(""))}else et.call(this,q)}}})},99036:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it,M,lt=1e3,A=6e4,i=36e5,$=864e5,S=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,H=31536e6,F=2628e6,Q=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,J={years:H,months:F,days:$,hours:i,minutes:A,seconds:lt,milliseconds:1,weeks:6048e5},b=function(E){return E instanceof et},ut=function(E,h,u){return new et(E,u,h.$l)},yt=function(E){return M.p(E)+"s"},T=function(E){return E<0},v=function(E){return T(E)?Math.ceil(E):Math.floor(E)},N=function(E){return Math.abs(E)},O=function(E,h){return E?T(E)?{negative:!0,format:""+N(E)+h}:{negative:!1,format:""+E+h}:{negative:!1,format:""}},et=function(){function E(u,w,I){var Y=this;if(this.$d={},this.$l=I,u===void 0&&(this.$ms=0,this.parseFromMilliseconds()),w)return ut(u*J[yt(w)],this);if(typeof u=="number")return this.$ms=u,this.parseFromMilliseconds(),this;if(typeof u=="object")return Object.keys(u).forEach(function(U){Y.$d[yt(U)]=u[U]}),this.calMilliseconds(),this;if(typeof u=="string"){var B=u.match(Q);if(B){var R=B.slice(2).map(function(U){return U!=null?Number(U):0});return this.$d.years=R[0],this.$d.months=R[1],this.$d.weeks=R[2],this.$d.days=R[3],this.$d.hours=R[4],this.$d.minutes=R[5],this.$d.seconds=R[6],this.calMilliseconds(),this}}return this}var h=E.prototype;return h.calMilliseconds=function(){var u=this;this.$ms=Object.keys(this.$d).reduce(function(w,I){return w+(u.$d[I]||0)*J[I]},0)},h.parseFromMilliseconds=function(){var u=this.$ms;this.$d.years=v(u/H),u%=H,this.$d.months=v(u/F),u%=F,this.$d.days=v(u/$),u%=$,this.$d.hours=v(u/i),u%=i,this.$d.minutes=v(u/A),u%=A,this.$d.seconds=v(u/lt),u%=lt,this.$d.milliseconds=u},h.toISOString=function(){var u=O(this.$d.years,"Y"),w=O(this.$d.months,"M"),I=+this.$d.days||0;this.$d.weeks&&(I+=7*this.$d.weeks);var Y=O(I,"D"),B=O(this.$d.hours,"H"),R=O(this.$d.minutes,"M"),U=this.$d.seconds||0;this.$d.milliseconds&&(U+=this.$d.milliseconds/1e3,U=Math.round(1e3*U)/1e3);var st=O(U,"S"),dt=u.negative||w.negative||Y.negative||B.negative||R.negative||st.negative,gt=B.format||R.format||st.format?"T":"",ot=(dt?"-":"")+"P"+u.format+w.format+Y.format+gt+B.format+R.format+st.format;return ot==="P"||ot==="-P"?"P0D":ot},h.toJSON=function(){return this.toISOString()},h.format=function(u){var w=u||"YYYY-MM-DDTHH:mm:ss",I={Y:this.$d.years,YY:M.s(this.$d.years,2,"0"),YYYY:M.s(this.$d.years,4,"0"),M:this.$d.months,MM:M.s(this.$d.months,2,"0"),D:this.$d.days,DD:M.s(this.$d.days,2,"0"),H:this.$d.hours,HH:M.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:M.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:M.s(this.$d.seconds,2,"0"),SSS:M.s(this.$d.milliseconds,3,"0")};return w.replace(S,function(Y,B){return B||String(I[Y])})},h.as=function(u){return this.$ms/J[yt(u)]},h.get=function(u){var w=this.$ms,I=yt(u);return I==="milliseconds"?w%=1e3:w=I==="weeks"?v(w/J[I]):this.$d[I],w||0},h.add=function(u,w,I){var Y;return Y=w?u*J[yt(w)]:b(u)?u.$ms:ut(u,this).$ms,ut(this.$ms+Y*(I?-1:1),this)},h.subtract=function(u,w){return this.add(u,w,!0)},h.locale=function(u){var w=this.clone();return w.$l=u,w},h.clone=function(){return ut(this.$ms,this)},h.humanize=function(u){return it().add(this.$ms,"ms").locale(this.$l).fromNow(!u)},h.valueOf=function(){return this.asMilliseconds()},h.milliseconds=function(){return this.get("milliseconds")},h.asMilliseconds=function(){return this.as("milliseconds")},h.seconds=function(){return this.get("seconds")},h.asSeconds=function(){return this.as("seconds")},h.minutes=function(){return this.get("minutes")},h.asMinutes=function(){return this.as("minutes")},h.hours=function(){return this.get("hours")},h.asHours=function(){return this.as("hours")},h.days=function(){return this.get("days")},h.asDays=function(){return this.as("days")},h.weeks=function(){return this.get("weeks")},h.asWeeks=function(){return this.as("weeks")},h.months=function(){return this.get("months")},h.asMonths=function(){return this.as("months")},h.years=function(){return this.get("years")},h.asYears=function(){return this.as("years")},E}(),q=function(E,h,u){return E.add(h.years()*u,"y").add(h.months()*u,"M").add(h.days()*u,"d").add(h.hours()*u,"h").add(h.minutes()*u,"m").add(h.seconds()*u,"s").add(h.milliseconds()*u,"ms")};return function(E,h,u){it=u,M=u().$utils(),u.duration=function(Y,B){var R=u.locale();return ut(Y,{$l:R},B)},u.isDuration=b;var w=h.prototype.add,I=h.prototype.subtract;h.prototype.add=function(Y,B){return b(Y)?q(this,Y,1):w.bind(this)(Y,B)},h.prototype.subtract=function(Y,B){return b(Y)?q(this,Y,-1):I.bind(this)(Y,B)}}})},96353:function(wt){(function(it,M){wt.exports=M()})(this,function(){"use strict";var it="day";return function(M,lt,A){var i=function(H){return H.add(4-H.isoWeekday(),it)},$=lt.prototype;$.isoWeekYear=function(){return i(this).year()},$.isoWeek=function(H){if(!this.$utils().u(H))return this.add(7*(H-this.isoWeek()),it);var F,Q,J,b,ut=i(this),yt=(F=this.isoWeekYear(),Q=this.$u,J=(Q?A.utc:A)().year(F).startOf("year"),b=4-J.isoWeekday(),J.isoWeekday()>4&&(b+=7),J.add(b,it));return ut.diff(yt,"week")+1},$.isoWeekday=function(H){return this.$utils().u(H)?this.day()||7:this.day(this.day()%7?H:H-7)};var S=$.startOf;$.startOf=function(H,F){var Q=this.$utils(),J=!!Q.u(F)||F;return Q.p(H)==="isoweek"?J?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):S.bind(this)(H,F)}}})},54669:function(wt,it,M){"use strict";M.d(it,{diagram:function(){return Ke}});var lt=M(47901),A=M(23661),i=M(22092),$=M(12657),S=M(51218),H=M(96353),F=M(69904),Q=M(6004),J=M(99036),b=M(48313),ut=function(){var t=(0,i.eW)(function(y,c,l,f){for(l=l||{},f=y.length;f--;l[y[f]]=c);return l},"o"),r=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],n=[1,26],o=[1,27],a=[1,28],k=[1,29],x=[1,30],j=[1,31],rt=[1,32],Tt=[1,33],z=[1,34],nt=[1,9],bt=[1,10],ht=[1,11],kt=[1,12],P=[1,13],Bt=[1,14],zt=[1,15],Ht=[1,16],Ut=[1,19],Lt=[1,20],jt=[1,21],Gt=[1,22],Kt=[1,23],Zt=[1,25],p=[1,35],D={trace:(0,i.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,i.eW)(function(c,l,f,d,g,s,G){var e=s.length-1;switch(g){case 1:return s[e-1];case 2:this.$=[];break;case 3:s[e-1].push(s[e]),this.$=s[e-1];break;case 4:case 5:this.$=s[e];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=s[e].substr(18);break;case 19:d.TopAxis(),this.$=s[e].substr(8);break;case 20:d.setAxisFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 21:d.setTickInterval(s[e].substr(13)),this.$=s[e].substr(13);break;case 22:d.setExcludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 23:d.setIncludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 24:d.setTodayMarker(s[e].substr(12)),this.$=s[e].substr(12);break;case 27:d.setDiagramTitle(s[e].substr(6)),this.$=s[e].substr(6);break;case 28:this.$=s[e].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=s[e].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(s[e].substr(8)),this.$=s[e].substr(8);break;case 33:d.addTask(s[e-1],s[e]),this.$="task";break;case 34:this.$=s[e-1],d.setClickEvent(s[e-1],s[e],null);break;case 35:this.$=s[e-2],d.setClickEvent(s[e-2],s[e-1],s[e]);break;case 36:this.$=s[e-2],d.setClickEvent(s[e-2],s[e-1],null),d.setLink(s[e-2],s[e]);break;case 37:this.$=s[e-3],d.setClickEvent(s[e-3],s[e-2],s[e-1]),d.setLink(s[e-3],s[e]);break;case 38:this.$=s[e-2],d.setClickEvent(s[e-2],s[e],null),d.setLink(s[e-2],s[e-1]);break;case 39:this.$=s[e-3],d.setClickEvent(s[e-3],s[e-1],s[e]),d.setLink(s[e-3],s[e-2]);break;case 40:this.$=s[e-1],d.setLink(s[e-1],s[e]);break;case 41:case 47:this.$=s[e-1]+" "+s[e];break;case 42:case 43:case 45:this.$=s[e-2]+" "+s[e-1]+" "+s[e];break;case 44:case 46:this.$=s[e-3]+" "+s[e-2]+" "+s[e-1]+" "+s[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(r,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:n,13:o,14:a,15:k,16:x,17:j,18:rt,19:18,20:Tt,21:z,22:nt,23:bt,24:ht,25:kt,26:P,27:Bt,28:zt,29:Ht,30:Ut,31:Lt,33:jt,35:Gt,36:Kt,37:24,38:Zt,40:p},t(r,[2,7],{1:[2,1]}),t(r,[2,3]),{9:36,11:17,12:n,13:o,14:a,15:k,16:x,17:j,18:rt,19:18,20:Tt,21:z,22:nt,23:bt,24:ht,25:kt,26:P,27:Bt,28:zt,29:Ht,30:Ut,31:Lt,33:jt,35:Gt,36:Kt,37:24,38:Zt,40:p},t(r,[2,5]),t(r,[2,6]),t(r,[2,17]),t(r,[2,18]),t(r,[2,19]),t(r,[2,20]),t(r,[2,21]),t(r,[2,22]),t(r,[2,23]),t(r,[2,24]),t(r,[2,25]),t(r,[2,26]),t(r,[2,27]),{32:[1,37]},{34:[1,38]},t(r,[2,30]),t(r,[2,31]),t(r,[2,32]),{39:[1,39]},t(r,[2,8]),t(r,[2,9]),t(r,[2,10]),t(r,[2,11]),t(r,[2,12]),t(r,[2,13]),t(r,[2,14]),t(r,[2,15]),t(r,[2,16]),{41:[1,40],43:[1,41]},t(r,[2,4]),t(r,[2,28]),t(r,[2,29]),t(r,[2,33]),t(r,[2,34],{42:[1,42],43:[1,43]}),t(r,[2,40],{41:[1,44]}),t(r,[2,35],{43:[1,45]}),t(r,[2,36]),t(r,[2,38],{42:[1,46]}),t(r,[2,37]),t(r,[2,39])],defaultActions:{},parseError:(0,i.eW)(function(c,l){if(l.recoverable)this.trace(c);else{var f=new Error(c);throw f.hash=l,f}},"parseError"),parse:(0,i.eW)(function(c){var l=this,f=[0],d=[],g=[null],s=[],G=this.table,e="",m=0,V=0,C=0,L=2,tt=1,K=s.slice.call(arguments,1),Z=Object.create(this.lexer),xt={yy:{}};for(var de in this.yy)Object.prototype.hasOwnProperty.call(this.yy,de)&&(xt.yy[de]=this.yy[de]);Z.setInput(c,xt.yy),xt.yy.lexer=Z,xt.yy.parser=this,typeof Z.yylloc>"u"&&(Z.yylloc={});var fe=Z.yylloc;s.push(fe);var Ze=Z.options&&Z.options.ranges;typeof xt.yy.parseError=="function"?this.parseError=xt.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Xe(ft){f.length=f.length-2*ft,g.length=g.length-ft,s.length=s.length-ft}(0,i.eW)(Xe,"popStack");function We(){var ft;return ft=d.pop()||Z.lex()||tt,typeof ft!="number"&&(ft instanceof Array&&(d=ft,ft=d.pop()),ft=l.symbols_[ft]||ft),ft}(0,i.eW)(We,"lex");for(var at,he,Wt,mt,Qe,ke,Ot={},te,_t,Ee,ee;;){if(Wt=f[f.length-1],this.defaultActions[Wt]?mt=this.defaultActions[Wt]:((at===null||typeof at>"u")&&(at=We()),mt=G[Wt]&&G[Wt][at]),typeof mt>"u"||!mt.length||!mt[0]){var me="";ee=[];for(te in G[Wt])this.terminals_[te]&&te>L&&ee.push("'"+this.terminals_[te]+"'");Z.showPosition?me="Parse error on line "+(m+1)+`:
`+Z.showPosition()+`
Expecting `+ee.join(", ")+", got '"+(this.terminals_[at]||at)+"'":me="Parse error on line "+(m+1)+": Unexpected "+(at==tt?"end of input":"'"+(this.terminals_[at]||at)+"'"),this.parseError(me,{text:Z.match,token:this.terminals_[at]||at,line:Z.yylineno,loc:fe,expected:ee})}if(mt[0]instanceof Array&&mt.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Wt+", token: "+at);switch(mt[0]){case 1:f.push(at),g.push(Z.yytext),s.push(Z.yylloc),f.push(mt[1]),at=null,he?(at=he,he=null):(V=Z.yyleng,e=Z.yytext,m=Z.yylineno,fe=Z.yylloc,C>0&&C--);break;case 2:if(_t=this.productions_[mt[1]][1],Ot.$=g[g.length-_t],Ot._$={first_line:s[s.length-(_t||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(_t||1)].first_column,last_column:s[s.length-1].last_column},Ze&&(Ot._$.range=[s[s.length-(_t||1)].range[0],s[s.length-1].range[1]]),ke=this.performAction.apply(Ot,[e,V,m,xt.yy,mt[1],g,s].concat(K)),typeof ke<"u")return ke;_t&&(f=f.slice(0,-1*_t*2),g=g.slice(0,-1*_t),s=s.slice(0,-1*_t)),f.push(this.productions_[mt[1]][0]),g.push(Ot.$),s.push(Ot._$),Ee=G[f[f.length-2]][f[f.length-1]],f.push(Ee);break;case 3:return!0}}return!0},"parse")},W=function(){var y={EOF:1,parseError:(0,i.eW)(function(l,f){if(this.yy.parser)this.yy.parser.parseError(l,f);else throw new Error(l)},"parseError"),setInput:(0,i.eW)(function(c,l){return this.yy=l||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,i.eW)(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var l=c.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:(0,i.eW)(function(c){var l=c.length,f=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),f.length-1&&(this.yylineno-=f.length-1);var g=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:f?(f.length===d.length?this.yylloc.first_column:0)+d[d.length-f.length].length-f[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[g[0],g[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:(0,i.eW)(function(){return this._more=!0,this},"more"),reject:(0,i.eW)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,i.eW)(function(c){this.unput(this.match.slice(c))},"less"),pastInput:(0,i.eW)(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,i.eW)(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,i.eW)(function(){var c=this.pastInput(),l=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:(0,i.eW)(function(c,l){var f,d,g;if(this.options.backtrack_lexer&&(g={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(g.yylloc.range=this.yylloc.range.slice(0))),d=c[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],f=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),f)return f;if(this._backtrack){for(var s in g)this[s]=g[s];return!1}return!1},"test_match"),next:(0,i.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,l,f,d;this._more||(this.yytext="",this.match="");for(var g=this._currentRules(),s=0;s<g.length;s++)if(f=this._input.match(this.rules[g[s]]),f&&(!l||f[0].length>l[0].length)){if(l=f,d=s,this.options.backtrack_lexer){if(c=this.test_match(f,g[s]),c!==!1)return c;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(c=this.test_match(l,g[d]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,i.eW)(function(){var l=this.next();return l||this.lex()},"lex"),begin:(0,i.eW)(function(l){this.conditionStack.push(l)},"begin"),popState:(0,i.eW)(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,i.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,i.eW)(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:(0,i.eW)(function(l){this.begin(l)},"pushState"),stateStackSize:(0,i.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,i.eW)(function(l,f,d,g){var s=g;switch(d){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return y}();D.lexer=W;function _(){this.yy={}}return(0,i.eW)(_,"Parser"),_.prototype=D,D.Parser=_,new _}();ut.parser=ut;var yt=ut;S.extend(H),S.extend(F),S.extend(Q);var T={friday:5,saturday:6},v="",N="",O=void 0,et="",q=[],E=[],h=new Map,u=[],w=[],I="",Y="",B=["active","done","crit","milestone","vert"],R=[],U=!1,st=!1,dt="sunday",gt="saturday",ot=0,vt=(0,i.eW)(function(){u=[],w=[],I="",R=[],Jt=0,ce=void 0,qt=void 0,X=[],v="",N="",Y="",O=void 0,et="",q=[],E=[],U=!1,st=!1,ot=0,h=new Map,(0,A.ZH)(),dt="sunday",gt="saturday"},"clear"),Et=(0,i.eW)(function(t){N=t},"setAxisFormat"),ct=(0,i.eW)(function(){return N},"getAxisFormat"),Yt=(0,i.eW)(function(t){O=t},"setTickInterval"),Mt=(0,i.eW)(function(){return O},"getTickInterval"),se=(0,i.eW)(function(t){et=t},"setTodayMarker"),ie=(0,i.eW)(function(){return et},"getTodayMarker"),re=(0,i.eW)(function(t){v=t},"setDateFormat"),ne=(0,i.eW)(function(){U=!0},"enableInclusiveEndDates"),ae=(0,i.eW)(function(){return U},"endDatesAreInclusive"),Xt=(0,i.eW)(function(){st=!0},"enableTopAxis"),Qt=(0,i.eW)(function(){return st},"topAxisEnabled"),At=(0,i.eW)(function(t){Y=t},"setDisplayMode"),$t=(0,i.eW)(function(){return Y},"getDisplayMode"),Ft=(0,i.eW)(function(){return v},"getDateFormat"),Ct=(0,i.eW)(function(t){q=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),St=(0,i.eW)(function(){return q},"getIncludes"),Pt=(0,i.eW)(function(t){E=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),Rt=(0,i.eW)(function(){return E},"getExcludes"),Vt=(0,i.eW)(function(){return h},"getLinks"),Nt=(0,i.eW)(function(t){I=t,u.push(t)},"addSection"),ye=(0,i.eW)(function(){return u},"getSections"),Me=(0,i.eW)(function(){let t=xe();const r=10;let n=0;for(;!t&&n<r;)t=xe(),n++;return w=X,w},"getTasks"),ge=(0,i.eW)(function(t,r,n,o){const a=t.format(r.trim()),k=t.format("YYYY-MM-DD");return o.includes(a)||o.includes(k)?!1:n.includes("weekends")&&(t.isoWeekday()===T[gt]||t.isoWeekday()===T[gt]+1)||n.includes(t.format("dddd").toLowerCase())?!0:n.includes(a)||n.includes(k)},"isInvalidDate"),Ce=(0,i.eW)(function(t){dt=t},"setWeekday"),Se=(0,i.eW)(function(){return dt},"getWeekday"),Ie=(0,i.eW)(function(t){gt=t},"setWeekend"),ve=(0,i.eW)(function(t,r,n,o){if(!n.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=S(t.startTime):a=S(t.startTime,r,!0),a=a.add(1,"d");let k;t.endTime instanceof Date?k=S(t.endTime):k=S(t.endTime,r,!0);const[x,j]=Le(a,k,r,n,o);t.endTime=x.toDate(),t.renderEndTime=j},"checkTaskDates"),Le=(0,i.eW)(function(t,r,n,o,a){let k=!1,x=null;for(;t<=r;)k||(x=r.toDate()),k=ge(t,n,o,a),k&&(r=r.add(1,"d")),t=t.add(1,"d");return[r,x]},"fixTaskDates"),oe=(0,i.eW)(function(t,r,n){if(n=n.trim(),(0,i.eW)(j=>{const rt=j.trim();return rt==="x"||rt==="X"},"isTimestampFormat")(r)&&/^\d+$/.test(n))return new Date(Number(n));const k=/^after\s+(?<ids>[\d\w- ]+)/.exec(n);if(k!==null){let j=null;for(const Tt of k.groups.ids.split(" ")){let z=Dt(Tt);z!==void 0&&(!j||z.endTime>j.endTime)&&(j=z)}if(j)return j.endTime;const rt=new Date;return rt.setHours(0,0,0,0),rt}let x=S(n,r.trim(),!0);if(x.isValid())return x.toDate();{i.cM.debug("Invalid date:"+n),i.cM.debug("With date format:"+r.trim());const j=new Date(n);if(j===void 0||isNaN(j.getTime())||j.getFullYear()<-1e4||j.getFullYear()>1e4)throw new Error("Invalid date:"+n);return j}},"getStartDate"),pe=(0,i.eW)(function(t){const r=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return r!==null?[Number.parseFloat(r[1]),r[2]]:[NaN,"ms"]},"parseDuration"),Te=(0,i.eW)(function(t,r,n,o=!1){n=n.trim();const k=/^until\s+(?<ids>[\d\w- ]+)/.exec(n);if(k!==null){let z=null;for(const bt of k.groups.ids.split(" ")){let ht=Dt(bt);ht!==void 0&&(!z||ht.startTime<z.startTime)&&(z=ht)}if(z)return z.startTime;const nt=new Date;return nt.setHours(0,0,0,0),nt}let x=S(n,r.trim(),!0);if(x.isValid())return o&&(x=x.add(1,"d")),x.toDate();let j=S(t);const[rt,Tt]=pe(n);if(!Number.isNaN(rt)){const z=j.add(rt,Tt);z.isValid()&&(j=z)}return j.toDate()},"getEndDate"),Jt=0,It=(0,i.eW)(function(t){return t===void 0?(Jt=Jt+1,"task"+Jt):t},"parseId"),Oe=(0,i.eW)(function(t,r){let n;r.substr(0,1)===":"?n=r.substr(1,r.length):n=r;const o=n.split(","),a={};le(o,a,B);for(let x=0;x<o.length;x++)o[x]=o[x].trim();let k="";switch(o.length){case 1:a.id=It(),a.startTime=t.endTime,k=o[0];break;case 2:a.id=It(),a.startTime=oe(void 0,v,o[0]),k=o[1];break;case 3:a.id=It(o[0]),a.startTime=oe(void 0,v,o[1]),k=o[2];break;default:}return k&&(a.endTime=Te(a.startTime,v,k,U),a.manualEndTime=S(k,"YYYY-MM-DD",!0).isValid(),ve(a,v,E,q)),a},"compileData"),Ye=(0,i.eW)(function(t,r){let n;r.substr(0,1)===":"?n=r.substr(1,r.length):n=r;const o=n.split(","),a={};le(o,a,B);for(let k=0;k<o.length;k++)o[k]=o[k].trim();switch(o.length){case 1:a.id=It(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:o[0]};break;case 2:a.id=It(),a.startTime={type:"getStartDate",startData:o[0]},a.endTime={data:o[1]};break;case 3:a.id=It(o[0]),a.startTime={type:"getStartDate",startData:o[1]},a.endTime={data:o[2]};break;default:}return a},"parseData"),ce,qt,X=[],be={},Ae=(0,i.eW)(function(t,r){const n={section:I,type:I,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:r},task:t,classes:[]},o=Ye(qt,r);n.raw.startTime=o.startTime,n.raw.endTime=o.endTime,n.id=o.id,n.prevTaskId=qt,n.active=o.active,n.done=o.done,n.crit=o.crit,n.milestone=o.milestone,n.vert=o.vert,n.order=ot,ot++;const a=X.push(n);qt=n.id,be[n.id]=a-1},"addTask"),Dt=(0,i.eW)(function(t){const r=be[t];return X[r]},"findTaskById"),$e=(0,i.eW)(function(t,r){const n={section:I,type:I,description:t,task:t,classes:[]},o=Oe(ce,r);n.startTime=o.startTime,n.endTime=o.endTime,n.id=o.id,n.active=o.active,n.done=o.done,n.crit=o.crit,n.milestone=o.milestone,n.vert=o.vert,ce=n,w.push(n)},"addTaskOrg"),xe=(0,i.eW)(function(){const t=(0,i.eW)(function(n){const o=X[n];let a="";switch(X[n].raw.startTime.type){case"prevTaskEnd":{const k=Dt(o.prevTaskId);o.startTime=k.endTime;break}case"getStartDate":a=oe(void 0,v,X[n].raw.startTime.startData),a&&(X[n].startTime=a);break}return X[n].startTime&&(X[n].endTime=Te(X[n].startTime,v,X[n].raw.endTime.data,U),X[n].endTime&&(X[n].processed=!0,X[n].manualEndTime=S(X[n].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),ve(X[n],v,E,q))),X[n].processed},"compileTask");let r=!0;for(const[n,o]of X.entries())t(n),r=r&&o.processed;return r},"compileTasks"),Fe=(0,i.eW)(function(t,r){let n=r;(0,A.nV)().securityLevel!=="loose"&&(n=(0,$.N)(r)),t.split(",").forEach(function(o){Dt(o)!==void 0&&(we(o,()=>{window.open(n,"_self")}),h.set(o,n))}),_e(t,"clickable")},"setLink"),_e=(0,i.eW)(function(t,r){t.split(",").forEach(function(n){let o=Dt(n);o!==void 0&&o.classes.push(r)})},"setClass"),Pe=(0,i.eW)(function(t,r,n){if((0,A.nV)().securityLevel!=="loose"||r===void 0)return;let o=[];if(typeof n=="string"){o=n.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let k=0;k<o.length;k++){let x=o[k].trim();x.startsWith('"')&&x.endsWith('"')&&(x=x.substr(1,x.length-2)),o[k]=x}}o.length===0&&o.push(t),Dt(t)!==void 0&&we(t,()=>{lt.w8.runFunc(r,...o)})},"setClickFun"),we=(0,i.eW)(function(t,r){R.push(function(){const n=document.querySelector(`[id="${t}"]`);n!==null&&n.addEventListener("click",function(){r()})},function(){const n=document.querySelector(`[id="${t}-text"]`);n!==null&&n.addEventListener("click",function(){r()})})},"pushFun"),Re=(0,i.eW)(function(t,r,n){t.split(",").forEach(function(o){Pe(o,r,n)}),_e(t,"clickable")},"setClickEvent"),Ve=(0,i.eW)(function(t){R.forEach(function(r){r(t)})},"bindFunctions"),Ne={getConfig:(0,i.eW)(()=>(0,A.nV)().gantt,"getConfig"),clear:vt,setDateFormat:re,getDateFormat:Ft,enableInclusiveEndDates:ne,endDatesAreInclusive:ae,enableTopAxis:Xt,topAxisEnabled:Qt,setAxisFormat:Et,getAxisFormat:ct,setTickInterval:Yt,getTickInterval:Mt,setTodayMarker:se,getTodayMarker:ie,setAccTitle:A.GN,getAccTitle:A.eu,setDiagramTitle:A.g2,getDiagramTitle:A.Kr,setDisplayMode:At,getDisplayMode:$t,setAccDescription:A.U$,getAccDescription:A.Mx,addSection:Nt,getSections:ye,getTasks:Me,addTask:Ae,findTaskById:Dt,addTaskOrg:$e,setIncludes:Ct,getIncludes:St,setExcludes:Pt,getExcludes:Rt,setClickEvent:Re,setLink:Fe,getLinks:Vt,bindFunctions:Ve,parseDuration:pe,isInvalidDate:ge,setWeekday:Ce,getWeekday:Se,setWeekend:Ie};function le(t,r,n){let o=!0;for(;o;)o=!1,n.forEach(function(a){const k="^\\s*"+a+"\\s*$",x=new RegExp(k);t[0].match(x)&&(r[a]=!0,t.shift(1),o=!0)})}(0,i.eW)(le,"getTaskTags"),S.extend(J);var Be=(0,i.eW)(function(){i.cM.debug("Something is calling, setConf, remove the call")},"setConf"),De={monday:b.Ox9,tuesday:b.YDX,wednesday:b.EFj,thursday:b.Igq,friday:b.y2j,saturday:b.LqH,sunday:b.Zyz},ze=(0,i.eW)((t,r)=>{let n=[...t].map(()=>-1/0),o=[...t].sort((k,x)=>k.startTime-x.startTime||k.order-x.order),a=0;for(const k of o)for(let x=0;x<n.length;x++)if(k.startTime>=n[x]){n[x]=k.endTime,k.order=x+r,x>a&&(a=x);break}return a},"getMaxIntersections"),pt,ue=1e4,He=(0,i.eW)(function(t,r,n,o){const a=(0,A.nV)().gantt,k=(0,A.nV)().securityLevel;let x;k==="sandbox"&&(x=(0,b.Ys)("#i"+r));const j=k==="sandbox"?(0,b.Ys)(x.nodes()[0].contentDocument.body):(0,b.Ys)("body"),rt=k==="sandbox"?x.nodes()[0].contentDocument:document,Tt=rt.getElementById(r);pt=Tt.parentElement.offsetWidth,pt===void 0&&(pt=1200),a.useWidth!==void 0&&(pt=a.useWidth);const z=o.db.getTasks();let nt=[];for(const p of z)nt.push(p.type);nt=Zt(nt);const bt={};let ht=2*a.topPadding;if(o.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const p={};for(const W of z)p[W.section]===void 0?p[W.section]=[W]:p[W.section].push(W);let D=0;for(const W of Object.keys(p)){const _=ze(p[W],D)+1;D+=_,ht+=_*(a.barHeight+a.barGap),bt[W]=_}}else{ht+=z.length*(a.barHeight+a.barGap);for(const p of nt)bt[p]=z.filter(D=>D.type===p).length}Tt.setAttribute("viewBox","0 0 "+pt+" "+ht);const kt=j.select(`[id="${r}"]`),P=(0,b.Xf)().domain([(0,b.VV$)(z,function(p){return p.startTime}),(0,b.Fp7)(z,function(p){return p.endTime})]).rangeRound([0,pt-a.leftPadding-a.rightPadding]);function Bt(p,D){const W=p.startTime,_=D.startTime;let y=0;return W>_?y=1:W<_&&(y=-1),y}(0,i.eW)(Bt,"taskCompare"),z.sort(Bt),zt(z,pt,ht),(0,A.v2)(kt,ht,pt,a.useMaxWidth),kt.append("text").text(o.db.getDiagramTitle()).attr("x",pt/2).attr("y",a.titleTopMargin).attr("class","titleText");function zt(p,D,W){const _=a.barHeight,y=_+a.barGap,c=a.topPadding,l=a.leftPadding,f=(0,b.BYU)().domain([0,nt.length]).range(["#00B9FA","#F95002"]).interpolate(b.JHv);Ut(y,c,l,D,W,p,o.db.getExcludes(),o.db.getIncludes()),jt(l,c,D,W),Ht(p,y,c,l,_,f,D,W),Gt(y,c,l,_,f),Kt(l,c,D,W)}(0,i.eW)(zt,"makeGantt");function Ht(p,D,W,_,y,c,l){p.sort((e,m)=>e.vert===m.vert?0:e.vert?1:-1);const d=[...new Set(p.map(e=>e.order))].map(e=>p.find(m=>m.order===e));kt.append("g").selectAll("rect").data(d).enter().append("rect").attr("x",0).attr("y",function(e,m){return m=e.order,m*D+W-2}).attr("width",function(){return l-a.rightPadding/2}).attr("height",D).attr("class",function(e){for(const[m,V]of nt.entries())if(e.type===V)return"section section"+m%a.numberSectionStyles;return"section section0"}).enter();const g=kt.append("g").selectAll("rect").data(p).enter(),s=o.db.getLinks();if(g.append("rect").attr("id",function(e){return e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?P(e.startTime)+_+.5*(P(e.endTime)-P(e.startTime))-.5*y:P(e.startTime)+_}).attr("y",function(e,m){return m=e.order,e.vert?a.gridLineStartPadding:m*D+W}).attr("width",function(e){return e.milestone?y:e.vert?.08*y:P(e.renderEndTime||e.endTime)-P(e.startTime)}).attr("height",function(e){return e.vert?z.length*(a.barHeight+a.barGap)+a.barHeight*2:y}).attr("transform-origin",function(e,m){return m=e.order,(P(e.startTime)+_+.5*(P(e.endTime)-P(e.startTime))).toString()+"px "+(m*D+W+.5*y).toString()+"px"}).attr("class",function(e){const m="task";let V="";e.classes.length>0&&(V=e.classes.join(" "));let C=0;for(const[tt,K]of nt.entries())e.type===K&&(C=tt%a.numberSectionStyles);let L="";return e.active?e.crit?L+=" activeCrit":L=" active":e.done?e.crit?L=" doneCrit":L=" done":e.crit&&(L+=" crit"),L.length===0&&(L=" task"),e.milestone&&(L=" milestone "+L),e.vert&&(L=" vert "+L),L+=C,L+=" "+V,m+L}),g.append("text").attr("id",function(e){return e.id+"-text"}).text(function(e){return e.task}).attr("font-size",a.fontSize).attr("x",function(e){let m=P(e.startTime),V=P(e.renderEndTime||e.endTime);if(e.milestone&&(m+=.5*(P(e.endTime)-P(e.startTime))-.5*y,V=m+y),e.vert)return P(e.startTime)+_;const C=this.getBBox().width;return C>V-m?V+C+1.5*a.leftPadding>l?m+_-5:V+_+5:(V-m)/2+m+_}).attr("y",function(e,m){return e.vert?a.gridLineStartPadding+z.length*(a.barHeight+a.barGap)+60:(m=e.order,m*D+a.barHeight/2+(a.fontSize/2-2)+W)}).attr("text-height",y).attr("class",function(e){const m=P(e.startTime);let V=P(e.endTime);e.milestone&&(V=m+y);const C=this.getBBox().width;let L="";e.classes.length>0&&(L=e.classes.join(" "));let tt=0;for(const[Z,xt]of nt.entries())e.type===xt&&(tt=Z%a.numberSectionStyles);let K="";return e.active&&(e.crit?K="activeCritText"+tt:K="activeText"+tt),e.done?e.crit?K=K+" doneCritText"+tt:K=K+" doneText"+tt:e.crit&&(K=K+" critText"+tt),e.milestone&&(K+=" milestoneText"),e.vert&&(K+=" vertText"),C>V-m?V+C+1.5*a.leftPadding>l?L+" taskTextOutsideLeft taskTextOutside"+tt+" "+K:L+" taskTextOutsideRight taskTextOutside"+tt+" "+K+" width-"+C:L+" taskText taskText"+tt+" "+K+" width-"+C}),(0,A.nV)().securityLevel==="sandbox"){let e;e=(0,b.Ys)("#i"+r);const m=e.nodes()[0].contentDocument;g.filter(function(V){return s.has(V.id)}).each(function(V){var C=m.querySelector("#"+V.id),L=m.querySelector("#"+V.id+"-text");const tt=C.parentNode;var K=m.createElement("a");K.setAttribute("xlink:href",s.get(V.id)),K.setAttribute("target","_top"),tt.appendChild(K),K.appendChild(C),K.appendChild(L)})}}(0,i.eW)(Ht,"drawRects");function Ut(p,D,W,_,y,c,l,f){if(l.length===0&&f.length===0)return;let d,g;for(const{startTime:C,endTime:L}of c)(d===void 0||C<d)&&(d=C),(g===void 0||L>g)&&(g=L);if(!d||!g)return;if(S(g).diff(S(d),"year")>5){i.cM.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const s=o.db.getDateFormat(),G=[];let e=null,m=S(d);for(;m.valueOf()<=g;)o.db.isInvalidDate(m,s,l,f)?e?e.end=m:e={start:m,end:m}:e&&(G.push(e),e=null),m=m.add(1,"d");kt.append("g").selectAll("rect").data(G).enter().append("rect").attr("id",C=>"exclude-"+C.start.format("YYYY-MM-DD")).attr("x",C=>P(C.start.startOf("day"))+W).attr("y",a.gridLineStartPadding).attr("width",C=>P(C.end.endOf("day"))-P(C.start.startOf("day"))).attr("height",y-D-a.gridLineStartPadding).attr("transform-origin",function(C,L){return(P(C.start)+W+.5*(P(C.end)-P(C.start))).toString()+"px "+(L*p+.5*y).toString()+"px"}).attr("class","exclude-range")}(0,i.eW)(Ut,"drawExcludeDays");function Lt(p,D,W,_){if(W<=0||p>D)return 1/0;const y=D-p,c=S.duration({[_??"day"]:W}).asMilliseconds();return c<=0?1/0:Math.ceil(y/c)}(0,i.eW)(Lt,"getEstimatedTickCount");function jt(p,D,W,_){const y=o.db.getDateFormat(),c=o.db.getAxisFormat();let l;c?l=c:y==="D"?l="%d":l=a.axisFormat??"%Y-%m-%d";let f=(0,b.LLu)(P).tickSize(-_+D+a.gridLineStartPadding).tickFormat((0,b.i$Z)(l));const g=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(o.db.getTickInterval()||a.tickInterval);if(g!==null){const s=parseInt(g[1],10);if(isNaN(s)||s<=0)i.cM.warn(`Invalid tick interval value: "${g[1]}". Skipping custom tick interval.`);else{const G=g[2],e=o.db.getWeekday()||a.weekday,m=P.domain(),V=m[0],C=m[1],L=Lt(V,C,s,G);if(L>ue)i.cM.warn(`The tick interval "${s}${G}" would generate ${L} ticks, which exceeds the maximum allowed (${ue}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(G){case"millisecond":f.ticks(b.U8T.every(s));break;case"second":f.ticks(b.S1K.every(s));break;case"minute":f.ticks(b.Z_i.every(s));break;case"hour":f.ticks(b.WQD.every(s));break;case"day":f.ticks(b.rr1.every(s));break;case"week":f.ticks(De[e].every(s));break;case"month":f.ticks(b.F0B.every(s));break}}}if(kt.append("g").attr("class","grid").attr("transform","translate("+p+", "+(_-50)+")").call(f).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),o.db.topAxisEnabled()||a.topAxis){let s=(0,b.F5q)(P).tickSize(-_+D+a.gridLineStartPadding).tickFormat((0,b.i$Z)(l));if(g!==null){const G=parseInt(g[1],10);if(isNaN(G)||G<=0)i.cM.warn(`Invalid tick interval value: "${g[1]}". Skipping custom tick interval.`);else{const e=g[2],m=o.db.getWeekday()||a.weekday,V=P.domain(),C=V[0],L=V[1];if(Lt(C,L,G,e)<=ue)switch(e){case"millisecond":s.ticks(b.U8T.every(G));break;case"second":s.ticks(b.S1K.every(G));break;case"minute":s.ticks(b.Z_i.every(G));break;case"hour":s.ticks(b.WQD.every(G));break;case"day":s.ticks(b.rr1.every(G));break;case"week":s.ticks(De[m].every(G));break;case"month":s.ticks(b.F0B.every(G));break}}}kt.append("g").attr("class","grid").attr("transform","translate("+p+", "+D+")").call(s).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}(0,i.eW)(jt,"makeGrid");function Gt(p,D){let W=0;const _=Object.keys(bt).map(y=>[y,bt[y]]);kt.append("g").selectAll("text").data(_).enter().append(function(y){const c=y[0].split(A.SY.lineBreakRegex),l=-(c.length-1)/2,f=rt.createElementNS("http://www.w3.org/2000/svg","text");f.setAttribute("dy",l+"em");for(const[d,g]of c.entries()){const s=rt.createElementNS("http://www.w3.org/2000/svg","tspan");s.setAttribute("alignment-baseline","central"),s.setAttribute("x","10"),d>0&&s.setAttribute("dy","1em"),s.textContent=g,f.appendChild(s)}return f}).attr("x",10).attr("y",function(y,c){if(c>0)for(let l=0;l<c;l++)return W+=_[c-1][1],y[1]*p/2+W*p+D;else return y[1]*p/2+D}).attr("font-size",a.sectionFontSize).attr("class",function(y){for(const[c,l]of nt.entries())if(y[0]===l)return"sectionTitle sectionTitle"+c%a.numberSectionStyles;return"sectionTitle"})}(0,i.eW)(Gt,"vertLabels");function Kt(p,D,W,_){const y=o.db.getTodayMarker();if(y==="off")return;const c=kt.append("g").attr("class","today"),l=new Date,f=c.append("line");f.attr("x1",P(l)+p).attr("x2",P(l)+p).attr("y1",a.titleTopMargin).attr("y2",_-a.titleTopMargin).attr("class","today"),y!==""&&f.attr("style",y.replace(/,/g,";"))}(0,i.eW)(Kt,"drawToday");function Zt(p){const D={},W=[];for(let _=0,y=p.length;_<y;++_)Object.prototype.hasOwnProperty.call(D,p[_])||(D[p[_]]=!0,W.push(p[_]));return W}(0,i.eW)(Zt,"checkUnique")},"draw"),Ue={setConf:Be,draw:He},je=(0,i.eW)(t=>`
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
`,"getStyles"),Ge=je,Ke={parser:yt,db:Ne,renderer:Ue,styles:Ge}}}]);})();
