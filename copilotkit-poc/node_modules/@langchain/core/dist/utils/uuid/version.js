import validate from "./validate.js";
//#region src/utils/uuid/version.ts
function version(uuid) {
	if (!validate(uuid)) throw TypeError("Invalid UUID");
	return parseInt(uuid.slice(14, 15), 16);
}
//#endregion
export { version as default };

//# sourceMappingURL=version.js.map