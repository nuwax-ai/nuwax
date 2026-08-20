import React, { memo, useCallback, useMemo, useSyncExternalStore } from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { jsx, jsxs } from "react/jsx-runtime";

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
const ResolvedChild = memo(({ surface, id, basePath, compImpl, componentModel }) => {
	const ComponentToRender = compImpl.render;
	const context = useMemo(() => new ComponentContext(surface, id, basePath), [
		surface,
		id,
		basePath,
		componentModel
	]);
	return /* @__PURE__ */ jsx(ComponentToRender, {
		context,
		buildChild: useCallback((childId, specificPath) => {
			const path = specificPath || context.dataContext.path;
			return /* @__PURE__ */ jsx(DeferredChild, {
				surface,
				id: childId,
				basePath: path
			}, `${childId}-${path}`);
		}, [surface, context.dataContext.path])
	});
});
ResolvedChild.displayName = "ResolvedChild";
const DeferredChild = memo(({ surface, id, basePath }) => {
	const store = useMemo(() => {
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
	useSyncExternalStore(store.subscribe, store.getSnapshot);
	const componentModel = surface.componentsModel.get(id);
	if (!componentModel) return /* @__PURE__ */ jsx("div", {
		style: {
			padding: "12px 16px",
			borderRadius: "8px",
			background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
			backgroundSize: "200% 100%",
			animation: "a2ui-shimmer 1.5s ease-in-out infinite",
			minHeight: "2rem"
		},
		children: /* @__PURE__ */ jsx("style", { children: `@keyframes a2ui-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }` })
	});
	const compImpl = surface.catalog.components.get(componentModel.type);
	if (!compImpl) return /* @__PURE__ */ jsxs("div", {
		style: { color: "red" },
		children: ["Unknown component: ", componentModel.type]
	});
	return /* @__PURE__ */ jsx(ResolvedChild, {
		surface,
		id,
		basePath,
		componentModel,
		compImpl
	});
});
DeferredChild.displayName = "DeferredChild";
const A2uiSurface = ({ surface }) => {
	return /* @__PURE__ */ jsx(DeferredChild, {
		surface,
		id: "root",
		basePath: "/"
	});
};

//#endregion
export { A2uiSurface, DeferredChild };
//# sourceMappingURL=A2uiSurface.mjs.map