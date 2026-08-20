Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_runtime = require("../_virtual/_rolldown/runtime.cjs");
const require_headless = require("./headless.cjs");
//#region src/tools/index.ts
var tools_exports = /* @__PURE__ */ require_runtime.__exportAll({ tool: () => require_headless.tool });
//#endregion
exports.tool = require_headless.tool;
Object.defineProperty(exports, "tools_exports", {
	enumerable: true,
	get: function() {
		return tools_exports;
	}
});

//# sourceMappingURL=index.cjs.map