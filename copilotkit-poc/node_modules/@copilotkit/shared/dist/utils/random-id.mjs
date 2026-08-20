import { v4, v5, validate } from "uuid";

//#region src/utils/random-id.ts
function randomId() {
	return "ck-" + v4();
}
function randomUUID() {
	return v4();
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
	const boundNamespace = namespace ? v5(namespace, BASE_NAMESPACE) : BASE_NAMESPACE;
	return v5(typeof input === "string" ? input : JSON.stringify(toSerializable(input)), boundNamespace);
}
function isValidUUID(uuid) {
	return validate(uuid);
}

//#endregion
export { dataToUUID, isValidUUID, randomId, randomUUID };
//# sourceMappingURL=random-id.mjs.map