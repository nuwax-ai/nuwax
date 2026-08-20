import * as proto from "@ag-ui/proto";
import { AGUI_MEDIA_TYPE } from "@ag-ui/proto";

//#region src/media-type.ts
/**
* negotiator
* Copyright(c) 2012 Isaac Z. Schlueter
* Copyright(c) 2014 Federico Romero
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* Module exports.
* @public
*/
function preferredMediaTypes(accept, provided) {
	const accepts = parseAccept(accept === void 0 ? "*/*" : accept || "");
	if (!provided) return accepts.filter((spec) => spec.q > 0).sort((a, b) => {
		return b.q - a.q || b.i - a.i || 0;
	}).map(getFullType);
	const priorities = provided.map(function getPriority(type, index) {
		return getMediaTypePriority(type, accepts, index);
	});
	return priorities.filter((spec) => spec.q > 0).sort(compareSpecs).map(function getType(priority) {
		return provided[priorities.indexOf(priority)];
	});
}
/**
* Module variables.
* @private
*/
const simpleMediaTypeRegExp = /^\s*([^\s\/;]+)\/([^;\s]+)\s*(?:;(.*))?$/;
/**
* Parse the Accept header.
* @private
*/
function parseAccept(accept) {
	const accepts = splitMediaTypes(accept);
	const result = [];
	for (let i = 0, j = 0; i < accepts.length; i++) {
		const mediaType = parseMediaType(accepts[i].trim(), i);
		if (mediaType) result[j++] = mediaType;
	}
	return result;
}
/**
* Parse a media type from the Accept header.
* @private
*/
function parseMediaType(str, i) {
	const match = simpleMediaTypeRegExp.exec(str);
	if (!match) return null;
	const params = Object.create(null);
	let q = 1;
	const subtype = match[2];
	const type = match[1];
	if (match[3]) {
		const kvps = splitParameters(match[3]).map(splitKeyValuePair);
		for (let j = 0; j < kvps.length; j++) {
			const pair = kvps[j];
			const key = pair[0].toLowerCase();
			const val = pair[1];
			const value = val && val[0] === "\"" && val[val.length - 1] === "\"" ? val.slice(1, -1) : val;
			if (key === "q") {
				q = parseFloat(value);
				break;
			}
			params[key] = value;
		}
	}
	return {
		type,
		subtype,
		params,
		q,
		i
	};
}
/**
* Get the priority of a media type.
* @private
*/
function getMediaTypePriority(type, accepted, index) {
	const priority = {
		o: -1,
		q: 0,
		s: 0
	};
	for (let i = 0; i < accepted.length; i++) {
		const spec = specify(type, accepted[i], index);
		if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
			priority.o = spec.o;
			priority.q = spec.q;
			priority.s = spec.s;
			priority.i = spec.i;
		}
	}
	return priority;
}
/**
* Get the specificity of the media type.
* @private
*/
function specify(type, spec, index) {
	const p = parseMediaType(type, 0);
	let s = 0;
	if (!p) return null;
	if (spec.type.toLowerCase() == p.type.toLowerCase()) s |= 4;
	else if (spec.type != "*") return null;
	if (spec.subtype.toLowerCase() == p.subtype.toLowerCase()) s |= 2;
	else if (spec.subtype != "*") return null;
	const keys = Object.keys(spec.params);
	if (keys.length > 0) if (keys.every(function(k) {
		return spec.params[k] == "*" || (spec.params[k] || "").toLowerCase() == (p.params[k] || "").toLowerCase();
	})) s |= 1;
	else return null;
	return {
		i: index,
		o: spec.i,
		q: spec.q,
		s
	};
}
/**
* Compare two specs.
* @private
*/
function compareSpecs(a, b) {
	return b.q - a.q || b.s - a.s || (a.o || 0) - (b.o || 0) || (a.i || 0) - (b.i || 0) || 0;
}
/**
* Get full type string.
* @private
*/
function getFullType(spec) {
	return spec.type + "/" + spec.subtype;
}
/**
* Count the number of quotes in a string.
* @private
*/
function quoteCount(string) {
	let count = 0;
	let index = 0;
	while ((index = string.indexOf("\"", index)) !== -1) {
		count++;
		index++;
	}
	return count;
}
/**
* Split a key value pair.
* @private
*/
function splitKeyValuePair(str) {
	const index = str.indexOf("=");
	let key;
	let val = "";
	if (index === -1) key = str;
	else {
		key = str.slice(0, index);
		val = str.slice(index + 1);
	}
	return [key, val];
}
/**
* Split an Accept header into media types.
* @private
*/
function splitMediaTypes(accept) {
	const accepts = accept.split(",");
	const result = [accepts[0]];
	for (let i = 1, j = 0; i < accepts.length; i++) if (quoteCount(result[j]) % 2 == 0) result[++j] = accepts[i];
	else result[j] += "," + accepts[i];
	return result;
}
/**
* Split a string of parameters.
* @private
*/
function splitParameters(str) {
	const parameters = str.split(";");
	const result = [parameters[0]];
	for (let i = 1, j = 0; i < parameters.length; i++) if (quoteCount(result[j]) % 2 == 0) result[++j] = parameters[i];
	else result[j] += ";" + parameters[i];
	for (let i = 0; i < result.length; i++) result[i] = result[i].trim();
	return result;
}

//#endregion
//#region src/encoder.ts
var EventEncoder = class {
	constructor(params) {
		this.acceptsProtobuf = params?.accept ? this.isProtobufAccepted(params.accept) : false;
	}
	getContentType() {
		if (this.acceptsProtobuf) return proto.AGUI_MEDIA_TYPE;
		else return "text/event-stream";
	}
	encode(event) {
		return this.encodeSSE(event);
	}
	encodeSSE(event) {
		return `data: ${JSON.stringify(event)}\n\n`;
	}
	encodeBinary(event) {
		if (this.acceptsProtobuf) return this.encodeProtobuf(event);
		else {
			const sseString = this.encodeSSE(event);
			return new TextEncoder().encode(sseString);
		}
	}
	encodeProtobuf(event) {
		const messageBytes = proto.encode(event);
		const length = messageBytes.length;
		const buffer = new ArrayBuffer(4 + length);
		new DataView(buffer).setUint32(0, length, false);
		const result = new Uint8Array(buffer);
		result.set(messageBytes, 4);
		return result;
	}
	isProtobufAccepted(acceptHeader) {
		return preferredMediaTypes(acceptHeader, [proto.AGUI_MEDIA_TYPE]).includes(proto.AGUI_MEDIA_TYPE);
	}
};

//#endregion
export { AGUI_MEDIA_TYPE, EventEncoder };
//# sourceMappingURL=index.mjs.map