
//#region src/utils/conditions.ts
function executeConditions({ conditions, value }) {
	if (!conditions?.length) return true;
	return conditions.every((condition) => executeCondition(condition, value));
}
function executeCondition(condition, value) {
	const targetValue = condition.path ? getValueFromPath(value, condition.path) : value;
	switch (condition.rule) {
		case "AND": return condition.conditions.every((c) => executeCondition(c, value));
		case "OR": return condition.conditions.some((c) => executeCondition(c, value));
		case "NOT": return !condition.conditions.every((c) => executeCondition(c, value));
		case "EQUALS": return targetValue === condition.value;
		case "NOT_EQUALS": return targetValue !== condition.value;
		case "GREATER_THAN": return targetValue > condition.value;
		case "LESS_THAN": return targetValue < condition.value;
		case "CONTAINS": return Array.isArray(targetValue) && targetValue.includes(condition.value);
		case "NOT_CONTAINS": return Array.isArray(targetValue) && !targetValue.includes(condition.value);
		case "MATCHES": return new RegExp(condition.value).test(String(targetValue));
		case "STARTS_WITH": return String(targetValue).startsWith(condition.value);
		case "ENDS_WITH": return String(targetValue).endsWith(condition.value);
		case "EXISTS": return targetValue !== void 0 && targetValue !== null;
		case "NOT_EXISTS": return targetValue === void 0 || targetValue === null;
	}
}
function getValueFromPath(obj, path) {
	return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

//#endregion
exports.executeConditions = executeConditions;
//# sourceMappingURL=conditions.cjs.map