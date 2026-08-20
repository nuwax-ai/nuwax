import "chalk";

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
export { flattenObject };
//# sourceMappingURL=utils.mjs.map