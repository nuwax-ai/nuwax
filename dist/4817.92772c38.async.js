"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[4817],{40578:function(x,B,l){l.d(B,{A:function(){return E}});var w=l(57099);function E(h,o){h.accDescr&&o.setAccDescription?.(h.accDescr),h.accTitle&&o.setAccTitle?.(h.accTitle),h.title&&o.setDiagramTitle?.(h.title)}(0,w.eW)(E,"populateCommonDb")},94817:function(x,B,l){var v;l.d(B,{diagram:function(){return R}});var w=l(47953),E=l(40578),h=l(74128),o=l(98994),_=l(57099),P=l(88642),y=o.vZ.packet,D=(v=class{constructor(){this.packet=[],this.setAccTitle=o.GN,this.getAccTitle=o.eu,this.setDiagramTitle=o.g2,this.getDiagramTitle=o.Kr,this.getAccDescription=o.Mx,this.setAccDescription=o.U$}getConfig(){const t=(0,h.Rb)({...y,...(0,o.iE)().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){(0,o.ZH)(),this.packet=[]}},(0,_.eW)(v,"PacketDB"),v),W=1e4,$=(0,_.eW)((e,t)=>{(0,E.A)(e,t);let r=-1,s=[],c=1;const{bitsPerRow:d}=t.getConfig();for(let{start:a,end:i,bits:k,label:p}of e.blocks){if(a!==void 0&&i!==void 0&&i<a)throw new Error(`Packet block ${a} - ${i} is invalid. End must be greater than start.`);if(a??(a=r+1),a!==r+1)throw new Error(`Packet block ${a} - ${i??a} is not contiguous. It should start from ${r+1}.`);if(k===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(i??(i=a+(k??1)-1),k??(k=i-a+1),r=i,_.cM.debug(`Packet block ${a} - ${r} with label ${p}`);s.length<=d+1&&t.getPacket().length<W;){const[f,n]=T({start:a,end:i,bits:k,label:p},c,d);if(s.push(f),f.end+1===c*d&&(t.pushWord(s),s=[],c++),!n)break;({start:a,end:i,bits:k,label:p}=n)}}t.pushWord(s)},"populate"),T=(0,_.eW)((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];const s=t*r-1,c=t*r;return[{start:e.start,end:s,label:e.label,bits:s-e.start},{start:c,end:e.end,label:e.label,bits:e.end-c}]},"getNextFittingBlock"),C={parser:{yy:void 0},parse:(0,_.eW)(async e=>{const t=await(0,P.Qc)("packet",e),r=C.parser?.yy;if(!(r instanceof D))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");_.cM.debug(t),$(t,r)},"parse")},A=(0,_.eW)((e,t,r,s)=>{const c=s.db,d=c.getConfig(),{rowHeight:a,paddingY:i,bitWidth:k,bitsPerRow:p}=d,f=c.getPacket(),n=c.getDiagramTitle(),g=a+i,u=g*(f.length+1)-(n?0:a),b=k*p+2,m=(0,w.P)(t);m.attr("viewbox",`0 0 ${b} ${u}`),(0,o.v2)(m,u,b,d.useMaxWidth);for(const[z,U]of f.entries())M(m,U,z,d);m.append("text").text(n).attr("x",b/2).attr("y",u-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),M=(0,_.eW)((e,t,r,{rowHeight:s,paddingX:c,paddingY:d,bitWidth:a,bitsPerRow:i,showBits:k})=>{const p=e.append("g"),f=r*(s+d)+d;for(const n of t){const g=n.start%i*a+1,u=(n.end-n.start+1)*a-c;if(p.append("rect").attr("x",g).attr("y",f).attr("width",u).attr("height",s).attr("class","packetBlock"),p.append("text").attr("x",g+u/2).attr("y",f+s/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(n.label),!k)continue;const b=n.end===n.start,m=f-2;p.append("text").attr("x",g+(b?u/2:0)).attr("y",m).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",b?"middle":"start").text(n.start),b||p.append("text").attr("x",g+u).attr("y",m).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(n.end)}},"drawWord"),O={draw:A},S={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},F=(0,_.eW)(({packet:e}={})=>{const t=(0,h.Rb)(S,e);return`
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
	`},"styles"),R={parser:C,get db(){return new D},renderer:O,styles:F}}}]);})();
