import parse from "./parse.js";
import { unsafeStringify } from "./stringify.js";
//#region src/utils/uuid/v1ToV6.ts
function v1ToV6(uuid) {
	const v6Bytes = _v1ToV6(typeof uuid === "string" ? parse(uuid) : uuid);
	return typeof uuid === "string" ? unsafeStringify(v6Bytes) : v6Bytes;
}
function _v1ToV6(v1Bytes) {
	return Uint8Array.of((v1Bytes[6] & 15) << 4 | v1Bytes[7] >> 4 & 15, (v1Bytes[7] & 15) << 4 | (v1Bytes[4] & 240) >> 4, (v1Bytes[4] & 15) << 4 | (v1Bytes[5] & 240) >> 4, (v1Bytes[5] & 15) << 4 | (v1Bytes[0] & 240) >> 4, (v1Bytes[0] & 15) << 4 | (v1Bytes[1] & 240) >> 4, (v1Bytes[1] & 15) << 4 | (v1Bytes[2] & 240) >> 4, 96 | v1Bytes[2] & 15, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}
//#endregion
export { v1ToV6 as default };

//# sourceMappingURL=v1ToV6.js.map