"use strict";(()=>{(self.webpackChunkagent_platform_front=self.webpackChunkagent_platform_front||[]).push([[4450],{91999:function(x,C,c){c.d(C,{A:function(){return m}});var E=c(27246);function m(k,a){k.accDescr&&a.setAccDescription?.(k.accDescr),k.accTitle&&a.setAccTitle?.(k.accTitle),k.title&&a.setDiagramTitle?.(k.title)}(0,E.eW)(m,"populateCommonDb")},14450:function(x,C,c){c.d(C,{diagram:function(){return K}});var E=c(91999),m=c(11495),k=c(402),a=c(27246),W=c(7853),w={packet:[]},P=structuredClone(w),B=a.vZ.packet,D=(0,a.eW)(()=>{const t=(0,m.Rb)({...B,...(0,a.iE)().packet});return t.showBits&&(t.paddingY+=10),t},"getConfig"),$=(0,a.eW)(()=>P.packet,"getPacket"),y=(0,a.eW)(t=>{t.length>0&&P.packet.push(t)},"pushWord"),T=(0,a.eW)(()=>{(0,a.ZH)(),P=structuredClone(w)},"clear"),v={pushWord:y,getPacket:$,getConfig:D,clear:T,setAccTitle:a.GN,getAccTitle:a.eu,setDiagramTitle:a.g2,getDiagramTitle:a.Kr,getAccDescription:a.Mx,setAccDescription:a.U$},A=1e4,M=(0,a.eW)(t=>{(0,E.A)(t,v);let e=-1,n=[],i=1;const{bitsPerRow:l}=v.getConfig();for(let{start:r,end:o,bits:d,label:g}of t.blocks){if(r!==void 0&&o!==void 0&&o<r)throw new Error(`Packet block ${r} - ${o} is invalid. End must be greater than start.`);if(r??(r=e+1),r!==e+1)throw new Error(`Packet block ${r} - ${o??r} is not contiguous. It should start from ${e+1}.`);if(d===0)throw new Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(o??(o=r+(d??1)-1),d??(d=o-r+1),e=o,a.cM.debug(`Packet block ${r} - ${e} with label ${g}`);n.length<=l+1&&v.getPacket().length<A;){const[p,f]=O({start:r,end:o,bits:d,label:g},i,l);if(n.push(p),p.end+1===i*l&&(v.pushWord(n),n=[],i++),!f)break;({start:r,end:o,bits:d,label:g}=f)}}v.pushWord(n)},"populate"),O=(0,a.eW)((t,e,n)=>{if(t.start===void 0)throw new Error("start should have been set during first phase");if(t.end===void 0)throw new Error("end should have been set during first phase");if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*n)return[t,void 0];const i=e*n-1,l=e*n;return[{start:t.start,end:i,label:t.label,bits:i-t.start},{start:l,end:t.end,label:t.label,bits:t.end-l}]},"getNextFittingBlock"),S={parse:(0,a.eW)(async t=>{const e=await(0,W.Qc)("packet",t);a.cM.debug(e),M(e)},"parse")},F=(0,a.eW)((t,e,n,i)=>{const l=i.db,r=l.getConfig(),{rowHeight:o,paddingY:d,bitWidth:g,bitsPerRow:p}=r,f=l.getPacket(),s=l.getDiagramTitle(),u=o+d,_=u*(f.length+1)-(s?0:o),h=g*p+2,b=(0,k.P)(e);b.attr("viewbox",`0 0 ${h} ${_}`),(0,a.v2)(b,_,h,r.useMaxWidth);for(const[U,j]of f.entries())L(b,j,U,r);b.append("text").text(s).attr("x",h/2).attr("y",_-u/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),L=(0,a.eW)((t,e,n,{rowHeight:i,paddingX:l,paddingY:r,bitWidth:o,bitsPerRow:d,showBits:g})=>{const p=t.append("g"),f=n*(i+r)+r;for(const s of e){const u=s.start%d*o+1,_=(s.end-s.start+1)*o-l;if(p.append("rect").attr("x",u).attr("y",f).attr("width",_).attr("height",i).attr("class","packetBlock"),p.append("text").attr("x",u+_/2).attr("y",f+i/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!g)continue;const h=s.end===s.start,b=f-2;p.append("text").attr("x",u+(h?_/2:0)).attr("y",b).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",h?"middle":"start").text(s.start),h||p.append("text").attr("x",u+_).attr("y",b).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),z={draw:F},R={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},I=(0,a.eW)(({packet:t}={})=>{const e=(0,m.Rb)(R,t);return`
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
