import { A2uiSurface } from "../a2ui-react/A2uiSurface.mjs";
import "../a2ui-react/index.mjs";
import { useA2UI } from "../hooks/useA2UI.mjs";
import { cn } from "../lib/utils.mjs";
import { Suspense, memo } from "react";
import { Fragment, jsx } from "react/jsx-runtime";

//#region src/react-renderer/core/A2UIRenderer.tsx
/** Default loading fallback - memoized to prevent recreation */
const DefaultLoadingFallback = memo(function DefaultLoadingFallback() {
	return /* @__PURE__ */ jsx("div", {
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
const A2UIRenderer = memo(function A2UIRenderer({ surfaceId, className, fallback = null, loadingFallback }) {
	const { getSurface, version } = useA2UI();
	const surface = getSurface(surfaceId);
	if (!surface) return /* @__PURE__ */ jsx(Fragment, { children: fallback });
	const actualLoadingFallback = loadingFallback ?? /* @__PURE__ */ jsx(DefaultLoadingFallback, {});
	return /* @__PURE__ */ jsx("div", {
		className: cn("a2ui-surface", className),
		"data-surface-id": surfaceId,
		"data-version": version,
		children: /* @__PURE__ */ jsx(Suspense, {
			fallback: actualLoadingFallback,
			children: /* @__PURE__ */ jsx(A2uiSurface, { surface })
		})
	});
});

//#endregion
export { A2UIRenderer as default };
//# sourceMappingURL=A2UIRenderer.mjs.map