//#region node_modules/d3-scale/src/init.js
function initRange(domain, range) {
	switch (arguments.length) {
		case 0: break;
		case 1:
			this.range(domain);
			break;
		default:
			this.range(range).domain(domain);
			break;
	}
	return this;
}
//#endregion
export { initRange as t };

//# sourceMappingURL=init-D0fVQgiw.js.map