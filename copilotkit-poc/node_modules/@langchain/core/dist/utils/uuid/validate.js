import regex_default from "./regex.js";
//#region src/utils/uuid/validate.ts
function validate(uuid) {
	return typeof uuid === "string" && regex_default.test(uuid);
}
//#endregion
export { validate as default };

//# sourceMappingURL=validate.js.map