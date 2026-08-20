
//#region src/utils/requests.ts
/**
* Safely read a Response/Request body with sensible defaults:
* - clones the response/request to avoid consuming the original response/request
* - Skips GET/HEAD
* - Tries JSON first regardless of content-type
* - Falls back to text and optionally parses when it "looks" like JSON
*/
async function readBody(r) {
	const method = "method" in r ? r.method.toUpperCase() : void 0;
	if (method === "GET" || method === "HEAD") return;
	if (!("body" in r) || r.body == null) return;
	try {
		return await r.clone().json();
	} catch {
		try {
			const text = await r.clone().text();
			const trimmed = text.trim();
			if (trimmed.length === 0) return text;
			if (trimmed.startsWith("{") || trimmed.startsWith("[")) try {
				return JSON.parse(trimmed);
			} catch {
				return text;
			}
			return text;
		} catch {
			try {
				const stream = r.clone().body ?? null;
				if (!stream) return void 0;
				const reader = stream.getReader();
				const decoder = new TextDecoder();
				let out = "";
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (typeof value === "string") out += value;
					else out += decoder.decode(value, { stream: true });
				}
				out += decoder.decode();
				const trimmed = out.trim();
				if (trimmed.length === 0) return out;
				if (trimmed.startsWith("{") || trimmed.startsWith("[")) try {
					return JSON.parse(trimmed);
				} catch {
					return out;
				}
				return out;
			} catch {
				return;
			}
		}
	}
}

//#endregion
exports.readBody = readBody;
//# sourceMappingURL=requests.cjs.map