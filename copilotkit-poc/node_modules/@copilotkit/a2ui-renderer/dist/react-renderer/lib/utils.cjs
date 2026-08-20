const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');
let clsx = require("clsx");

//#region src/react-renderer/lib/utils.ts
/**
* Utility function to merge class names.
*/
function cn(...inputs) {
	return (0, clsx.clsx)(inputs);
}

//#endregion
exports.cn = cn;
//# sourceMappingURL=utils.cjs.map