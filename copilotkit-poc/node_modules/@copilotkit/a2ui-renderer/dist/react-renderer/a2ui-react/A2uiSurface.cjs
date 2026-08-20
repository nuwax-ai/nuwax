const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/react-renderer/a2ui-react/A2uiSurface.tsx
/**
* Copyright 2026 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
const ResolvedChild = (0, react.memo)(({ surface, id, basePath, compImpl, componentModel }) => {
	const ComponentToRender = compImpl.render;
	const context = (0, react.useMemo)(() => new _a2ui_web_core_v0_9.ComponentContext(surface, id, basePath), [
		surface,
		id,
		basePath,
		componentModel
	]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentToRender, {
		context,
		buildChild: (0, react.useCallback)((childId, specificPath) => {
			const path = specificPath || context.dataContext.path;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DeferredChild, {
				surface,
				id: childId,
				basePath: path
			}, `${childId}-${path}`);
		}, [surface, context.dataContext.path])
	});
});
ResolvedChild.displayName = "ResolvedChild";
const DeferredChild = (0, react.memo)(({ surface, id, basePath }) => {
	const store = (0, react.useMemo)(() => {
		let version = 0;
		return {
			subscribe: (cb) => {
				const unsub1 = surface.componentsModel.onCreated.subscribe((comp) => {
					if (comp.id === id) {
						version++;
						cb();
					}
				});
				const unsub2 = surface.componentsModel.onDeleted.subscribe((delId) => {
					if (delId === id) {
						version++;
						cb();
					}
				});
				return () => {
					unsub1.unsubscribe();
					unsub2.unsubscribe();
				};
			},
			getSnapshot: () => {
				const comp = surface.componentsModel.get(id);
				return comp ? `${comp.type}-${version}` : `missing-${version}`;
			}
		};
	}, [surface, id]);
	(0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot);
	const componentModel = surface.componentsModel.get(id);
	if (!componentModel) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			padding: "12px 16px",
			borderRadius: "8px",
			background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
			backgroundSize: "200% 100%",
			animation: "a2ui-shimmer 1.5s ease-in-out infinite",
			minHeight: "2rem"
		},
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: `@keyframes a2ui-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }` })
	});
	const compImpl = surface.catalog.components.get(componentModel.type);
	if (!compImpl) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: { color: "red" },
		children: ["Unknown component: ", componentModel.type]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolvedChild, {
		surface,
		id,
		basePath,
		componentModel,
		compImpl
	});
});
DeferredChild.displayName = "DeferredChild";
const A2uiSurface = ({ surface }) => {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DeferredChild, {
		surface,
		id: "root",
		basePath: "/"
	});
};

//#endregion
exports.A2uiSurface = A2uiSurface;
exports.DeferredChild = DeferredChild;
//# sourceMappingURL=A2uiSurface.cjs.map