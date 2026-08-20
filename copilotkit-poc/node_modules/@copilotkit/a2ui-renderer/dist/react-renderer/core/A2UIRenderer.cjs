const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');
const require_A2uiSurface = require('../a2ui-react/A2uiSurface.cjs');
require('../a2ui-react/index.cjs');
const require_useA2UI = require('../hooks/useA2UI.cjs');
const require_utils = require('../lib/utils.cjs');
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/react-renderer/core/A2UIRenderer.tsx
/** Default loading fallback - memoized to prevent recreation */
const DefaultLoadingFallback = (0, react.memo)(function DefaultLoadingFallback() {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "a2ui-loading",
		style: {
			padding: "16px",
			opacity: .5
		},
		children: "Loading..."
	});
});
/**
* A2UIRenderer - renders an A2UI surface using the v0.9 renderer.
*
* Uses A2uiSurface from a2ui-react which handles all component
* rendering internally via the catalog system.
*/
const A2UIRenderer = (0, react.memo)(function A2UIRenderer({ surfaceId, className, fallback = null, loadingFallback }) {
	const { getSurface, version } = require_useA2UI.useA2UI();
	const surface = getSurface(surfaceId);
	if (!surface) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: fallback });
	const actualLoadingFallback = loadingFallback ?? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DefaultLoadingFallback, {});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: require_utils.cn("a2ui-surface", className),
		"data-surface-id": surfaceId,
		"data-version": version,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
			fallback: actualLoadingFallback,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_A2uiSurface.A2uiSurface, { surface })
		})
	});
});

//#endregion
exports.default = A2UIRenderer;
//# sourceMappingURL=A2UIRenderer.cjs.map