const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
let uuid = require("uuid");

//#region src/utils/random-id.ts
function randomId() {
	return "ck-" + (0, uuid.v4)();
}
function randomUUID() {
	return (0, uuid.v4)();
}
/**
* Recursively converts an object to a serializable form by converting functions to their string representation.
*/
function toSerializable(value) {
	if (typeof value === "function") return value.toString();
	if (Array.isArray(value)) return value.map(toSerializable);
	if (value !== null && typeof value === "object") {
		const result = {};
		for (const key of Object.keys(value)) result[key] = toSerializable(value[key]);
		return result;
	}
	return value;
}
function dataToUUID(input, namespace) {
	const BASE_NAMESPACE = "e4b01160-ff74-4c6e-9b27-d53cd930fe8e";
	const boundNamespace = namespace ? (0, uuid.v5)(namespace, BASE_NAMESPACE) : BASE_NAMESPACE;
	return (0, uuid.v5)(typeof input === "string" ? input : JSON.stringify(toSerializable(input)), boundNamespace);
}
function isValidUUID(uuid$1) {
	return (0, uuid.validate)(uuid$1);
}

//#endregion
exports.dataToUUID = dataToUUID;
exports.isValidUUID = isValidUUID;
exports.randomId = randomId;
exports.randomUUID = randomUUID;
//# sourceMappingURL=random-id.cjs.map