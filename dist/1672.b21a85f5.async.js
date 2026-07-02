(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[1672],{26110:function(_t){(function(it,I){_t.exports=I()})(this,function(){"use strict";return function(it,I){var ut=I.prototype,F=ut.format;ut.format=function(V){var e=this,Z=this.$locale();if(!this.isValid())return F.bind(this)(V);var x=this.$utils(),R=(V||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(J){switch(J){case"Q":return Math.ceil((e.$M+1)/3);case"Do":return Z.ordinal(e.$D);case"gggg":return e.weekYear();case"GGGG":return e.isoWeekYear();case"wo":return Z.ordinal(e.week(),"W");case"w":case"ww":return x.s(e.week(),J==="w"?1:2,"0");case"W":case"WW":return x.s(e.isoWeek(),J==="W"?1:2,"0");case"k":case"kk":return x.s(String(e.$H===0?24:e.$H),J==="k"?1:2,"0");case"X":return Math.floor(e.$d.getTime()/1e3);case"x":return e.$d.getTime();case"z":return"["+e.offsetName()+"]";case"zzz":return"["+e.offsetName("long")+"]";default:return J}});return F.bind(this)(R)}}})},67853:function(_t){(function(it,I){_t.exports=I()})(this,function(){"use strict";var it={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},I=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,ut=/\d/,F=/\d\d/,V=/\d\d?/,e=/\d*[^-_:/,()\s\d]+/,Z={},x=function(g){return(g=+g)+(g>68?1900:2e3)},R=function(g){return function(D){this[g]=+D}},J=[/[+-]\d\d:?(\d\d)?|Z/,function(g){(this.zone||(this.zone={})).offset=function(D){if(!D||D==="Z")return 0;var Y=D.match(/([+-]|\d\d)/g),$=60*Y[1]+(+Y[2]||0);return $===0?0:Y[0]==="+"?-$:$}(g)}],q=function(g){var D=Z[g];return D&&(D.indexOf?D:D.s.concat(D.f))},dt=function(g,D){var Y,$=Z.meridiem;if($){for(var et=1;et<=24;et+=1)if(g.indexOf($(et,0,D))>-1){Y=et>12;break}}else Y=g===(D?"pm":"PM");return Y},T={A:[e,function(g){this.afternoon=dt(g,!1)}],a:[e,function(g){this.afternoon=dt(g,!0)}],Q:[ut,function(g){this.month=3*(g-1)+1}],S:[ut,function(g){this.milliseconds=100*+g}],SS:[F,function(g){this.milliseconds=10*+g}],SSS:[/\d{3}/,function(g){this.milliseconds=+g}],s:[V,R("seconds")],ss:[V,R("seconds")],m:[V,R("minutes")],mm:[V,R("minutes")],H:[V,R("hours")],h:[V,R("hours")],HH:[V,R("hours")],hh:[V,R("hours")],D:[V,R("day")],DD:[F,R("day")],Do:[e,function(g){var D=Z.ordinal,Y=g.match(/\d+/);if(this.day=Y[0],D)for(var $=1;$<=31;$+=1)D($).replace(/\[|\]/g,"")===g&&(this.day=$)}],w:[V,R("week")],ww:[F,R("week")],M:[V,R("month")],MM:[F,R("month")],MMM:[e,function(g){var D=q("months"),Y=(q("monthsShort")||D.map(function($){return $.slice(0,3)})).indexOf(g)+1;if(Y<1)throw new Error;this.month=Y%12||Y}],MMMM:[e,function(g){var D=q("months").indexOf(g)+1;if(D<1)throw new Error;this.month=D%12||D}],Y:[/[+-]?\d+/,R("year")],YY:[F,function(g){this.year=x(g)}],YYYY:[/\d{4}/,R("year")],Z:J,ZZ:J};function ft(g){var D,Y;D=g,Y=Z&&Z.formats;for(var $=(g=D.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(W,L,B){var z=B&&B.toUpperCase();return L||Y[B]||it[B]||Y[z].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(X,G,rt){return G||rt.slice(1)})})).match(I),et=$.length,st=0;st<et;st+=1){var M=$[st],k=T[M],d=k&&k[0],E=k&&k[1];$[st]=E?{regex:d,parser:E}:M.replace(/^\[|\]$/g,"")}return function(W){for(var L={},B=0,z=0;B<et;B+=1){var X=$[B];if(typeof X=="string")z+=X.length;else{var G=X.regex,rt=X.parser,vt=W.slice(z),ot=G.exec(vt)[0];rt.call(L,ot),W=W.replace(ot,"")}}return function(kt){var wt=kt.afternoon;if(wt!==void 0){var ct=kt.hours;wt?ct<12&&(kt.hours+=12):ct===12&&(kt.hours=0),delete kt.afternoon}}(L),L}}return function(g,D,Y){Y.p.customParseFormat=!0,g&&g.parseTwoDigitYear&&(x=g.parseTwoDigitYear);var $=D.prototype,et=$.parse;$.parse=function(st){var M=st.date,k=st.utc,d=st.args;this.$u=k;var E=d[1];if(typeof E=="string"){var W=d[2]===!0,L=d[3]===!0,B=W||L,z=d[2];L&&(z=d[2]),Z=this.$locale(),!W&&z&&(Z=Y.Ls[z]),this.$d=function(vt,ot,kt,wt){try{if(["x","X"].indexOf(ot)>-1)return new Date((ot==="X"?1e3:1)*vt);var ct=ft(ot)(vt),At=ct.year,Mt=ct.month,re=ct.day,ne=ct.hours,ae=ct.minutes,oe=ct.seconds,ce=ct.milliseconds,Jt=ct.zone,qt=ct.week,Ft=new Date,Wt=re||(At||Mt?1:Ft.getDate()),Pt=At||Ft.getFullYear(),St=0;At&&!Mt||(St=Mt>0?Mt-1:Ft.getMonth());var It,Vt=ne||0,Yt=ae||0,Rt=oe||0,Bt=ce||0;return Jt?new Date(Date.UTC(Pt,St,Wt,Vt,Yt,Rt,Bt+60*Jt.offset*1e3)):kt?new Date(Date.UTC(Pt,St,Wt,Vt,Yt,Rt,Bt)):(It=new Date(Pt,St,Wt,Vt,Yt,Rt,Bt),qt&&(It=wt(It).week(qt).toDate()),It)}catch{return new Date("")}}(M,E,k,Y),this.init(),z&&z!==!0&&(this.$L=this.locale(z).$L),B&&M!=this.format(E)&&(this.$d=new Date("")),Z={}}else if(E instanceof Array)for(var X=E.length,G=1;G<=X;G+=1){d[1]=E[G-1];var rt=Y.apply(this,d);if(rt.isValid()){this.$d=rt.$d,this.$L=rt.$L,this.init();break}G===X&&(this.$d=new Date(""))}else et.call(this,st)}}})},62559:function(_t){(function(it,I){_t.exports=I()})(this,function(){"use strict";var it,I,ut=1e3,F=6e4,V=36e5,e=864e5,Z=31536e6,x=2628e6,R=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,J=/\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g,q={years:Z,months:x,days:e,hours:V,minutes:F,seconds:ut,milliseconds:1,weeks:6048e5},dt=function(M){return M instanceof et},T=function(M,k,d){return new et(M,d,k.$l)},ft=function(M){return I.p(M)+"s"},g=function(M){return M<0},D=function(M){return g(M)?Math.ceil(M):Math.floor(M)},Y=function(M){return Math.abs(M)},$=function(M,k){return M?g(M)?{negative:!0,format:""+Y(M)+k}:{negative:!1,format:""+M+k}:{negative:!1,format:""}},et=function(){function M(d,E,W){var L=this;if(this.$d={},this.$l=W,d===void 0&&(this.$ms=0,this.parseFromMilliseconds()),E)return T(d*q[ft(E)],this);if(typeof d=="number")return this.$ms=d,this.parseFromMilliseconds(),this;if(typeof d=="object")return Object.keys(d).forEach(function(X){L.$d[ft(X)]=d[X]}),this.calMilliseconds(),this;if(typeof d=="string"){var B=d.match(R);if(B){var z=B.slice(2).map(function(X){return X!=null?Number(X):0});return this.$d.years=z[0],this.$d.months=z[1],this.$d.weeks=z[2],this.$d.days=z[3],this.$d.hours=z[4],this.$d.minutes=z[5],this.$d.seconds=z[6],this.calMilliseconds(),this}}return this}var k=M.prototype;return k.calMilliseconds=function(){var d=this;this.$ms=Object.keys(this.$d).reduce(function(E,W){return E+(d.$d[W]||0)*q[W]},0)},k.parseFromMilliseconds=function(){var d=this.$ms;this.$d.years=D(d/Z),d%=Z,this.$d.months=D(d/x),d%=x,this.$d.days=D(d/e),d%=e,this.$d.hours=D(d/V),d%=V,this.$d.minutes=D(d/F),d%=F,this.$d.seconds=D(d/ut),d%=ut,this.$d.milliseconds=d},k.toISOString=function(){var d=$(this.$d.years,"Y"),E=$(this.$d.months,"M"),W=+this.$d.days||0;this.$d.weeks&&(W+=7*this.$d.weeks);var L=$(W,"D"),B=$(this.$d.hours,"H"),z=$(this.$d.minutes,"M"),X=this.$d.seconds||0;this.$d.milliseconds&&(X+=this.$d.milliseconds/1e3,X=Math.round(1e3*X)/1e3);var G=$(X,"S"),rt=d.negative||E.negative||L.negative||B.negative||z.negative||G.negative,vt=B.format||z.format||G.format?"T":"",ot=(rt?"-":"")+"P"+d.format+E.format+L.format+vt+B.format+z.format+G.format;return ot==="P"||ot==="-P"?"P0D":ot},k.toJSON=function(){return this.toISOString()},k.format=function(d){var E=d||"YYYY-MM-DDTHH:mm:ss",W={Y:this.$d.years,YY:I.s(this.$d.years,2,"0"),YYYY:I.s(this.$d.years,4,"0"),M:this.$d.months,MM:I.s(this.$d.months,2,"0"),D:this.$d.days,DD:I.s(this.$d.days,2,"0"),H:this.$d.hours,HH:I.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:I.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:I.s(this.$d.seconds,2,"0"),SSS:I.s(this.$d.milliseconds,3,"0")};return E.replace(J,function(L,B){return B||String(W[L])})},k.as=function(d){return this.$ms/q[ft(d)]},k.get=function(d){var E=this.$ms,W=ft(d);return W==="milliseconds"?E%=1e3:E=W==="weeks"?D(E/q[W]):this.$d[W],E||0},k.add=function(d,E,W){var L;return L=E?d*q[ft(E)]:dt(d)?d.$ms:T(d,this).$ms,T(this.$ms+L*(W?-1:1),this)},k.subtract=function(d,E){return this.add(d,E,!0)},k.locale=function(d){var E=this.clone();return E.$l=d,E},k.clone=function(){return T(this.$ms,this)},k.humanize=function(d){return it().add(this.$ms,"ms").locale(this.$l).fromNow(!d)},k.valueOf=function(){return this.asMilliseconds()},k.milliseconds=function(){return this.get("milliseconds")},k.asMilliseconds=function(){return this.as("milliseconds")},k.seconds=function(){return this.get("seconds")},k.asSeconds=function(){return this.as("seconds")},k.minutes=function(){return this.get("minutes")},k.asMinutes=function(){return this.as("minutes")},k.hours=function(){return this.get("hours")},k.asHours=function(){return this.as("hours")},k.days=function(){return this.get("days")},k.asDays=function(){return this.as("days")},k.weeks=function(){return this.get("weeks")},k.asWeeks=function(){return this.as("weeks")},k.months=function(){return this.get("months")},k.asMonths=function(){return this.as("months")},k.years=function(){return this.get("years")},k.asYears=function(){return this.as("years")},M}(),st=function(M,k,d){return M.add(k.years()*d,"y").add(k.months()*d,"M").add(k.days()*d,"d").add(k.hours()*d,"h").add(k.minutes()*d,"m").add(k.seconds()*d,"s").add(k.milliseconds()*d,"ms")};return function(M,k,d){it=d,I=d().$utils(),d.duration=function(L,B){var z=d.locale();return T(L,{$l:z},B)},d.isDuration=dt;var E=k.prototype.add,W=k.prototype.subtract;k.prototype.add=function(L,B){return dt(L)?st(this,L,1):E.bind(this)(L,B)},k.prototype.subtract=function(L,B){return dt(L)?st(this,L,-1):W.bind(this)(L,B)}}})},70938:function(_t){(function(it,I){_t.exports=I()})(this,function(){"use strict";var it="day";return function(I,ut,F){var V=function(x){return x.add(4-x.isoWeekday(),it)},e=ut.prototype;e.isoWeekYear=function(){return V(this).year()},e.isoWeek=function(x){if(!this.$utils().u(x))return this.add(7*(x-this.isoWeek()),it);var R,J,q,dt,T=V(this),ft=(R=this.isoWeekYear(),J=this.$u,q=(J?F.utc:F)().year(R).startOf("year"),dt=4-q.isoWeekday(),q.isoWeekday()>4&&(dt+=7),q.add(dt,it));return T.diff(ft,"week")+1},e.isoWeekday=function(x){return this.$utils().u(x)?this.day()||7:this.day(this.day()%7?x:x-7)};var Z=e.startOf;e.startOf=function(x,R){var J=this.$utils(),q=!!J.u(R)||R;return J.p(x)==="isoweek"?q?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):Z.bind(this)(x,R)}}})},41672:function(_t,it,I){"use strict";I.d(it,{diagram:function(){return Je}});var ut=I(79655),F=I(90687),V=I(7004),e=I(69849),Z=I(12657),x=I(52043),R=I(70938),J=I(67853),q=I(26110),dt=I(62559),T=I(40396),ft=function(){var t=(0,e.e)(function(v,o,f,h){for(f=f||{},h=v.length;h--;f[v[h]]=o);return f},"o"),i=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],r=[1,26],n=[1,27],a=[1,28],m=[1,29],p=[1,30],U=[1,31],nt=[1,32],bt=[1,33],K=[1,34],pt=[1,9],lt=[1,10],gt=[1,11],Dt=[1,12],mt=[1,13],P=[1,14],Nt=[1,15],zt=[1,16],Ut=[1,19],Ht=[1,20],Ot=[1,21],jt=[1,22],Xt=[1,23],Kt=[1,25],Zt=[1,35],y={trace:(0,e.e)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,e.e)(function(o,f,h,u,S,s,C){var l=s.length-1;switch(S){case 1:return s[l-1];case 2:this.$=[];break;case 3:s[l-1].push(s[l]),this.$=s[l-1];break;case 4:case 5:this.$=s[l];break;case 6:case 7:this.$=[];break;case 8:u.setWeekday("monday");break;case 9:u.setWeekday("tuesday");break;case 10:u.setWeekday("wednesday");break;case 11:u.setWeekday("thursday");break;case 12:u.setWeekday("friday");break;case 13:u.setWeekday("saturday");break;case 14:u.setWeekday("sunday");break;case 15:u.setWeekend("friday");break;case 16:u.setWeekend("saturday");break;case 17:u.setDateFormat(s[l].substr(11)),this.$=s[l].substr(11);break;case 18:u.enableInclusiveEndDates(),this.$=s[l].substr(18);break;case 19:u.TopAxis(),this.$=s[l].substr(8);break;case 20:u.setAxisFormat(s[l].substr(11)),this.$=s[l].substr(11);break;case 21:u.setTickInterval(s[l].substr(13)),this.$=s[l].substr(13);break;case 22:u.setExcludes(s[l].substr(9)),this.$=s[l].substr(9);break;case 23:u.setIncludes(s[l].substr(9)),this.$=s[l].substr(9);break;case 24:u.setTodayMarker(s[l].substr(12)),this.$=s[l].substr(12);break;case 27:u.setDiagramTitle(s[l].substr(6)),this.$=s[l].substr(6);break;case 28:this.$=s[l].trim(),u.setAccTitle(this.$);break;case 29:case 30:this.$=s[l].trim(),u.setAccDescription(this.$);break;case 31:u.addSection(s[l].substr(8)),this.$=s[l].substr(8);break;case 33:u.addTask(s[l-1],s[l]),this.$="task";break;case 34:this.$=s[l-1],u.setClickEvent(s[l-1],s[l],null);break;case 35:this.$=s[l-2],u.setClickEvent(s[l-2],s[l-1],s[l]);break;case 36:this.$=s[l-2],u.setClickEvent(s[l-2],s[l-1],null),u.setLink(s[l-2],s[l]);break;case 37:this.$=s[l-3],u.setClickEvent(s[l-3],s[l-2],s[l-1]),u.setLink(s[l-3],s[l]);break;case 38:this.$=s[l-2],u.setClickEvent(s[l-2],s[l],null),u.setLink(s[l-2],s[l-1]);break;case 39:this.$=s[l-3],u.setClickEvent(s[l-3],s[l-1],s[l]),u.setLink(s[l-3],s[l-2]);break;case 40:this.$=s[l-1],u.setLink(s[l-1],s[l]);break;case 41:case 47:this.$=s[l-1]+" "+s[l];break;case 42:case 43:case 45:this.$=s[l-2]+" "+s[l-1]+" "+s[l];break;case 44:case 46:this.$=s[l-3]+" "+s[l-2]+" "+s[l-1]+" "+s[l];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(i,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:r,13:n,14:a,15:m,16:p,17:U,18:nt,19:18,20:bt,21:K,22:pt,23:lt,24:gt,25:Dt,26:mt,27:P,28:Nt,29:zt,30:Ut,31:Ht,33:Ot,35:jt,36:Xt,37:24,38:Kt,40:Zt},t(i,[2,7],{1:[2,1]}),t(i,[2,3]),{9:36,11:17,12:r,13:n,14:a,15:m,16:p,17:U,18:nt,19:18,20:bt,21:K,22:pt,23:lt,24:gt,25:Dt,26:mt,27:P,28:Nt,29:zt,30:Ut,31:Ht,33:Ot,35:jt,36:Xt,37:24,38:Kt,40:Zt},t(i,[2,5]),t(i,[2,6]),t(i,[2,17]),t(i,[2,18]),t(i,[2,19]),t(i,[2,20]),t(i,[2,21]),t(i,[2,22]),t(i,[2,23]),t(i,[2,24]),t(i,[2,25]),t(i,[2,26]),t(i,[2,27]),{32:[1,37]},{34:[1,38]},t(i,[2,30]),t(i,[2,31]),t(i,[2,32]),{39:[1,39]},t(i,[2,8]),t(i,[2,9]),t(i,[2,10]),t(i,[2,11]),t(i,[2,12]),t(i,[2,13]),t(i,[2,14]),t(i,[2,15]),t(i,[2,16]),{41:[1,40],43:[1,41]},t(i,[2,4]),t(i,[2,28]),t(i,[2,29]),t(i,[2,33]),t(i,[2,34],{42:[1,42],43:[1,43]}),t(i,[2,40],{41:[1,44]}),t(i,[2,35],{43:[1,45]}),t(i,[2,36]),t(i,[2,38],{42:[1,46]}),t(i,[2,37]),t(i,[2,39])],defaultActions:{},parseError:(0,e.e)(function(o,f){if(f.recoverable)this.trace(o);else{var h=new Error(o);throw h.hash=f,h}},"parseError"),parse:(0,e.e)(function(o){var f=this,h=[0],u=[],S=[null],s=[],C=this.table,l="",tt=0,c=0,b=0,w=2,H=1,j=s.slice.call(arguments,1),A=Object.create(this.lexer),N={yy:{}};for(var Gt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Gt)&&(N.yy[Gt]=this.yy[Gt]);A.setInput(o,N.yy),N.yy.lexer=A,N.yy.parser=this,typeof A.yylloc>"u"&&(A.yylloc={});var Qt=A.yylloc;s.push(Qt);var qe=A.options&&A.options.ranges;typeof N.yy.parseError=="function"?this.parseError=N.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ts(ht){h.length=h.length-2*ht,S.length=S.length-ht,s.length=s.length-ht}(0,e.e)(ts,"popStack");function Ee(){var ht;return ht=u.pop()||A.lex()||H,typeof ht!="number"&&(ht instanceof Array&&(u=ht,ht=u.pop()),ht=f.symbols_[ht]||ht),ht}(0,e.e)(Ee,"lex");for(var at,he,Ct,yt,es,ke,$t={},se,xt,Ce,ie;;){if(Ct=h[h.length-1],this.defaultActions[Ct]?yt=this.defaultActions[Ct]:((at===null||typeof at>"u")&&(at=Ee()),yt=C[Ct]&&C[Ct][at]),typeof yt>"u"||!yt.length||!yt[0]){var me="";ie=[];for(se in C[Ct])this.terminals_[se]&&se>w&&ie.push("'"+this.terminals_[se]+"'");A.showPosition?me="Parse error on line "+(tt+1)+`:
`+A.showPosition()+`
Expecting `+ie.join(", ")+", got '"+(this.terminals_[at]||at)+"'":me="Parse error on line "+(tt+1)+": Unexpected "+(at==H?"end of input":"'"+(this.terminals_[at]||at)+"'"),this.parseError(me,{text:A.match,token:this.terminals_[at]||at,line:A.yylineno,loc:Qt,expected:ie})}if(yt[0]instanceof Array&&yt.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Ct+", token: "+at);switch(yt[0]){case 1:h.push(at),S.push(A.yytext),s.push(A.yylloc),h.push(yt[1]),at=null,he?(at=he,he=null):(c=A.yyleng,l=A.yytext,tt=A.yylineno,Qt=A.yylloc,b>0&&b--);break;case 2:if(xt=this.productions_[yt[1]][1],$t.$=S[S.length-xt],$t._$={first_line:s[s.length-(xt||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(xt||1)].first_column,last_column:s[s.length-1].last_column},qe&&($t._$.range=[s[s.length-(xt||1)].range[0],s[s.length-1].range[1]]),ke=this.performAction.apply($t,[l,c,tt,N.yy,yt[1],S,s].concat(j)),typeof ke<"u")return ke;xt&&(h=h.slice(0,-1*xt*2),S=S.slice(0,-1*xt),s=s.slice(0,-1*xt)),h.push(this.productions_[yt[1]][0]),S.push($t.$),s.push($t._$),Ce=C[h[h.length-2]][h[h.length-1]],h.push(Ce);break;case 3:return!0}}return!0},"parse")},O=function(){var v={EOF:1,parseError:(0,e.e)(function(f,h){if(this.yy.parser)this.yy.parser.parseError(f,h);else throw new Error(f)},"parseError"),setInput:(0,e.e)(function(o,f){return this.yy=f||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,e.e)(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var f=o.match(/(?:\r\n?|\n).*/g);return f?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:(0,e.e)(function(o){var f=o.length,h=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-f),this.offset-=f;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var S=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===u.length?this.yylloc.first_column:0)+u[u.length-h.length].length-h[0].length:this.yylloc.first_column-f},this.options.ranges&&(this.yylloc.range=[S[0],S[0]+this.yyleng-f]),this.yyleng=this.yytext.length,this},"unput"),more:(0,e.e)(function(){return this._more=!0,this},"more"),reject:(0,e.e)(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:(0,e.e)(function(o){this.unput(this.match.slice(o))},"less"),pastInput:(0,e.e)(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,e.e)(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,e.e)(function(){var o=this.pastInput(),f=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+f+"^"},"showPosition"),test_match:(0,e.e)(function(o,f){var h,u,S;if(this.options.backtrack_lexer&&(S={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(S.yylloc.range=this.yylloc.range.slice(0))),u=o[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],h=this.performAction.call(this,this.yy,this,f,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var s in S)this[s]=S[s];return!1}return!1},"test_match"),next:(0,e.e)(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,f,h,u;this._more||(this.yytext="",this.match="");for(var S=this._currentRules(),s=0;s<S.length;s++)if(h=this._input.match(this.rules[S[s]]),h&&(!f||h[0].length>f[0].length)){if(f=h,u=s,this.options.backtrack_lexer){if(o=this.test_match(h,S[s]),o!==!1)return o;if(this._backtrack){f=!1;continue}else return!1}else if(!this.options.flex)break}return f?(o=this.test_match(f,S[u]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,e.e)(function(){var f=this.next();return f||this.lex()},"lex"),begin:(0,e.e)(function(f){this.conditionStack.push(f)},"begin"),popState:(0,e.e)(function(){var f=this.conditionStack.length-1;return f>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,e.e)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,e.e)(function(f){return f=this.conditionStack.length-1-Math.abs(f||0),f>=0?this.conditionStack[f]:"INITIAL"},"topState"),pushState:(0,e.e)(function(f){this.begin(f)},"pushState"),stateStackSize:(0,e.e)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,e.e)(function(f,h,u,S){var s=S;switch(u){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return v}();y.lexer=O;function _(){this.yy={}}return(0,e.e)(_,"Parser"),_.prototype=y,y.Parser=_,new _}();ft.parser=ft;var g=ft;x.extend(R),x.extend(J),x.extend(q);var D={friday:5,saturday:6},Y="",$="",et=void 0,st="",M=[],k=[],d=new Map,E=[],W=[],L="",B="",z=["active","done","crit","milestone","vert"],X=[],G="",rt=!1,vt=!1,ot="sunday",kt="saturday",wt=0,ct=(0,e.e)(function(){E=[],W=[],L="",X=[],te=0,ue=void 0,ee=void 0,Q=[],Y="",$="",B="",et=void 0,st="",M=[],k=[],rt=!1,vt=!1,wt=0,d=new Map,G="",(0,F.ZH)(),ot="sunday",kt="saturday"},"clear"),At=(0,e.e)(function(t){G=t},"setDiagramId"),Mt=(0,e.e)(function(t){$=t},"setAxisFormat"),re=(0,e.e)(function(){return $},"getAxisFormat"),ne=(0,e.e)(function(t){et=t},"setTickInterval"),ae=(0,e.e)(function(){return et},"getTickInterval"),oe=(0,e.e)(function(t){st=t},"setTodayMarker"),ce=(0,e.e)(function(){return st},"getTodayMarker"),Jt=(0,e.e)(function(t){Y=t},"setDateFormat"),qt=(0,e.e)(function(){rt=!0},"enableInclusiveEndDates"),Ft=(0,e.e)(function(){return rt},"endDatesAreInclusive"),Wt=(0,e.e)(function(){vt=!0},"enableTopAxis"),Pt=(0,e.e)(function(){return vt},"topAxisEnabled"),St=(0,e.e)(function(t){B=t},"setDisplayMode"),It=(0,e.e)(function(){return B},"getDisplayMode"),Vt=(0,e.e)(function(){return Y},"getDateFormat"),Yt=(0,e.e)((t,i)=>{const r=i.toLowerCase().split(/[\s,]+/).filter(n=>n!=="");return[...new Set([...t,...r])]},"mergeTokens"),Rt=(0,e.e)(function(t){M=Yt(M,t)},"setIncludes"),Bt=(0,e.e)(function(){return M},"getIncludes"),ye=(0,e.e)(function(t){k=Yt(k,t)},"setExcludes"),Me=(0,e.e)(function(){return k},"getExcludes"),Se=(0,e.e)(function(){return d},"getLinks"),Ie=(0,e.e)(function(t){L=t,E.push(t)},"addSection"),Ye=(0,e.e)(function(){return E},"getSections"),Le=(0,e.e)(function(){let t=xe();const i=10;let r=0;for(;!t&&r<i;)t=xe(),r++;return W=Q,W},"getTasks"),ge=(0,e.e)(function(t,i,r,n){const a=t.format(i.trim()),m=t.format("YYYY-MM-DD");return n.includes(a)||n.includes(m)?!1:r.includes("weekends")&&(t.isoWeekday()===D[kt]||t.isoWeekday()===D[kt]+1)||r.includes(t.format("dddd").toLowerCase())?!0:r.includes(a)||r.includes(m)},"isInvalidDate"),Oe=(0,e.e)(function(t){ot=t},"setWeekday"),$e=(0,e.e)(function(){return ot},"getWeekday"),Ae=(0,e.e)(function(t){kt=t},"setWeekend"),ve=(0,e.e)(function(t,i,r,n){if(!r.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=x(t.startTime):a=x(t.startTime,i,!0),a=a.add(1,"d");let m;t.endTime instanceof Date?m=x(t.endTime):m=x(t.endTime,i,!0);const[p,U]=Fe(a,m,i,r,n);t.endTime=p.toDate(),t.renderEndTime=U},"checkTaskDates"),Fe=(0,e.e)(function(t,i,r,n,a){let m=!1,p=null;const U=i.add(1e4,"d");for(;t<=i;){if(m||(p=i.toDate()),m=ge(t,r,n,a),m&&(i=i.add(1,"d"),i>U))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,"d")}return[i,p]},"fixTaskDates"),le=(0,e.e)(function(t,i,r){if(r=r.trim(),(0,e.e)(U=>{const nt=U.trim();return nt==="x"||nt==="X"},"isTimestampFormat")(i)&&/^\d+$/.test(r))return new Date(Number(r));const m=/^after\s+(?<ids>[\d\w- ]+)/.exec(r);if(m!==null){let U=null;for(const bt of m.groups.ids.split(" ")){let K=Et(bt);K!==void 0&&(!U||K.endTime>U.endTime)&&(U=K)}if(U)return U.endTime;const nt=new Date;return nt.setHours(0,0,0,0),nt}let p=x(r,i.trim(),!0);if(p.isValid())return p.toDate();{V.c.debug("Invalid date:"+r),V.c.debug("With date format:"+i.trim());const U=new Date(r);if(U===void 0||isNaN(U.getTime())||U.getFullYear()<-1e4||U.getFullYear()>1e4)throw new Error("Invalid date:"+r);return U}},"getStartDate"),pe=(0,e.e)(function(t){const i=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return i!==null?[Number.parseFloat(i[1]),i[2]]:[NaN,"ms"]},"parseDuration"),Te=(0,e.e)(function(t,i,r,n=!1){r=r.trim();const m=/^until\s+(?<ids>[\d\w- ]+)/.exec(r);if(m!==null){let K=null;for(const lt of m.groups.ids.split(" ")){let gt=Et(lt);gt!==void 0&&(!K||gt.startTime<K.startTime)&&(K=gt)}if(K)return K.startTime;const pt=new Date;return pt.setHours(0,0,0,0),pt}let p=x(r,i.trim(),!0);if(p.isValid())return n&&(p=p.add(1,"d")),p.toDate();let U=x(t);const[nt,bt]=pe(r);if(!Number.isNaN(nt)){const K=U.add(nt,bt);K.isValid()&&(U=K)}return U.toDate()},"getEndDate"),te=0,Lt=(0,e.e)(function(t){return t===void 0?(te=te+1,"task"+te):t},"parseId"),We=(0,e.e)(function(t,i){let r;i.substr(0,1)===":"?r=i.substr(1,i.length):r=i;const n=r.split(","),a={};de(n,a,z);for(let p=0;p<n.length;p++)n[p]=n[p].trim();let m="";switch(n.length){case 1:a.id=Lt(),a.startTime=t.endTime,m=n[0];break;case 2:a.id=Lt(),a.startTime=le(void 0,Y,n[0]),m=n[1];break;case 3:a.id=Lt(n[0]),a.startTime=le(void 0,Y,n[1]),m=n[2];break;default:}return m&&(a.endTime=Te(a.startTime,Y,m,rt),a.manualEndTime=x(m,"YYYY-MM-DD",!0).isValid(),ve(a,Y,k,M)),a},"compileData"),Pe=(0,e.e)(function(t,i){let r;i.substr(0,1)===":"?r=i.substr(1,i.length):r=i;const n=r.split(","),a={};de(n,a,z);for(let m=0;m<n.length;m++)n[m]=n[m].trim();switch(n.length){case 1:a.id=Lt(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:n[0]};break;case 2:a.id=Lt(),a.startTime={type:"getStartDate",startData:n[0]},a.endTime={data:n[1]};break;case 3:a.id=Lt(n[0]),a.startTime={type:"getStartDate",startData:n[1]},a.endTime={data:n[2]};break;default:}return a},"parseData"),ue,ee,Q=[],be={},Ve=(0,e.e)(function(t,i){const r={section:L,type:L,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:i},task:t,classes:[]},n=Pe(ee,i);r.raw.startTime=n.startTime,r.raw.endTime=n.endTime,r.id=n.id,r.prevTaskId=ee,r.active=n.active,r.done=n.done,r.crit=n.crit,r.milestone=n.milestone,r.vert=n.vert,r.vert?r.order=-1:(r.order=wt,wt++);const a=Q.push(r);ee=r.id,be[r.id]=a-1},"addTask"),Et=(0,e.e)(function(t){const i=be[t];return Q[i]},"findTaskById"),Re=(0,e.e)(function(t,i){const r={section:L,type:L,description:t,task:t,classes:[]},n=We(ue,i);r.startTime=n.startTime,r.endTime=n.endTime,r.id=n.id,r.active=n.active,r.done=n.done,r.crit=n.crit,r.milestone=n.milestone,r.vert=n.vert,ue=r,W.push(r)},"addTaskOrg"),xe=(0,e.e)(function(){const t=(0,e.e)(function(r){const n=Q[r];let a="";switch(Q[r].raw.startTime.type){case"prevTaskEnd":{const m=Et(n.prevTaskId);n.startTime=m.endTime;break}case"getStartDate":a=le(void 0,Y,Q[r].raw.startTime.startData),a&&(Q[r].startTime=a);break}return Q[r].startTime&&(Q[r].endTime=Te(Q[r].startTime,Y,Q[r].raw.endTime.data,rt),Q[r].endTime&&(Q[r].processed=!0,Q[r].manualEndTime=x(Q[r].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),ve(Q[r],Y,k,M))),Q[r].processed},"compileTask");let i=!0;for(const[r,n]of Q.entries())t(r),i=i&&n.processed;return i},"compileTasks"),Be=(0,e.e)(function(t,i){let r=i;(0,F.nV)().securityLevel!=="loose"&&(r=(0,Z.N)(i)),t.split(",").forEach(function(n){Et(n)!==void 0&&(we(n,()=>{window.open(r,"_self")}),d.set(n,r))}),_e(t,"clickable")},"setLink"),_e=(0,e.e)(function(t,i){t.split(",").forEach(function(r){let n=Et(r);n!==void 0&&n.classes.push(i)})},"setClass"),Ne=(0,e.e)(function(t,i,r){if((0,F.nV)().securityLevel!=="loose"||i===void 0)return;let n=[];if(typeof r=="string"){n=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let m=0;m<n.length;m++){let p=n[m].trim();p.startsWith('"')&&p.endsWith('"')&&(p=p.substr(1,p.length-2)),n[m]=p}}n.length===0&&n.push(t),Et(t)!==void 0&&we(t,()=>{ut.w8.runFunc(i,...n)})},"setClickFun"),we=(0,e.e)(function(t,i){X.push(function(){const r=G?`${G}-${t}`:t,n=document.querySelector(`[id="${r}"]`);n!==null&&n.addEventListener("click",function(){i()})},function(){const r=G?`${G}-${t}`:t,n=document.querySelector(`[id="${r}-text"]`);n!==null&&n.addEventListener("click",function(){i()})})},"pushFun"),ze=(0,e.e)(function(t,i,r){t.split(",").forEach(function(n){Ne(n,i,r)}),_e(t,"clickable")},"setClickEvent"),Ue=(0,e.e)(function(t){X.forEach(function(i){i(t)})},"bindFunctions"),He={getConfig:(0,e.e)(()=>(0,F.nV)().gantt,"getConfig"),clear:ct,setDateFormat:Jt,getDateFormat:Vt,enableInclusiveEndDates:qt,endDatesAreInclusive:Ft,enableTopAxis:Wt,topAxisEnabled:Pt,setAxisFormat:Mt,getAxisFormat:re,setTickInterval:ne,getTickInterval:ae,setTodayMarker:oe,getTodayMarker:ce,setAccTitle:F.GN,getAccTitle:F.eu,setDiagramTitle:F.g2,getDiagramTitle:F.Kr,setDiagramId:At,setDisplayMode:St,getDisplayMode:It,setAccDescription:F.U$,getAccDescription:F.Mx,addSection:Ie,getSections:Ye,getTasks:Le,addTask:Ve,findTaskById:Et,addTaskOrg:Re,setIncludes:Rt,getIncludes:Bt,setExcludes:ye,getExcludes:Me,setClickEvent:ze,setLink:Be,getLinks:Se,bindFunctions:Ue,parseDuration:pe,isInvalidDate:ge,setWeekday:Oe,getWeekday:$e,setWeekend:Ae};function de(t,i,r){let n=!0;for(;n;)n=!1,r.forEach(function(a){const m="^\\s*"+a+"\\s*$",p=new RegExp(m);t[0].match(p)&&(i[a]=!0,t.shift(1),n=!0)})}(0,e.e)(de,"getTaskTags"),x.extend(dt);var je=(0,e.e)(function(){V.c.debug("Something is calling, setConf, remove the call")},"setConf"),De={monday:T.Ox9,tuesday:T.YDX,wednesday:T.EFj,thursday:T.Igq,friday:T.y2j,saturday:T.LqH,sunday:T.Zyz},Xe=(0,e.e)((t,i)=>{let r=[...t].map(()=>-1/0),n=[...t].sort((m,p)=>m.startTime-p.startTime||m.order-p.order),a=0;for(const m of n)for(let p=0;p<r.length;p++)if(m.startTime>=r[p]){r[p]=m.endTime,m.order=p+i,p>a&&(a=p);break}return a},"getMaxIntersections"),Tt,fe=1e4,Ke=(0,e.e)(function(t,i,r,n){const a=(0,F.nV)().gantt;n.db.setDiagramId(i);const m=(0,F.nV)().securityLevel;let p;m==="sandbox"&&(p=(0,T.Ys)("#i"+i));const U=m==="sandbox"?(0,T.Ys)(p.nodes()[0].contentDocument.body):(0,T.Ys)("body"),nt=m==="sandbox"?p.nodes()[0].contentDocument:document,bt=nt.getElementById(i);Tt=bt.parentElement.offsetWidth,Tt===void 0&&(Tt=1200),a.useWidth!==void 0&&(Tt=a.useWidth);const K=n.db.getTasks(),pt=K.filter(y=>!y.vert);let lt=[];for(const y of pt)lt.push(y.type);lt=Zt(lt);const gt={};let Dt=2*a.topPadding;if(n.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const y={};for(const _ of pt)y[_.section]===void 0?y[_.section]=[_]:y[_.section].push(_);let O=0;for(const _ of Object.keys(y)){const v=Xe(y[_],O)+1;O+=v,Dt+=v*(a.barHeight+a.barGap),gt[_]=v}}else{Dt+=pt.length*(a.barHeight+a.barGap);for(const y of lt)gt[y]=pt.filter(O=>O.type===y).length}bt.setAttribute("viewBox","0 0 "+Tt+" "+Dt);const mt=U.select(`[id="${i}"]`),P=(0,T.Xf)().domain([(0,T.VV$)(K,function(y){return y.startTime}),(0,T.Fp7)(K,function(y){return y.endTime})]).rangeRound([0,Tt-a.leftPadding-a.rightPadding]);function Nt(y,O){const _=y.startTime,v=O.startTime;let o=0;return _>v?o=1:_<v&&(o=-1),o}(0,e.e)(Nt,"taskCompare"),K.sort(Nt),zt(K,Tt,Dt),(0,F.v2)(mt,Dt,Tt,a.useMaxWidth),mt.append("text").text(n.db.getDiagramTitle()).attr("x",Tt/2).attr("y",a.titleTopMargin).attr("class","titleText");function zt(y,O,_){const v=a.barHeight,o=v+a.barGap,f=a.topPadding,h=a.leftPadding,u=(0,T.BYU)().domain([0,lt.length]).range(["#00B9FA","#F95002"]).interpolate(T.JHv);Ht(o,f,h,O,_,y,n.db.getExcludes(),n.db.getIncludes()),jt(h,f,O,_),Ut(y,o,f,h,v,u,O,_),Xt(o,f,h,v,u),Kt(h,f,O,_)}(0,e.e)(zt,"makeGantt");function Ut(y,O,_,v,o,f,h){y.sort((c,b)=>c.vert===b.vert?0:c.vert?1:-1);const u=y.filter(c=>!c.vert),s=[...new Set(u.map(c=>c.order))].map(c=>u.find(b=>b.order===c));mt.append("g").selectAll("rect").data(s).enter().append("rect").attr("x",0).attr("y",function(c,b){return b=c.order,b*O+_-2}).attr("width",function(){return h-a.rightPadding/2}).attr("height",O).attr("class",function(c){for(const[b,w]of lt.entries())if(c.type===w)return"section section"+b%a.numberSectionStyles;return"section section0"}).enter();const C=mt.append("g").selectAll("rect").data(y).enter(),l=n.db.getLinks();if(C.append("rect").attr("id",function(c){return i+"-"+c.id}).attr("rx",3).attr("ry",3).attr("x",function(c){return c.milestone?P(c.startTime)+v+.5*(P(c.endTime)-P(c.startTime))-.5*o:P(c.startTime)+v}).attr("y",function(c,b){return b=c.order,c.vert?a.gridLineStartPadding:b*O+_}).attr("width",function(c){return c.milestone?o:c.vert?.08*o:P(c.renderEndTime||c.endTime)-P(c.startTime)}).attr("height",function(c){return c.vert?u.length*(a.barHeight+a.barGap)+a.barHeight*2:o}).attr("transform-origin",function(c,b){return b=c.order,(P(c.startTime)+v+.5*(P(c.endTime)-P(c.startTime))).toString()+"px "+(b*O+_+.5*o).toString()+"px"}).attr("class",function(c){const b="task";let w="";c.classes.length>0&&(w=c.classes.join(" "));let H=0;for(const[A,N]of lt.entries())c.type===N&&(H=A%a.numberSectionStyles);let j="";return c.active?c.crit?j+=" activeCrit":j=" active":c.done?c.crit?j=" doneCrit":j=" done":c.crit&&(j+=" crit"),j.length===0&&(j=" task"),c.milestone&&(j=" milestone "+j),c.vert&&(j=" vert "+j),j+=H,j+=" "+w,b+j}),C.append("text").attr("id",function(c){return i+"-"+c.id+"-text"}).text(function(c){return c.task}).attr("font-size",a.fontSize).attr("x",function(c){let b=P(c.startTime),w=P(c.renderEndTime||c.endTime);if(c.milestone&&(b+=.5*(P(c.endTime)-P(c.startTime))-.5*o,w=b+o),c.vert)return P(c.startTime)+v;const H=this.getBBox().width;return H>w-b?w+H+1.5*a.leftPadding>h?b+v-5:w+v+5:(w-b)/2+b+v}).attr("y",function(c,b){return c.vert?a.gridLineStartPadding+u.length*(a.barHeight+a.barGap)+60:(b=c.order,b*O+a.barHeight/2+(a.fontSize/2-2)+_)}).attr("text-height",o).attr("class",function(c){const b=P(c.startTime);let w=P(c.endTime);c.milestone&&(w=b+o);const H=this.getBBox().width;let j="";c.classes.length>0&&(j=c.classes.join(" "));let A=0;for(const[Gt,Qt]of lt.entries())c.type===Qt&&(A=Gt%a.numberSectionStyles);let N="";return c.active&&(c.crit?N="activeCritText"+A:N="activeText"+A),c.done?c.crit?N=N+" doneCritText"+A:N=N+" doneText"+A:c.crit&&(N=N+" critText"+A),c.milestone&&(N+=" milestoneText"),c.vert&&(N+=" vertText"),H>w-b?w+H+1.5*a.leftPadding>h?j+" taskTextOutsideLeft taskTextOutside"+A+" "+N:j+" taskTextOutsideRight taskTextOutside"+A+" "+N+" width-"+H:j+" taskText taskText"+A+" "+N+" width-"+H}),(0,F.nV)().securityLevel==="sandbox"){let c;c=(0,T.Ys)("#i"+i);const b=c.nodes()[0].contentDocument;C.filter(function(w){return l.has(w.id)}).each(function(w){var H=b.querySelector("#"+CSS.escape(i+"-"+w.id)),j=b.querySelector("#"+CSS.escape(i+"-"+w.id+"-text"));const A=H.parentNode;var N=b.createElement("a");N.setAttribute("xlink:href",l.get(w.id)),N.setAttribute("target","_top"),A.appendChild(N),N.appendChild(H),N.appendChild(j)})}}(0,e.e)(Ut,"drawRects");function Ht(y,O,_,v,o,f,h,u){if(h.length===0&&u.length===0)return;let S,s;for(const{startTime:w,endTime:H}of f)(S===void 0||w<S)&&(S=w),(s===void 0||H>s)&&(s=H);if(!S||!s)return;if(x(s).diff(x(S),"year")>5){V.c.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const C=n.db.getDateFormat(),l=[];let tt=null,c=x(S);for(;c.valueOf()<=s;)n.db.isInvalidDate(c,C,h,u)?tt?tt.end=c:tt={start:c,end:c}:tt&&(l.push(tt),tt=null),c=c.add(1,"d");mt.append("g").selectAll("rect").data(l).enter().append("rect").attr("id",w=>i+"-exclude-"+w.start.format("YYYY-MM-DD")).attr("x",w=>P(w.start.startOf("day"))+_).attr("y",a.gridLineStartPadding).attr("width",w=>P(w.end.endOf("day"))-P(w.start.startOf("day"))).attr("height",o-O-a.gridLineStartPadding).attr("transform-origin",function(w,H){return(P(w.start)+_+.5*(P(w.end)-P(w.start))).toString()+"px "+(H*y+.5*o).toString()+"px"}).attr("class","exclude-range")}(0,e.e)(Ht,"drawExcludeDays");function Ot(y,O,_,v){if(_<=0||y>O)return 1/0;const o=O-y,f=x.duration({[v??"day"]:_}).asMilliseconds();return f<=0?1/0:Math.ceil(o/f)}(0,e.e)(Ot,"getEstimatedTickCount");function jt(y,O,_,v){const o=n.db.getDateFormat(),f=n.db.getAxisFormat();let h;f?h=f:o==="D"?h="%d":h=a.axisFormat??"%Y-%m-%d";let u=(0,T.LLu)(P).tickSize(-v+O+a.gridLineStartPadding).tickFormat((0,T.i$Z)(h));const s=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(n.db.getTickInterval()||a.tickInterval);if(s!==null){const C=parseInt(s[1],10);if(isNaN(C)||C<=0)V.c.warn(`Invalid tick interval value: "${s[1]}". Skipping custom tick interval.`);else{const l=s[2],tt=n.db.getWeekday()||a.weekday,c=P.domain(),b=c[0],w=c[1],H=Ot(b,w,C,l);if(H>fe)V.c.warn(`The tick interval "${C}${l}" would generate ${H} ticks, which exceeds the maximum allowed (${fe}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(l){case"millisecond":u.ticks(T.U8T.every(C));break;case"second":u.ticks(T.S1K.every(C));break;case"minute":u.ticks(T.Z_i.every(C));break;case"hour":u.ticks(T.WQD.every(C));break;case"day":u.ticks(T.rr1.every(C));break;case"week":u.ticks(De[tt].every(C));break;case"month":u.ticks(T.F0B.every(C));break}}}if(mt.append("g").attr("class","grid").attr("transform","translate("+y+", "+(v-50)+")").call(u).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),n.db.topAxisEnabled()||a.topAxis){let C=(0,T.F5q)(P).tickSize(-v+O+a.gridLineStartPadding).tickFormat((0,T.i$Z)(h));if(s!==null){const l=parseInt(s[1],10);if(isNaN(l)||l<=0)V.c.warn(`Invalid tick interval value: "${s[1]}". Skipping custom tick interval.`);else{const tt=s[2],c=n.db.getWeekday()||a.weekday,b=P.domain(),w=b[0],H=b[1];if(Ot(w,H,l,tt)<=fe)switch(tt){case"millisecond":C.ticks(T.U8T.every(l));break;case"second":C.ticks(T.S1K.every(l));break;case"minute":C.ticks(T.Z_i.every(l));break;case"hour":C.ticks(T.WQD.every(l));break;case"day":C.ticks(T.rr1.every(l));break;case"week":C.ticks(De[c].every(l));break;case"month":C.ticks(T.F0B.every(l));break}}}mt.append("g").attr("class","grid").attr("transform","translate("+y+", "+O+")").call(C).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}(0,e.e)(jt,"makeGrid");function Xt(y,O){let _=0;const v=Object.keys(gt).map(o=>[o,gt[o]]);mt.append("g").selectAll("text").data(v).enter().append(function(o){const f=o[0].split(F.SY.lineBreakRegex),h=-(f.length-1)/2,u=nt.createElementNS("http://www.w3.org/2000/svg","text");u.setAttribute("dy",h+"em");for(const[S,s]of f.entries()){const C=nt.createElementNS("http://www.w3.org/2000/svg","tspan");C.setAttribute("alignment-baseline","central"),C.setAttribute("x","10"),S>0&&C.setAttribute("dy","1em"),C.textContent=s,u.appendChild(C)}return u}).attr("x",10).attr("y",function(o,f){if(f>0)for(let h=0;h<f;h++)return _+=v[f-1][1],o[1]*y/2+_*y+O;else return o[1]*y/2+O}).attr("font-size",a.sectionFontSize).attr("class",function(o){for(const[f,h]of lt.entries())if(o[0]===h)return"sectionTitle sectionTitle"+f%a.numberSectionStyles;return"sectionTitle"})}(0,e.e)(Xt,"vertLabels");function Kt(y,O,_,v){const o=n.db.getTodayMarker();if(o==="off")return;const f=mt.append("g").attr("class","today"),h=new Date,u=f.append("line");u.attr("x1",P(h)+y).attr("x2",P(h)+y).attr("y1",a.titleTopMargin).attr("y2",v-a.titleTopMargin).attr("class","today"),o!==""&&u.attr("style",o.replace(/,/g,";"))}(0,e.e)(Kt,"drawToday");function Zt(y){const O={},_=[];for(let v=0,o=y.length;v<o;++v)Object.prototype.hasOwnProperty.call(O,y[v])||(O[y[v]]=!0,_.push(y[v]));return _}(0,e.e)(Zt,"checkUnique")},"draw"),Ze={setConf:je,draw:Ke},Ge=(0,e.e)(t=>`
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
`,"getStyles"),Qe=Ge,Je={parser:g,db:He,renderer:Ze,styles:Qe}}}]);
