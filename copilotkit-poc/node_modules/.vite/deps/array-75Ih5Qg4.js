Array.prototype.slice;
function array_default(x) {
	return typeof x === "object" && "length" in x ? x : Array.from(x);
}
//#endregion
export { array_default as t };

//# sourceMappingURL=array-75Ih5Qg4.js.map