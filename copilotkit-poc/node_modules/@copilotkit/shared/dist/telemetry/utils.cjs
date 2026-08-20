const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
require("chalk");

//#region src/telemetry/utils.ts
function flattenObject(obj, parentKey = "", res = {}) {
	for (let key in obj) {
		const propName = parentKey ? `${parentKey}.${key}` : key;
		if (typeof obj[key] === "object" && obj[key] !== null) flattenObject(obj[key], propName, res);
		else res[propName] = obj[key];
	}
	return res;
}

//#endregion
exports.flattenObject = flattenObject;
//# sourceMappingURL=utils.cjs.map