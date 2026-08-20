import sha1 from "./sha1.js";
import v35, { DNS, URL } from "./v35.js";
//#region src/utils/uuid/v5.ts
function v5(value, namespace, buf, offset) {
	return v35(80, sha1, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL;
//#endregion
export { v5 as default };

//# sourceMappingURL=v5.js.map