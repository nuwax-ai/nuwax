"use strict";(()=>{(self.webpackChunknuwax_frontend=self.webpackChunknuwax_frontend||[]).push([[4450],{91999:function(P,C,c){c.d(C,{A:function(){return m}});var w=c(27246);function m(f,a){f.accDescr&&a.setAccDescription?.(f.accDescr),f.accTitle&&a.setAccTitle?.(f.accTitle),f.title&&a.setDiagramTitle?.(f.title)}(0,w.eW)(m,"populateCommonDb")},14450:function(P,C,c){c.d(C,{diagram:function(){return K}});var w=c(91999),m=c(11495),f=c(402),a=c(27246),W=c(7853),E={packet:[]},x=structuredClone(E),B=a.vZ.packet,D=(0,a.eW)(()=>{const t=(0,m.Rb)({...B,...(0,a.iE)().packet});return t.showBits&&(t.paddingY+=10),t},"getConfig"),$=(0,a.eW)(()=>x.packet,"getPacket"),y=(0,a.eW)(t=>{t.length>0&&x.packet.push(t)},"pushWord"),T=(0,a.eW)(()=>{(0,a.ZH)(),x=structuredClone(E)},"clear"),v={pushWord:y,getPacket:$,getConfig:D,clear:T,setAccTitle:a.GN,getAccTitle:a.eu,setDiagramTitle:a.g2,getDiagramTitle:a.Kr,getAccDescription:a.Mx,setAccDescription:a.U$},A=1e4,M=(0,a.eW)(t=>{(0,w.A)(t,v);let e=-1,n=[],i=1;const{bitsPerRow:l}=v.getConfig();for(let{start:r,end:o,bits:d,label:_}of t.blocks){if(r!==void 0&&o!==void 0&&o<r)throw new Error(`Packet block ${r} - ${o} is invalid. End must be greater than start.`);if(r??(r=e+1),r!==e+1)throw new Error(`Packet block ${r} - ${o??r} is not contiguous. It should start from ${e+1}.`);if(d===0)throw new Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(o??(o=r+(d??1)-1),d??(d=o-r+1),e=o,a.cM.debug(`Packet block ${r} - ${e} with label ${_}`);n.length<=l+1&&v.getPacket().length<A;){const[p,k]=O({start:r,end:o,bits:d,label:_},i,l);if(n.push(p),p.end+1===i*l&&(v.pushWord(n),n=[],i++),!k)break;({start:r,end:o,bits:d,label:_}=k)}}v.pushWord(n)},"populate"),O=(0,a.eW)((t,e,n)=>{if(t.start===void 0)throw new Error("start should have been set during first phase");if(t.end===void 0)throw new Error("end should have been set during first phase");if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*n)return[t,void 0];const i=e*n-1,l=e*n;return[{start:t.start,end:i,label:t.label,bits:i-t.start},{start:l,end:t.end,label:t.label,bits:t.end-l}]},"getNextFittingBlock"),S={parse:(0,a.eW)(async t=>{const e=await(0,W.Qc)("packet",t);a.cM.debug(e),M(e)},"parse")},F=(0,a.eW)((t,e,n,i)=>{const l=i.db,r=l.getConfig(),{rowHeight:o,paddingY:d,bitWidth:_,bitsPerRow:p}=r,k=l.getPacket(),s=l.getDiagramTitle(),g=o+d,u=g*(k.length+1)-(s?0:o),h=_*p+2,b=(0,f.P)(e);b.attr("viewbox",`0 0 ${h} ${u}`),(0,a.v2)(b,u,h,r.useMaxWidth);for(const[U,j]of k.entries())L(b,j,U,r);b.append("text").text(s).attr("x",h/2).attr("y",u-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),L=(0,a.eW)((t,e,n,{rowHeight:i,paddingX:l,paddingY:r,bitWidth:o,bitsPerRow:d,showBits:_})=>{const p=t.append("g"),k=n*(i+r)+r;for(const s of e){const g=s.start%d*o+1,u=(s.end-s.start+1)*o-l;if(p.append("rect").attr("x",g).attr("y",k).attr("width",u).attr("height",i).attr("class","packetBlock"),p.append("text").attr("x",g+u/2).attr("y",k+i/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!_)continue;const h=s.end===s.start,b=k-2;p.append("text").attr("x",g+(h?u/2:0)).attr("y",b).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",h?"middle":"start").text(s.start),h||p.append("text").attr("x",g+u).attr("y",b).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),z={draw:F},R={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},I=(0,a.eW)(({packet:t}={})=>{const e=(0,m.Rb)(R,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles"),K={parser:S,db:v,renderer:z,styles:I}}}]);})();
