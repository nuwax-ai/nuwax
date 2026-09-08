"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[7302],{436781:function(x,C,c){c.d(C,{S:function(){return v}});var D=c(769120);function v(p,o){p.accDescr&&o.setAccDescription?.(p.accDescr),p.accTitle&&o.setAccTitle?.(p.accTitle),p.title&&o.setDiagramTitle?.(p.title)}(0,D.K)(v,"populateCommonDb")},207302:function(x,C,c){var E;c.d(C,{diagram:function(){return I}});var D=c(436781),v=c(970870),p=c(698981),o=c(767767),w=c(294654),f=c(769120),y=c(834872),$=o.UI.packet,B=(E=class{constructor(){this.packet=[],this.setAccTitle=o.SV,this.getAccTitle=o.iN,this.setDiagramTitle=o.ke,this.getDiagramTitle=o.ab,this.getAccDescription=o.m7,this.setAccDescription=o.EI}getConfig(){const t=(0,p.$t)({...$,...(0,o.zj)().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){(0,o.IU)(),this.packet=[]}},(0,f.K)(E,"PacketDB"),E),T=1e4,W=(0,f.K)((e,t)=>{(0,D.S)(e,t);let r=-1,n=[],l=1;const{bitsPerRow:d}=t.getConfig();for(let{start:a,end:i,bits:_,label:h}of e.blocks){if(a!==void 0&&i!==void 0&&i<a)throw new Error(`Packet block ${a} - ${i} is invalid. End must be greater than start.`);if(a??(a=r+1),a!==r+1)throw new Error(`Packet block ${a} - ${i??a} is not contiguous. It should start from ${r+1}.`);if(_===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(i??(i=a+(_??1)-1),_??(_=i-a+1),r=i,w.R.debug(`Packet block ${a} - ${r} with label ${h}`);n.length<=d+1&&t.getPacket().length<T;){const[k,s]=O({start:a,end:i,bits:_,label:h},l,d);if(n.push(k),k.end+1===l*d&&(t.pushWord(n),n=[],l++),!s)break;({start:a,end:i,bits:_,label:h}=s)}}t.pushWord(n)},"populate"),O=(0,f.K)((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];const n=t*r-1,l=t*r;return[{start:e.start,end:n,label:e.label,bits:n-e.start},{start:l,end:e.end,label:e.label,bits:e.end-l}]},"getNextFittingBlock"),P={parser:{yy:void 0},parse:(0,f.K)(async e=>{const t=await(0,y.qg)("packet",e),r=P.parser?.yy;if(!(r instanceof B))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");w.R.debug(t),W(t,r)},"parse")},S=(0,f.K)((e,t,r,n)=>{const l=n.db,d=l.getConfig(),{rowHeight:a,paddingY:i,bitWidth:_,bitsPerRow:h}=d,k=l.getPacket(),s=l.getDiagramTitle(),g=a+i,u=g*(k.length+1)-(s?0:a),m=_*h+2,b=(0,v.D)(t);b.attr("viewBox",`0 0 ${m} ${u}`),(0,o.a$)(b,u,m,d.useMaxWidth);for(const[L,z]of k.entries())M(b,z,L,d);b.append("text").text(s).attr("x",m/2).attr("y",u-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),M=(0,f.K)((e,t,r,{rowHeight:n,paddingX:l,paddingY:d,bitWidth:a,bitsPerRow:i,showBits:_})=>{const h=e.append("g"),k=r*(n+d)+d;for(const s of t){const g=s.start%i*a+1,u=(s.end-s.start+1)*a-l;if(h.append("rect").attr("x",g).attr("y",k).attr("width",u).attr("height",n).attr("class","packetBlock"),h.append("text").attr("x",g+u/2).attr("y",k+n/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!_)continue;const m=s.end===s.start,b=k-2;h.append("text").attr("x",g+(m?u/2:0)).attr("y",b).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",m?"middle":"start").text(s.start),m||h.append("text").attr("x",g+u).attr("y",b).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),A={draw:S},K={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},F=(0,f.K)(({packet:e}={})=>{const t=(0,p.$t)(K,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},"styles"),I={parser:P,get db(){return new B},renderer:A,styles:F}}}]);
