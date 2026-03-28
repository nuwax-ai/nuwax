"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[6315],{36221:function(C,w,l){l.d(w,{A:function(){return E}});var B=l(22092);function E(p,o){p.accDescr&&o.setAccDescription?.(p.accDescr),p.accTitle&&o.setAccTitle?.(p.accTitle),p.title&&o.setDiagramTitle?.(p.title)}(0,B.eW)(E,"populateCommonDb")},86315:function(C,w,l){var v;l.d(w,{diagram:function(){return R}});var B=l(29798),E=l(36221),p=l(47901),o=l(23661),k=l(22092),P=l(65602),y=o.vZ.packet,D=(v=class{constructor(){this.packet=[],this.setAccTitle=o.GN,this.getAccTitle=o.eu,this.setDiagramTitle=o.g2,this.getDiagramTitle=o.Kr,this.getAccDescription=o.Mx,this.setAccDescription=o.U$}getConfig(){const t=(0,p.Rb)({...y,...(0,o.iE)().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){(0,o.ZH)(),this.packet=[]}},(0,k.eW)(v,"PacketDB"),v),W=1e4,$=(0,k.eW)((e,t)=>{(0,E.A)(e,t);let r=-1,n=[],c=1;const{bitsPerRow:d}=t.getConfig();for(let{start:a,end:i,bits:_,label:h}of e.blocks){if(a!==void 0&&i!==void 0&&i<a)throw new Error(`Packet block ${a} - ${i} is invalid. End must be greater than start.`);if(a??(a=r+1),a!==r+1)throw new Error(`Packet block ${a} - ${i??a} is not contiguous. It should start from ${r+1}.`);if(_===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(i??(i=a+(_??1)-1),_??(_=i-a+1),r=i,k.cM.debug(`Packet block ${a} - ${r} with label ${h}`);n.length<=d+1&&t.getPacket().length<W;){const[u,s]=T({start:a,end:i,bits:_,label:h},c,d);if(n.push(u),u.end+1===c*d&&(t.pushWord(n),n=[],c++),!s)break;({start:a,end:i,bits:_,label:h}=s)}}t.pushWord(n)},"populate"),T=(0,k.eW)((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];const n=t*r-1,c=t*r;return[{start:e.start,end:n,label:e.label,bits:n-e.start},{start:c,end:e.end,label:e.label,bits:e.end-c}]},"getNextFittingBlock"),x={parser:{yy:void 0},parse:(0,k.eW)(async e=>{const t=await(0,P.Qc)("packet",e),r=x.parser?.yy;if(!(r instanceof D))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");k.cM.debug(t),$(t,r)},"parse")},A=(0,k.eW)((e,t,r,n)=>{const c=n.db,d=c.getConfig(),{rowHeight:a,paddingY:i,bitWidth:_,bitsPerRow:h}=d,u=c.getPacket(),s=c.getDiagramTitle(),g=a+i,f=g*(u.length+1)-(s?0:a),b=_*h+2,m=(0,B.P)(t);m.attr("viewBox",`0 0 ${b} ${f}`),(0,o.v2)(m,f,b,d.useMaxWidth);for(const[z,K]of u.entries())M(m,K,z,d);m.append("text").text(s).attr("x",b/2).attr("y",f-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),M=(0,k.eW)((e,t,r,{rowHeight:n,paddingX:c,paddingY:d,bitWidth:a,bitsPerRow:i,showBits:_})=>{const h=e.append("g"),u=r*(n+d)+d;for(const s of t){const g=s.start%i*a+1,f=(s.end-s.start+1)*a-c;if(h.append("rect").attr("x",g).attr("y",u).attr("width",f).attr("height",n).attr("class","packetBlock"),h.append("text").attr("x",g+f/2).attr("y",u+n/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!_)continue;const b=s.end===s.start,m=u-2;h.append("text").attr("x",g+(b?f/2:0)).attr("y",m).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",b?"middle":"start").text(s.start),b||h.append("text").attr("x",g+f).attr("y",m).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),O={draw:A},F={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},S=(0,k.eW)(({packet:e}={})=>{const t=(0,p.Rb)(F,e);return`
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
	`},"styles"),R={parser:x,get db(){return new D},renderer:O,styles:S}}}]);})();
