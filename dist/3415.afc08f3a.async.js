(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[3415],{850868:function(_t){(function(it,K){_t.exports=K()})(this,function(){"use strict";return function(it,K){var ut=K.prototype,$=ut.format;ut.format=function(P){var e=this,X=this.$locale();if(!this.isValid())return $.bind(this)(P);var b=this.$utils(),R=(P||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(J){switch(J){case"Q":return Math.ceil((e.$M+1)/3);case"Do":return X.ordinal(e.$D);case"gggg":return e.weekYear();case"GGGG":return e.isoWeekYear();case"wo":return X.ordinal(e.week(),"W");case"w":case"ww":return b.s(e.week(),J==="w"?1:2,"0");case"W":case"WW":return b.s(e.isoWeek(),J==="W"?1:2,"0");case"k":case"kk":return b.s(String(e.$H===0?24:e.$H),J==="k"?1:2,"0");case"X":return Math.floor(e.$d.getTime()/1e3);case"x":return e.$d.getTime();case"z":return"["+e.offsetName()+"]";case"zzz":return"["+e.offsetName("long")+"]";default:return J}});return $.bind(this)(R)}}})},514076:function(_t){(function(it,K){_t.exports=K()})(this,function(){"use strict";var it={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},K=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,ut=/\d/,$=/\d\d/,P=/\d\d?/,e=/\d*[^-_:/,()\s\d]+/,X={},b=function(g){return(g=+g)+(g>68?1900:2e3)},R=function(g){return function(D){this[g]=+D}},J=[/[+-]\d\d:?(\d\d)?|Z/,function(g){(this.zone||(this.zone={})).offset=function(D){if(!D||D==="Z")return 0;var I=D.match(/([+-]|\d\d)/g),Y=60*I[1]+(+I[2]||0);return Y===0?0:I[0]==="+"?-Y:Y}(g)}],q=function(g){var D=X[g];return D&&(D.indexOf?D:D.s.concat(D.f))},dt=function(g,D){var I,Y=X.meridiem;if(Y){for(var et=1;et<=24;et+=1)if(g.indexOf(Y(et,0,D))>-1){I=et>12;break}}else I=g===(D?"pm":"PM");return I},T={A:[e,function(g){this.afternoon=dt(g,!1)}],a:[e,function(g){this.afternoon=dt(g,!0)}],Q:[ut,function(g){this.month=3*(g-1)+1}],S:[ut,function(g){this.milliseconds=100*+g}],SS:[$,function(g){this.milliseconds=10*+g}],SSS:[/\d{3}/,function(g){this.milliseconds=+g}],s:[P,R("seconds")],ss:[P,R("seconds")],m:[P,R("minutes")],mm:[P,R("minutes")],H:[P,R("hours")],h:[P,R("hours")],HH:[P,R("hours")],hh:[P,R("hours")],D:[P,R("day")],DD:[$,R("day")],Do:[e,function(g){var D=X.ordinal,I=g.match(/\d+/);if(this.day=I[0],D)for(var Y=1;Y<=31;Y+=1)D(Y).replace(/\[|\]/g,"")===g&&(this.day=Y)}],w:[P,R("week")],ww:[$,R("week")],M:[P,R("month")],MM:[$,R("month")],MMM:[e,function(g){var D=q("months"),I=(q("monthsShort")||D.map(function(Y){return Y.slice(0,3)})).indexOf(g)+1;if(I<1)throw new Error;this.month=I%12||I}],MMMM:[e,function(g){var D=q("months").indexOf(g)+1;if(D<1)throw new Error;this.month=D%12||D}],Y:[/[+-]?\d+/,R("year")],YY:[$,function(g){this.year=b(g)}],YYYY:[/\d{4}/,R("year")],Z:J,ZZ:J};function ft(g){var D,I;D=g,I=X&&X.formats;for(var Y=(g=D.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(W,L,V){var N=V&&V.toUpperCase();return L||I[V]||it[V]||I[N].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(j,Z,nt){return Z||nt.slice(1)})})).match(K),et=Y.length,st=0;st<et;st+=1){var M=Y[st],m=T[M],d=m&&m[0],E=m&&m[1];Y[st]=E?{regex:d,parser:E}:M.replace(/^\[|\]$/g,"")}return function(W){for(var L={},V=0,N=0;V<et;V+=1){var j=Y[V];if(typeof j=="string")N+=j.length;else{var Z=j.regex,nt=j.parser,vt=W.slice(N),ot=Z.exec(vt)[0];nt.call(L,ot),W=W.replace(ot,"")}}return function(mt){var wt=mt.afternoon;if(wt!==void 0){var ct=mt.hours;wt?ct<12&&(mt.hours+=12):ct===12&&(mt.hours=0),delete mt.afternoon}}(L),L}}return function(g,D,I){I.p.customParseFormat=!0,g&&g.parseTwoDigitYear&&(b=g.parseTwoDigitYear);var Y=D.prototype,et=Y.parse;Y.parse=function(st){var M=st.date,m=st.utc,d=st.args;this.$u=m;var E=d[1];if(typeof E=="string"){var W=d[2]===!0,L=d[3]===!0,V=W||L,N=d[2];L&&(N=d[2]),X=this.$locale(),!W&&N&&(X=I.Ls[N]),this.$d=function(vt,ot,mt,wt){try{if(["x","X"].indexOf(ot)>-1)return new Date((ot==="X"?1e3:1)*vt);var ct=ft(ot)(vt),Ot=ct.year,Mt=ct.month,ne=ct.day,re=ct.hours,ae=ct.minutes,oe=ct.seconds,ce=ct.milliseconds,Jt=ct.zone,qt=ct.week,$t=new Date,Wt=ne||(Ot||Mt?1:$t.getDate()),Ft=Ot||$t.getFullYear(),St=0;Ot&&!Mt||(St=Mt>0?Mt-1:$t.getMonth());var Kt,Pt=re||0,It=ae||0,Rt=oe||0,Vt=ce||0;return Jt?new Date(Date.UTC(Ft,St,Wt,Pt,It,Rt,Vt+60*Jt.offset*1e3)):mt?new Date(Date.UTC(Ft,St,Wt,Pt,It,Rt,Vt)):(Kt=new Date(Ft,St,Wt,Pt,It,Rt,Vt),qt&&(Kt=wt(Kt).week(qt).toDate()),Kt)}catch{return new Date("")}}(M,E,m,I),this.init(),N&&N!==!0&&(this.$L=this.locale(N).$L),V&&M!=this.format(E)&&(this.$d=new Date("")),X={}}else if(E instanceof Array)for(var j=E.length,Z=1;Z<=j;Z+=1){d[1]=E[Z-1];var nt=I.apply(this,d);if(nt.isValid()){this.$d=nt.$d,this.$L=nt.$L,this.init();break}Z===j&&(this.$d=new Date(""))}else et.call(this,st)}}})},42765:function(_t){(function(it,K){_t.exports=K()})(this,function(){"use strict";var it,K,ut=1e3,$=6e4,P=36e5,e=864e5,X=31536e6,b=2628e6,R=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,J=/\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g,q={years:X,months:b,days:e,hours:P,minutes:$,seconds:ut,milliseconds:1,weeks:6048e5},dt=function(M){return M instanceof et},T=function(M,m,d){return new et(M,d,m.$l)},ft=function(M){return K.p(M)+"s"},g=function(M){return M<0},D=function(M){return g(M)?Math.ceil(M):Math.floor(M)},I=function(M){return Math.abs(M)},Y=function(M,m){return M?g(M)?{negative:!0,format:""+I(M)+m}:{negative:!1,format:""+M+m}:{negative:!1,format:""}},et=function(){function M(d,E,W){var L=this;if(this.$d={},this.$l=W,d===void 0&&(this.$ms=0,this.parseFromMilliseconds()),E)return T(d*q[ft(E)],this);if(typeof d=="number")return this.$ms=d,this.parseFromMilliseconds(),this;if(typeof d=="object")return Object.keys(d).forEach(function(j){L.$d[ft(j)]=d[j]}),this.calMilliseconds(),this;if(typeof d=="string"){var V=d.match(R);if(V){var N=V.slice(2).map(function(j){return j!=null?Number(j):0});return this.$d.years=N[0],this.$d.months=N[1],this.$d.weeks=N[2],this.$d.days=N[3],this.$d.hours=N[4],this.$d.minutes=N[5],this.$d.seconds=N[6],this.calMilliseconds(),this}}return this}var m=M.prototype;return m.calMilliseconds=function(){var d=this;this.$ms=Object.keys(this.$d).reduce(function(E,W){return E+(d.$d[W]||0)*q[W]},0)},m.parseFromMilliseconds=function(){var d=this.$ms;this.$d.years=D(d/X),d%=X,this.$d.months=D(d/b),d%=b,this.$d.days=D(d/e),d%=e,this.$d.hours=D(d/P),d%=P,this.$d.minutes=D(d/$),d%=$,this.$d.seconds=D(d/ut),d%=ut,this.$d.milliseconds=d},m.toISOString=function(){var d=Y(this.$d.years,"Y"),E=Y(this.$d.months,"M"),W=+this.$d.days||0;this.$d.weeks&&(W+=7*this.$d.weeks);var L=Y(W,"D"),V=Y(this.$d.hours,"H"),N=Y(this.$d.minutes,"M"),j=this.$d.seconds||0;this.$d.milliseconds&&(j+=this.$d.milliseconds/1e3,j=Math.round(1e3*j)/1e3);var Z=Y(j,"S"),nt=d.negative||E.negative||L.negative||V.negative||N.negative||Z.negative,vt=V.format||N.format||Z.format?"T":"",ot=(nt?"-":"")+"P"+d.format+E.format+L.format+vt+V.format+N.format+Z.format;return ot==="P"||ot==="-P"?"P0D":ot},m.toJSON=function(){return this.toISOString()},m.format=function(d){var E=d||"YYYY-MM-DDTHH:mm:ss",W={Y:this.$d.years,YY:K.s(this.$d.years,2,"0"),YYYY:K.s(this.$d.years,4,"0"),M:this.$d.months,MM:K.s(this.$d.months,2,"0"),D:this.$d.days,DD:K.s(this.$d.days,2,"0"),H:this.$d.hours,HH:K.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:K.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:K.s(this.$d.seconds,2,"0"),SSS:K.s(this.$d.milliseconds,3,"0")};return E.replace(J,function(L,V){return V||String(W[L])})},m.as=function(d){return this.$ms/q[ft(d)]},m.get=function(d){var E=this.$ms,W=ft(d);return W==="milliseconds"?E%=1e3:E=W==="weeks"?D(E/q[W]):this.$d[W],E||0},m.add=function(d,E,W){var L;return L=E?d*q[ft(E)]:dt(d)?d.$ms:T(d,this).$ms,T(this.$ms+L*(W?-1:1),this)},m.subtract=function(d,E){return this.add(d,E,!0)},m.locale=function(d){var E=this.clone();return E.$l=d,E},m.clone=function(){return T(this.$ms,this)},m.humanize=function(d){return it().add(this.$ms,"ms").locale(this.$l).fromNow(!d)},m.valueOf=function(){return this.asMilliseconds()},m.milliseconds=function(){return this.get("milliseconds")},m.asMilliseconds=function(){return this.as("milliseconds")},m.seconds=function(){return this.get("seconds")},m.asSeconds=function(){return this.as("seconds")},m.minutes=function(){return this.get("minutes")},m.asMinutes=function(){return this.as("minutes")},m.hours=function(){return this.get("hours")},m.asHours=function(){return this.as("hours")},m.days=function(){return this.get("days")},m.asDays=function(){return this.as("days")},m.weeks=function(){return this.get("weeks")},m.asWeeks=function(){return this.as("weeks")},m.months=function(){return this.get("months")},m.asMonths=function(){return this.as("months")},m.years=function(){return this.get("years")},m.asYears=function(){return this.as("years")},M}(),st=function(M,m,d){return M.add(m.years()*d,"y").add(m.months()*d,"M").add(m.days()*d,"d").add(m.hours()*d,"h").add(m.minutes()*d,"m").add(m.seconds()*d,"s").add(m.milliseconds()*d,"ms")};return function(M,m,d){it=d,K=d().$utils(),d.duration=function(L,V){var N=d.locale();return T(L,{$l:N},V)},d.isDuration=dt;var E=m.prototype.add,W=m.prototype.subtract;m.prototype.add=function(L,V){return dt(L)?st(this,L,1):E.bind(this)(L,V)},m.prototype.subtract=function(L,V){return dt(L)?st(this,L,-1):W.bind(this)(L,V)}}})},253188:function(_t){(function(it,K){_t.exports=K()})(this,function(){"use strict";var it="day";return function(K,ut,$){var P=function(b){return b.add(4-b.isoWeekday(),it)},e=ut.prototype;e.isoWeekYear=function(){return P(this).year()},e.isoWeek=function(b){if(!this.$utils().u(b))return this.add(7*(b-this.isoWeek()),it);var R,J,q,dt,T=P(this),ft=(R=this.isoWeekYear(),J=this.$u,q=(J?$.utc:$)().year(R).startOf("year"),dt=4-q.isoWeekday(),q.isoWeekday()>4&&(dt+=7),q.add(dt,it));return T.diff(ft,"week")+1},e.isoWeekday=function(b){return this.$utils().u(b)?this.day()||7:this.day(this.day()%7?b:b-7)};var X=e.startOf;e.startOf=function(b,R){var J=this.$utils(),q=!!J.u(R)||R;return J.p(b)==="isoweek"?q?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):X.bind(this)(b,R)}}})},333415:function(_t,it,K){"use strict";K.d(it,{diagram:function(){return Je}});var ut=K(698981),$=K(767767),P=K(294654),e=K(769120),X=K(234674),b=K(809182),R=K(253188),J=K(514076),q=K(850868),dt=K(42765),T=K(644892),ft=function(){var t=(0,e.K)(function(v,o,f,h){for(f=f||{},h=v.length;h--;f[v[h]]=o);return f},"o"),i=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],n=[1,26],r=[1,27],a=[1,28],k=[1,29],p=[1,30],z=[1,31],rt=[1,32],xt=[1,33],G=[1,34],pt=[1,9],lt=[1,10],gt=[1,11],Dt=[1,12],kt=[1,13],F=[1,14],Bt=[1,15],Nt=[1,16],zt=[1,19],Ut=[1,20],At=[1,21],Ht=[1,22],jt=[1,23],Gt=[1,25],Xt=[1,35],y={trace:(0,e.K)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,e.K)(function(o,f,h,u,S,s,C){var l=s.length-1;switch(S){case 1:return s[l-1];case 2:this.$=[];break;case 3:s[l-1].push(s[l]),this.$=s[l-1];break;case 4:case 5:this.$=s[l];break;case 6:case 7:this.$=[];break;case 8:u.setWeekday("monday");break;case 9:u.setWeekday("tuesday");break;case 10:u.setWeekday("wednesday");break;case 11:u.setWeekday("thursday");break;case 12:u.setWeekday("friday");break;case 13:u.setWeekday("saturday");break;case 14:u.setWeekday("sunday");break;case 15:u.setWeekend("friday");break;case 16:u.setWeekend("saturday");break;case 17:u.setDateFormat(s[l].substr(11)),this.$=s[l].substr(11);break;case 18:u.enableInclusiveEndDates(),this.$=s[l].substr(18);break;case 19:u.TopAxis(),this.$=s[l].substr(8);break;case 20:u.setAxisFormat(s[l].substr(11)),this.$=s[l].substr(11);break;case 21:u.setTickInterval(s[l].substr(13)),this.$=s[l].substr(13);break;case 22:u.setExcludes(s[l].substr(9)),this.$=s[l].substr(9);break;case 23:u.setIncludes(s[l].substr(9)),this.$=s[l].substr(9);break;case 24:u.setTodayMarker(s[l].substr(12)),this.$=s[l].substr(12);break;case 27:u.setDiagramTitle(s[l].substr(6)),this.$=s[l].substr(6);break;case 28:this.$=s[l].trim(),u.setAccTitle(this.$);break;case 29:case 30:this.$=s[l].trim(),u.setAccDescription(this.$);break;case 31:u.addSection(s[l].substr(8)),this.$=s[l].substr(8);break;case 33:u.addTask(s[l-1],s[l]),this.$="task";break;case 34:this.$=s[l-1],u.setClickEvent(s[l-1],s[l],null);break;case 35:this.$=s[l-2],u.setClickEvent(s[l-2],s[l-1],s[l]);break;case 36:this.$=s[l-2],u.setClickEvent(s[l-2],s[l-1],null),u.setLink(s[l-2],s[l]);break;case 37:this.$=s[l-3],u.setClickEvent(s[l-3],s[l-2],s[l-1]),u.setLink(s[l-3],s[l]);break;case 38:this.$=s[l-2],u.setClickEvent(s[l-2],s[l],null),u.setLink(s[l-2],s[l-1]);break;case 39:this.$=s[l-3],u.setClickEvent(s[l-3],s[l-1],s[l]),u.setLink(s[l-3],s[l-2]);break;case 40:this.$=s[l-1],u.setLink(s[l-1],s[l]);break;case 41:case 47:this.$=s[l-1]+" "+s[l];break;case 42:case 43:case 45:this.$=s[l-2]+" "+s[l-1]+" "+s[l];break;case 44:case 46:this.$=s[l-3]+" "+s[l-2]+" "+s[l-1]+" "+s[l];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(i,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:n,13:r,14:a,15:k,16:p,17:z,18:rt,19:18,20:xt,21:G,22:pt,23:lt,24:gt,25:Dt,26:kt,27:F,28:Bt,29:Nt,30:zt,31:Ut,33:At,35:Ht,36:jt,37:24,38:Gt,40:Xt},t(i,[2,7],{1:[2,1]}),t(i,[2,3]),{9:36,11:17,12:n,13:r,14:a,15:k,16:p,17:z,18:rt,19:18,20:xt,21:G,22:pt,23:lt,24:gt,25:Dt,26:kt,27:F,28:Bt,29:Nt,30:zt,31:Ut,33:At,35:Ht,36:jt,37:24,38:Gt,40:Xt},t(i,[2,5]),t(i,[2,6]),t(i,[2,17]),t(i,[2,18]),t(i,[2,19]),t(i,[2,20]),t(i,[2,21]),t(i,[2,22]),t(i,[2,23]),t(i,[2,24]),t(i,[2,25]),t(i,[2,26]),t(i,[2,27]),{32:[1,37]},{34:[1,38]},t(i,[2,30]),t(i,[2,31]),t(i,[2,32]),{39:[1,39]},t(i,[2,8]),t(i,[2,9]),t(i,[2,10]),t(i,[2,11]),t(i,[2,12]),t(i,[2,13]),t(i,[2,14]),t(i,[2,15]),t(i,[2,16]),{41:[1,40],43:[1,41]},t(i,[2,4]),t(i,[2,28]),t(i,[2,29]),t(i,[2,33]),t(i,[2,34],{42:[1,42],43:[1,43]}),t(i,[2,40],{41:[1,44]}),t(i,[2,35],{43:[1,45]}),t(i,[2,36]),t(i,[2,38],{42:[1,46]}),t(i,[2,37]),t(i,[2,39])],defaultActions:{},parseError:(0,e.K)(function(o,f){if(f.recoverable)this.trace(o);else{var h=new Error(o);throw h.hash=f,h}},"parseError"),parse:(0,e.K)(function(o){var f=this,h=[0],u=[],S=[null],s=[],C=this.table,l="",tt=0,c=0,x=0,w=2,U=1,H=s.slice.call(arguments,1),O=Object.create(this.lexer),B={yy:{}};for(var Zt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Zt)&&(B.yy[Zt]=this.yy[Zt]);O.setInput(o,B.yy),B.yy.lexer=O,B.yy.parser=this,typeof O.yylloc>"u"&&(O.yylloc={});var Qt=O.yylloc;s.push(Qt);var qe=O.options&&O.options.ranges;typeof B.yy.parseError=="function"?this.parseError=B.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ts(ht){h.length=h.length-2*ht,S.length=S.length-ht,s.length=s.length-ht}(0,e.K)(ts,"popStack");function Ee(){var ht;return ht=u.pop()||O.lex()||U,typeof ht!="number"&&(ht instanceof Array&&(u=ht,ht=u.pop()),ht=f.symbols_[ht]||ht),ht}(0,e.K)(Ee,"lex");for(var at,he,Ct,yt,es,me,Yt={},se,bt,Ce,ie;;){if(Ct=h[h.length-1],this.defaultActions[Ct]?yt=this.defaultActions[Ct]:((at===null||typeof at>"u")&&(at=Ee()),yt=C[Ct]&&C[Ct][at]),typeof yt>"u"||!yt.length||!yt[0]){var ke="";ie=[];for(se in C[Ct])this.terminals_[se]&&se>w&&ie.push("'"+this.terminals_[se]+"'");O.showPosition?ke="Parse error on line "+(tt+1)+`:
`+O.showPosition()+`
Expecting `+ie.join(", ")+", got '"+(this.terminals_[at]||at)+"'":ke="Parse error on line "+(tt+1)+": Unexpected "+(at==U?"end of input":"'"+(this.terminals_[at]||at)+"'"),this.parseError(ke,{text:O.match,token:this.terminals_[at]||at,line:O.yylineno,loc:Qt,expected:ie})}if(yt[0]instanceof Array&&yt.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Ct+", token: "+at);switch(yt[0]){case 1:h.push(at),S.push(O.yytext),s.push(O.yylloc),h.push(yt[1]),at=null,he?(at=he,he=null):(c=O.yyleng,l=O.yytext,tt=O.yylineno,Qt=O.yylloc,x>0&&x--);break;case 2:if(bt=this.productions_[yt[1]][1],Yt.$=S[S.length-bt],Yt._$={first_line:s[s.length-(bt||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(bt||1)].first_column,last_column:s[s.length-1].last_column},qe&&(Yt._$.range=[s[s.length-(bt||1)].range[0],s[s.length-1].range[1]]),me=this.performAction.apply(Yt,[l,c,tt,B.yy,yt[1],S,s].concat(H)),typeof me<"u")return me;bt&&(h=h.slice(0,-1*bt*2),S=S.slice(0,-1*bt),s=s.slice(0,-1*bt)),h.push(this.productions_[yt[1]][0]),S.push(Yt.$),s.push(Yt._$),Ce=C[h[h.length-2]][h[h.length-1]],h.push(Ce);break;case 3:return!0}}return!0},"parse")},A=function(){var v={EOF:1,parseError:(0,e.K)(function(f,h){if(this.yy.parser)this.yy.parser.parseError(f,h);else throw new Error(f)},"parseError"),setInput:(0,e.K)(function(o,f){return this.yy=f||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,e.K)(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var f=o.match(/(?:\r\n?|\n).*/g);return f?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:(0,e.K)(function(o){var f=o.length,h=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-f),this.offset-=f;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var S=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===u.length?this.yylloc.first_column:0)+u[u.length-h.length].length-h[0].length:this.yylloc.first_column-f},this.options.ranges&&(this.yylloc.range=[S[0],S[0]+this.yyleng-f]),this.yyleng=this.yytext.length,this},"unput"),more:(0,e.K)(function(){return this._more=!0,this},"more"),reject:(0,e.K)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,e.K)(function(o){this.unput(this.match.slice(o))},"less"),pastInput:(0,e.K)(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,e.K)(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,e.K)(function(){var o=this.pastInput(),f=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+f+"^"},"showPosition"),test_match:(0,e.K)(function(o,f){var h,u,S;if(this.options.backtrack_lexer&&(S={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(S.yylloc.range=this.yylloc.range.slice(0))),u=o[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],h=this.performAction.call(this,this.yy,this,f,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var s in S)this[s]=S[s];return!1}return!1},"test_match"),next:(0,e.K)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,f,h,u;this._more||(this.yytext="",this.match="");for(var S=this._currentRules(),s=0;s<S.length;s++)if(h=this._input.match(this.rules[S[s]]),h&&(!f||h[0].length>f[0].length)){if(f=h,u=s,this.options.backtrack_lexer){if(o=this.test_match(h,S[s]),o!==!1)return o;if(this._backtrack){f=!1;continue}else return!1}else if(!this.options.flex)break}return f?(o=this.test_match(f,S[u]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,e.K)(function(){var f=this.next();return f||this.lex()},"lex"),begin:(0,e.K)(function(f){this.conditionStack.push(f)},"begin"),popState:(0,e.K)(function(){var f=this.conditionStack.length-1;return f>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,e.K)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,e.K)(function(f){return f=this.conditionStack.length-1-Math.abs(f||0),f>=0?this.conditionStack[f]:"INITIAL"},"topState"),pushState:(0,e.K)(function(f){this.begin(f)},"pushState"),stateStackSize:(0,e.K)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,e.K)(function(f,h,u,S){var s=S;switch(u){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return v}();y.lexer=A;function _(){this.yy={}}return(0,e.K)(_,"Parser"),_.prototype=y,y.Parser=_,new _}();ft.parser=ft;var g=ft;b.extend(R),b.extend(J),b.extend(q);var D={friday:5,saturday:6},I="",Y="",et=void 0,st="",M=[],m=[],d=new Map,E=[],W=[],L="",V="",N=["active","done","crit","milestone","vert"],j=[],Z="",nt=!1,vt=!1,ot="sunday",mt="saturday",wt=0,ct=(0,e.K)(function(){E=[],W=[],L="",j=[],te=0,ue=void 0,ee=void 0,Q=[],I="",Y="",V="",et=void 0,st="",M=[],m=[],nt=!1,vt=!1,wt=0,d=new Map,Z="",(0,$.IU)(),ot="sunday",mt="saturday"},"clear"),Ot=(0,e.K)(function(t){Z=t},"setDiagramId"),Mt=(0,e.K)(function(t){Y=t},"setAxisFormat"),ne=(0,e.K)(function(){return Y},"getAxisFormat"),re=(0,e.K)(function(t){et=t},"setTickInterval"),ae=(0,e.K)(function(){return et},"getTickInterval"),oe=(0,e.K)(function(t){st=t},"setTodayMarker"),ce=(0,e.K)(function(){return st},"getTodayMarker"),Jt=(0,e.K)(function(t){I=t},"setDateFormat"),qt=(0,e.K)(function(){nt=!0},"enableInclusiveEndDates"),$t=(0,e.K)(function(){return nt},"endDatesAreInclusive"),Wt=(0,e.K)(function(){vt=!0},"enableTopAxis"),Ft=(0,e.K)(function(){return vt},"topAxisEnabled"),St=(0,e.K)(function(t){V=t},"setDisplayMode"),Kt=(0,e.K)(function(){return V},"getDisplayMode"),Pt=(0,e.K)(function(){return I},"getDateFormat"),It=(0,e.K)((t,i)=>{const n=i.toLowerCase().split(/[\s,]+/).filter(r=>r!=="");return[...new Set([...t,...n])]},"mergeTokens"),Rt=(0,e.K)(function(t){M=It(M,t)},"setIncludes"),Vt=(0,e.K)(function(){return M},"getIncludes"),ye=(0,e.K)(function(t){m=It(m,t)},"setExcludes"),Me=(0,e.K)(function(){return m},"getExcludes"),Se=(0,e.K)(function(){return d},"getLinks"),Ke=(0,e.K)(function(t){L=t,E.push(t)},"addSection"),Ie=(0,e.K)(function(){return E},"getSections"),Le=(0,e.K)(function(){let t=be();const i=10;let n=0;for(;!t&&n<i;)t=be(),n++;return W=Q,W},"getTasks"),ge=(0,e.K)(function(t,i,n,r){const a=t.format(i.trim()),k=t.format("YYYY-MM-DD");return r.includes(a)||r.includes(k)?!1:n.includes("weekends")&&(t.isoWeekday()===D[mt]||t.isoWeekday()===D[mt]+1)||n.includes(t.format("dddd").toLowerCase())?!0:n.includes(a)||n.includes(k)},"isInvalidDate"),Ae=(0,e.K)(function(t){ot=t},"setWeekday"),Ye=(0,e.K)(function(){return ot},"getWeekday"),Oe=(0,e.K)(function(t){mt=t},"setWeekend"),ve=(0,e.K)(function(t,i,n,r){if(!n.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=b(t.startTime):a=b(t.startTime,i,!0),a=a.add(1,"d");let k;t.endTime instanceof Date?k=b(t.endTime):k=b(t.endTime,i,!0);const[p,z]=$e(a,k,i,n,r);t.endTime=p.toDate(),t.renderEndTime=z},"checkTaskDates"),$e=(0,e.K)(function(t,i,n,r,a){let k=!1,p=null;const z=i.add(1e4,"d");for(;t<=i;){if(k||(p=i.toDate()),k=ge(t,n,r,a),k&&(i=i.add(1,"d"),i>z))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,"d")}return[i,p]},"fixTaskDates"),le=(0,e.K)(function(t,i,n){if(n=n.trim(),(0,e.K)(z=>{const rt=z.trim();return rt==="x"||rt==="X"},"isTimestampFormat")(i)&&/^\d+$/.test(n))return new Date(Number(n));const k=/^after\s+(?<ids>[\d\w- ]+)/.exec(n);if(k!==null){let z=null;for(const xt of k.groups.ids.split(" ")){let G=Et(xt);G!==void 0&&(!z||G.endTime>z.endTime)&&(z=G)}if(z)return z.endTime;const rt=new Date;return rt.setHours(0,0,0,0),rt}let p=b(n,i.trim(),!0);if(p.isValid())return p.toDate();{P.R.debug("Invalid date:"+n),P.R.debug("With date format:"+i.trim());const z=new Date(n);if(z===void 0||isNaN(z.getTime())||z.getFullYear()<-1e4||z.getFullYear()>1e4)throw new Error("Invalid date:"+n);return z}},"getStartDate"),pe=(0,e.K)(function(t){const i=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return i!==null?[Number.parseFloat(i[1]),i[2]]:[NaN,"ms"]},"parseDuration"),Te=(0,e.K)(function(t,i,n,r=!1){n=n.trim();const k=/^until\s+(?<ids>[\d\w- ]+)/.exec(n);if(k!==null){let G=null;for(const lt of k.groups.ids.split(" ")){let gt=Et(lt);gt!==void 0&&(!G||gt.startTime<G.startTime)&&(G=gt)}if(G)return G.startTime;const pt=new Date;return pt.setHours(0,0,0,0),pt}let p=b(n,i.trim(),!0);if(p.isValid())return r&&(p=p.add(1,"d")),p.toDate();let z=b(t);const[rt,xt]=pe(n);if(!Number.isNaN(rt)){const G=z.add(rt,xt);G.isValid()&&(z=G)}return z.toDate()},"getEndDate"),te=0,Lt=(0,e.K)(function(t){return t===void 0?(te=te+1,"task"+te):t},"parseId"),We=(0,e.K)(function(t,i){let n;i.substr(0,1)===":"?n=i.substr(1,i.length):n=i;const r=n.split(","),a={};de(r,a,N);for(let p=0;p<r.length;p++)r[p]=r[p].trim();let k="";switch(r.length){case 1:a.id=Lt(),a.startTime=t.endTime,k=r[0];break;case 2:a.id=Lt(),a.startTime=le(void 0,I,r[0]),k=r[1];break;case 3:a.id=Lt(r[0]),a.startTime=le(void 0,I,r[1]),k=r[2];break;default:}return k&&(a.endTime=Te(a.startTime,I,k,nt),a.manualEndTime=b(k,"YYYY-MM-DD",!0).isValid(),ve(a,I,m,M)),a},"compileData"),Fe=(0,e.K)(function(t,i){let n;i.substr(0,1)===":"?n=i.substr(1,i.length):n=i;const r=n.split(","),a={};de(r,a,N);for(let k=0;k<r.length;k++)r[k]=r[k].trim();switch(r.length){case 1:a.id=Lt(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:r[0]};break;case 2:a.id=Lt(),a.startTime={type:"getStartDate",startData:r[0]},a.endTime={data:r[1]};break;case 3:a.id=Lt(r[0]),a.startTime={type:"getStartDate",startData:r[1]},a.endTime={data:r[2]};break;default:}return a},"parseData"),ue,ee,Q=[],xe={},Pe=(0,e.K)(function(t,i){const n={section:L,type:L,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:i},task:t,classes:[]},r=Fe(ee,i);n.raw.startTime=r.startTime,n.raw.endTime=r.endTime,n.id=r.id,n.prevTaskId=ee,n.active=r.active,n.done=r.done,n.crit=r.crit,n.milestone=r.milestone,n.vert=r.vert,n.vert?n.order=-1:(n.order=wt,wt++);const a=Q.push(n);ee=n.id,xe[n.id]=a-1},"addTask"),Et=(0,e.K)(function(t){const i=xe[t];return Q[i]},"findTaskById"),Re=(0,e.K)(function(t,i){const n={section:L,type:L,description:t,task:t,classes:[]},r=We(ue,i);n.startTime=r.startTime,n.endTime=r.endTime,n.id=r.id,n.active=r.active,n.done=r.done,n.crit=r.crit,n.milestone=r.milestone,n.vert=r.vert,ue=n,W.push(n)},"addTaskOrg"),be=(0,e.K)(function(){const t=(0,e.K)(function(n){const r=Q[n];let a="";switch(Q[n].raw.startTime.type){case"prevTaskEnd":{const k=Et(r.prevTaskId);r.startTime=k.endTime;break}case"getStartDate":a=le(void 0,I,Q[n].raw.startTime.startData),a&&(Q[n].startTime=a);break}return Q[n].startTime&&(Q[n].endTime=Te(Q[n].startTime,I,Q[n].raw.endTime.data,nt),Q[n].endTime&&(Q[n].processed=!0,Q[n].manualEndTime=b(Q[n].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),ve(Q[n],I,m,M))),Q[n].processed},"compileTask");let i=!0;for(const[n,r]of Q.entries())t(n),i=i&&r.processed;return i},"compileTasks"),Ve=(0,e.K)(function(t,i){let n=i;(0,$.D7)().securityLevel!=="loose"&&(n=(0,X.J)(i)),t.split(",").forEach(function(r){Et(r)!==void 0&&(we(r,()=>{window.open(n,"_self")}),d.set(r,n))}),_e(t,"clickable")},"setLink"),_e=(0,e.K)(function(t,i){t.split(",").forEach(function(n){let r=Et(n);r!==void 0&&r.classes.push(i)})},"setClass"),Be=(0,e.K)(function(t,i,n){if((0,$.D7)().securityLevel!=="loose"||i===void 0)return;let r=[];if(typeof n=="string"){r=n.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let k=0;k<r.length;k++){let p=r[k].trim();p.startsWith('"')&&p.endsWith('"')&&(p=p.substr(1,p.length-2)),r[k]=p}}r.length===0&&r.push(t),Et(t)!==void 0&&we(t,()=>{ut._K.runFunc(i,...r)})},"setClickFun"),we=(0,e.K)(function(t,i){j.push(function(){const n=Z?`${Z}-${t}`:t,r=document.querySelector(`[id="${n}"]`);r!==null&&r.addEventListener("click",function(){i()})},function(){const n=Z?`${Z}-${t}`:t,r=document.querySelector(`[id="${n}-text"]`);r!==null&&r.addEventListener("click",function(){i()})})},"pushFun"),Ne=(0,e.K)(function(t,i,n){t.split(",").forEach(function(r){Be(r,i,n)}),_e(t,"clickable")},"setClickEvent"),ze=(0,e.K)(function(t){j.forEach(function(i){i(t)})},"bindFunctions"),Ue={getConfig:(0,e.K)(()=>(0,$.D7)().gantt,"getConfig"),clear:ct,setDateFormat:Jt,getDateFormat:Pt,enableInclusiveEndDates:qt,endDatesAreInclusive:$t,enableTopAxis:Wt,topAxisEnabled:Ft,setAxisFormat:Mt,getAxisFormat:ne,setTickInterval:re,getTickInterval:ae,setTodayMarker:oe,getTodayMarker:ce,setAccTitle:$.SV,getAccTitle:$.iN,setDiagramTitle:$.ke,getDiagramTitle:$.ab,setDiagramId:Ot,setDisplayMode:St,getDisplayMode:Kt,setAccDescription:$.EI,getAccDescription:$.m7,addSection:Ke,getSections:Ie,getTasks:Le,addTask:Pe,findTaskById:Et,addTaskOrg:Re,setIncludes:Rt,getIncludes:Vt,setExcludes:ye,getExcludes:Me,setClickEvent:Ne,setLink:Ve,getLinks:Se,bindFunctions:ze,parseDuration:pe,isInvalidDate:ge,setWeekday:Ae,getWeekday:Ye,setWeekend:Oe};function de(t,i,n){let r=!0;for(;r;)r=!1,n.forEach(function(a){const k="^\\s*"+a+"\\s*$",p=new RegExp(k);t[0].match(p)&&(i[a]=!0,t.shift(1),r=!0)})}(0,e.K)(de,"getTaskTags"),b.extend(dt);var He=(0,e.K)(function(){P.R.debug("Something is calling, setConf, remove the call")},"setConf"),De={monday:T.ABi,tuesday:T.PGu,wednesday:T.GuW,thursday:T.Mol,friday:T.TUC,saturday:T.rGn,sunday:T.YPH},je=(0,e.K)((t,i)=>{let n=[...t].map(()=>-1/0),r=[...t].sort((k,p)=>k.startTime-p.startTime||k.order-p.order),a=0;for(const k of r)for(let p=0;p<n.length;p++)if(k.startTime>=n[p]){n[p]=k.endTime,k.order=p+i,p>a&&(a=p);break}return a},"getMaxIntersections"),Tt,fe=1e4,Ge=(0,e.K)(function(t,i,n,r){const a=(0,$.D7)().gantt;r.db.setDiagramId(i);const k=(0,$.D7)().securityLevel;let p;k==="sandbox"&&(p=(0,T.Ltv)("#i"+i));const z=k==="sandbox"?(0,T.Ltv)(p.nodes()[0].contentDocument.body):(0,T.Ltv)("body"),rt=k==="sandbox"?p.nodes()[0].contentDocument:document,xt=rt.getElementById(i);Tt=xt.parentElement.offsetWidth,Tt===void 0&&(Tt=1200),a.useWidth!==void 0&&(Tt=a.useWidth);const G=r.db.getTasks(),pt=G.filter(y=>!y.vert);let lt=[];for(const y of pt)lt.push(y.type);lt=Xt(lt);const gt={};let Dt=2*a.topPadding;if(r.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const y={};for(const _ of pt)y[_.section]===void 0?y[_.section]=[_]:y[_.section].push(_);let A=0;for(const _ of Object.keys(y)){const v=je(y[_],A)+1;A+=v,Dt+=v*(a.barHeight+a.barGap),gt[_]=v}}else{Dt+=pt.length*(a.barHeight+a.barGap);for(const y of lt)gt[y]=pt.filter(A=>A.type===y).length}xt.setAttribute("viewBox","0 0 "+Tt+" "+Dt);const kt=z.select(`[id="${i}"]`),F=(0,T.w7C)().domain([(0,T.jkA)(G,function(y){return y.startTime}),(0,T.T9B)(G,function(y){return y.endTime})]).rangeRound([0,Tt-a.leftPadding-a.rightPadding]);function Bt(y,A){const _=y.startTime,v=A.startTime;let o=0;return _>v?o=1:_<v&&(o=-1),o}(0,e.K)(Bt,"taskCompare"),G.sort(Bt),Nt(G,Tt,Dt),(0,$.a$)(kt,Dt,Tt,a.useMaxWidth),kt.append("text").text(r.db.getDiagramTitle()).attr("x",Tt/2).attr("y",a.titleTopMargin).attr("class","titleText");function Nt(y,A,_){const v=a.barHeight,o=v+a.barGap,f=a.topPadding,h=a.leftPadding,u=(0,T.m4Y)().domain([0,lt.length]).range(["#00B9FA","#F95002"]).interpolate(T.bEH);Ut(o,f,h,A,_,y,r.db.getExcludes(),r.db.getIncludes()),Ht(h,f,A,_),zt(y,o,f,h,v,u,A,_),jt(o,f,h,v,u),Gt(h,f,A,_)}(0,e.K)(Nt,"makeGantt");function zt(y,A,_,v,o,f,h){y.sort((c,x)=>c.vert===x.vert?0:c.vert?1:-1);const u=y.filter(c=>!c.vert),s=[...new Set(u.map(c=>c.order))].map(c=>u.find(x=>x.order===c));kt.append("g").selectAll("rect").data(s).enter().append("rect").attr("x",0).attr("y",function(c,x){return x=c.order,x*A+_-2}).attr("width",function(){return h-a.rightPadding/2}).attr("height",A).attr("class",function(c){for(const[x,w]of lt.entries())if(c.type===w)return"section section"+x%a.numberSectionStyles;return"section section0"}).enter();const C=kt.append("g").selectAll("rect").data(y).enter(),l=r.db.getLinks();if(C.append("rect").attr("id",function(c){return i+"-"+c.id}).attr("rx",3).attr("ry",3).attr("x",function(c){return c.milestone?F(c.startTime)+v+.5*(F(c.endTime)-F(c.startTime))-.5*o:F(c.startTime)+v}).attr("y",function(c,x){return x=c.order,c.vert?a.gridLineStartPadding:x*A+_}).attr("width",function(c){return c.milestone?o:c.vert?.08*o:F(c.renderEndTime||c.endTime)-F(c.startTime)}).attr("height",function(c){return c.vert?u.length*(a.barHeight+a.barGap)+a.barHeight*2:o}).attr("transform-origin",function(c,x){return x=c.order,(F(c.startTime)+v+.5*(F(c.endTime)-F(c.startTime))).toString()+"px "+(x*A+_+.5*o).toString()+"px"}).attr("class",function(c){const x="task";let w="";c.classes.length>0&&(w=c.classes.join(" "));let U=0;for(const[O,B]of lt.entries())c.type===B&&(U=O%a.numberSectionStyles);let H="";return c.active?c.crit?H+=" activeCrit":H=" active":c.done?c.crit?H=" doneCrit":H=" done":c.crit&&(H+=" crit"),H.length===0&&(H=" task"),c.milestone&&(H=" milestone "+H),c.vert&&(H=" vert "+H),H+=U,H+=" "+w,x+H}),C.append("text").attr("id",function(c){return i+"-"+c.id+"-text"}).text(function(c){return c.task}).attr("font-size",a.fontSize).attr("x",function(c){let x=F(c.startTime),w=F(c.renderEndTime||c.endTime);if(c.milestone&&(x+=.5*(F(c.endTime)-F(c.startTime))-.5*o,w=x+o),c.vert)return F(c.startTime)+v;const U=this.getBBox().width;return U>w-x?w+U+1.5*a.leftPadding>h?x+v-5:w+v+5:(w-x)/2+x+v}).attr("y",function(c,x){return c.vert?a.gridLineStartPadding+u.length*(a.barHeight+a.barGap)+60:(x=c.order,x*A+a.barHeight/2+(a.fontSize/2-2)+_)}).attr("text-height",o).attr("class",function(c){const x=F(c.startTime);let w=F(c.endTime);c.milestone&&(w=x+o);const U=this.getBBox().width;let H="";c.classes.length>0&&(H=c.classes.join(" "));let O=0;for(const[Zt,Qt]of lt.entries())c.type===Qt&&(O=Zt%a.numberSectionStyles);let B="";return c.active&&(c.crit?B="activeCritText"+O:B="activeText"+O),c.done?c.crit?B=B+" doneCritText"+O:B=B+" doneText"+O:c.crit&&(B=B+" critText"+O),c.milestone&&(B+=" milestoneText"),c.vert&&(B+=" vertText"),U>w-x?w+U+1.5*a.leftPadding>h?H+" taskTextOutsideLeft taskTextOutside"+O+" "+B:H+" taskTextOutsideRight taskTextOutside"+O+" "+B+" width-"+U:H+" taskText taskText"+O+" "+B+" width-"+U}),(0,$.D7)().securityLevel==="sandbox"){let c;c=(0,T.Ltv)("#i"+i);const x=c.nodes()[0].contentDocument;C.filter(function(w){return l.has(w.id)}).each(function(w){var U=x.querySelector("#"+CSS.escape(i+"-"+w.id)),H=x.querySelector("#"+CSS.escape(i+"-"+w.id+"-text"));const O=U.parentNode;var B=x.createElement("a");B.setAttribute("xlink:href",l.get(w.id)),B.setAttribute("target","_top"),O.appendChild(B),B.appendChild(U),B.appendChild(H)})}}(0,e.K)(zt,"drawRects");function Ut(y,A,_,v,o,f,h,u){if(h.length===0&&u.length===0)return;let S,s;for(const{startTime:w,endTime:U}of f)(S===void 0||w<S)&&(S=w),(s===void 0||U>s)&&(s=U);if(!S||!s)return;if(b(s).diff(b(S),"year")>5){P.R.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const C=r.db.getDateFormat(),l=[];let tt=null,c=b(S);for(;c.valueOf()<=s;)r.db.isInvalidDate(c,C,h,u)?tt?tt.end=c:tt={start:c,end:c}:tt&&(l.push(tt),tt=null),c=c.add(1,"d");kt.append("g").selectAll("rect").data(l).enter().append("rect").attr("id",w=>i+"-exclude-"+w.start.format("YYYY-MM-DD")).attr("x",w=>F(w.start.startOf("day"))+_).attr("y",a.gridLineStartPadding).attr("width",w=>F(w.end.endOf("day"))-F(w.start.startOf("day"))).attr("height",o-A-a.gridLineStartPadding).attr("transform-origin",function(w,U){return(F(w.start)+_+.5*(F(w.end)-F(w.start))).toString()+"px "+(U*y+.5*o).toString()+"px"}).attr("class","exclude-range")}(0,e.K)(Ut,"drawExcludeDays");function At(y,A,_,v){if(_<=0||y>A)return 1/0;const o=A-y,f=b.duration({[v??"day"]:_}).asMilliseconds();return f<=0?1/0:Math.ceil(o/f)}(0,e.K)(At,"getEstimatedTickCount");function Ht(y,A,_,v){const o=r.db.getDateFormat(),f=r.db.getAxisFormat();let h;f?h=f:o==="D"?h="%d":h=a.axisFormat??"%Y-%m-%d";let u=(0,T.l78)(F).tickSize(-v+A+a.gridLineStartPadding).tickFormat((0,T.DCK)(h));const s=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||a.tickInterval);if(s!==null){const C=parseInt(s[1],10);if(isNaN(C)||C<=0)P.R.warn(`Invalid tick interval value: "${s[1]}". Skipping custom tick interval.`);else{const l=s[2],tt=r.db.getWeekday()||a.weekday,c=F.domain(),x=c[0],w=c[1],U=At(x,w,C,l);if(U>fe)P.R.warn(`The tick interval "${C}${l}" would generate ${U} ticks, which exceeds the maximum allowed (${fe}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(l){case"millisecond":u.ticks(T.t6C.every(C));break;case"second":u.ticks(T.ucG.every(C));break;case"minute":u.ticks(T.wXd.every(C));break;case"hour":u.ticks(T.Agd.every(C));break;case"day":u.ticks(T.UAC.every(C));break;case"week":u.ticks(De[tt].every(C));break;case"month":u.ticks(T.Ui6.every(C));break}}}if(kt.append("g").attr("class","grid").attr("transform","translate("+y+", "+(v-50)+")").call(u).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||a.topAxis){let C=(0,T.tlR)(F).tickSize(-v+A+a.gridLineStartPadding).tickFormat((0,T.DCK)(h));if(s!==null){const l=parseInt(s[1],10);if(isNaN(l)||l<=0)P.R.warn(`Invalid tick interval value: "${s[1]}". Skipping custom tick interval.`);else{const tt=s[2],c=r.db.getWeekday()||a.weekday,x=F.domain(),w=x[0],U=x[1];if(At(w,U,l,tt)<=fe)switch(tt){case"millisecond":C.ticks(T.t6C.every(l));break;case"second":C.ticks(T.ucG.every(l));break;case"minute":C.ticks(T.wXd.every(l));break;case"hour":C.ticks(T.Agd.every(l));break;case"day":C.ticks(T.UAC.every(l));break;case"week":C.ticks(De[c].every(l));break;case"month":C.ticks(T.Ui6.every(l));break}}}kt.append("g").attr("class","grid").attr("transform","translate("+y+", "+A+")").call(C).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}(0,e.K)(Ht,"makeGrid");function jt(y,A){let _=0;const v=Object.keys(gt).map(o=>[o,gt[o]]);kt.append("g").selectAll("text").data(v).enter().append(function(o){const f=o[0].split($.Y2.lineBreakRegex),h=-(f.length-1)/2,u=rt.createElementNS("http://www.w3.org/2000/svg","text");u.setAttribute("dy",h+"em");for(const[S,s]of f.entries()){const C=rt.createElementNS("http://www.w3.org/2000/svg","tspan");C.setAttribute("alignment-baseline","central"),C.setAttribute("x","10"),S>0&&C.setAttribute("dy","1em"),C.textContent=s,u.appendChild(C)}return u}).attr("x",10).attr("y",function(o,f){if(f>0)for(let h=0;h<f;h++)return _+=v[f-1][1],o[1]*y/2+_*y+A;else return o[1]*y/2+A}).attr("font-size",a.sectionFontSize).attr("class",function(o){for(const[f,h]of lt.entries())if(o[0]===h)return"sectionTitle sectionTitle"+f%a.numberSectionStyles;return"sectionTitle"})}(0,e.K)(jt,"vertLabels");function Gt(y,A,_,v){const o=r.db.getTodayMarker();if(o==="off")return;const f=kt.append("g").attr("class","today"),h=new Date,u=f.append("line");u.attr("x1",F(h)+y).attr("x2",F(h)+y).attr("y1",a.titleTopMargin).attr("y2",v-a.titleTopMargin).attr("class","today"),o!==""&&u.attr("style",o.replace(/,/g,";"))}(0,e.K)(Gt,"drawToday");function Xt(y){const A={},_=[];for(let v=0,o=y.length;v<o;++v)Object.prototype.hasOwnProperty.call(A,y[v])||(A[y[v]]=!0,_.push(y[v]));return _}(0,e.K)(Xt,"checkUnique")},"draw"),Xe={setConf:He,draw:Ge},Ze=(0,e.K)(t=>`
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
`,"getStyles"),Qe=Ze,Je={parser:g,db:Ue,renderer:Xe,styles:Qe}}}]);
