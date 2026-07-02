"use strict";(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[430],{47489:function(x,E,l){l.d(E,{A:function(){return C}});var w=l(69849);function C(p,o){p.accDescr&&o.setAccDescription?.(p.accDescr),p.accTitle&&o.setAccTitle?.(p.accTitle),p.title&&o.setDiagramTitle?.(p.title)}(0,w.e)(C,"populateCommonDb")},50430:function(x,E,l){var v;l.d(E,{diagram:function(){return L}});var w=l(47489),C=l(90375),p=l(79655),o=l(90687),P=l(7004),f=l(69849),y=l(62839),$=o.vZ.packet,B=(v=class{constructor(){this.packet=[],this.setAccTitle=o.GN,this.getAccTitle=o.eu,this.setDiagramTitle=o.g2,this.getDiagramTitle=o.Kr,this.getAccDescription=o.Mx,this.setAccDescription=o.U$}getConfig(){const t=(0,p.Rb)({...$,...(0,o.iE)().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){(0,o.ZH)(),this.packet=[]}},(0,f.e)(v,"PacketDB"),v),T=1e4,A=(0,f.e)((e,t)=>{(0,w.A)(e,t);let r=-1,n=[],c=1;const{bitsPerRow:d}=t.getConfig();for(let{start:a,end:i,bits:_,label:h}of e.blocks){if(a!==void 0&&i!==void 0&&i<a)throw new Error(`Packet block ${a} - ${i} is invalid. End must be greater than start.`);if(a??(a=r+1),a!==r+1)throw new Error(`Packet block ${a} - ${i??a} is not contiguous. It should start from ${r+1}.`);if(_===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(i??(i=a+(_??1)-1),_??(_=i-a+1),r=i,P.c.debug(`Packet block ${a} - ${r} with label ${h}`);n.length<=d+1&&t.getPacket().length<T;){const[k,s]=O({start:a,end:i,bits:_,label:h},c,d);if(n.push(k),k.end+1===c*d&&(t.pushWord(n),n=[],c++),!s)break;({start:a,end:i,bits:_,label:h}=s)}}t.pushWord(n)},"populate"),O=(0,f.e)((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];const n=t*r-1,c=t*r;return[{start:e.start,end:n,label:e.label,bits:n-e.start},{start:c,end:e.end,label:e.label,bits:e.end-c}]},"getNextFittingBlock"),D={parser:{yy:void 0},parse:(0,f.e)(async e=>{const t=await(0,y.Qc)("packet",e),r=D.parser?.yy;if(!(r instanceof B))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");P.c.debug(t),A(t,r)},"parse")},W=(0,f.e)((e,t,r,n)=>{const c=n.db,d=c.getConfig(),{rowHeight:a,paddingY:i,bitWidth:_,bitsPerRow:h}=d,k=c.getPacket(),s=c.getDiagramTitle(),g=a+i,u=g*(k.length+1)-(s?0:a),b=_*h+2,m=(0,C.P)(t);m.attr("viewBox",`0 0 ${b} ${u}`),(0,o.v2)(m,u,b,d.useMaxWidth);for(const[R,z]of k.entries())M(m,z,R,d);m.append("text").text(s).attr("x",b/2).attr("y",u-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),M=(0,f.e)((e,t,r,{rowHeight:n,paddingX:c,paddingY:d,bitWidth:a,bitsPerRow:i,showBits:_})=>{const h=e.append("g"),k=r*(n+d)+d;for(const s of t){const g=s.start%i*a+1,u=(s.end-s.start+1)*a-c;if(h.append("rect").attr("x",g).attr("y",k).attr("width",u).attr("height",n).attr("class","packetBlock"),h.append("text").attr("x",g+u/2).attr("y",k+n/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!_)continue;const b=s.end===s.start,m=k-2;h.append("text").attr("x",g+(b?u/2:0)).attr("y",m).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",b?"middle":"start").text(s.start),b||h.append("text").attr("x",g+u).attr("y",m).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),S={draw:W},I={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},F=(0,f.e)(({packet:e}={})=>{const t=(0,p.Rb)(I,e);return`
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
	`},"styles"),L={parser:D,get db(){return new B},renderer:S,styles:F}}}]);
