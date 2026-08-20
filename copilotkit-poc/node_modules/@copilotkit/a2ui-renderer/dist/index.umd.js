(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ?  factory(exports, require('react'), require('@a2ui/web_core/v0_9'), require('react/jsx-runtime'), require('@a2ui/web_core/v0_9/basic_catalog'), require('zod'), require('clsx'), require('zod-to-json-schema')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', '@a2ui/web_core/v0_9', 'react/jsx-runtime', '@a2ui/web_core/v0_9/basic_catalog', 'zod', 'clsx', 'zod-to-json-schema'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.CopilotKitA2UIRenderer = {}), global.React,global._a2ui_web_core_v0_9,global.React,global._a2ui_web_core_v0_9_basic_catalog,global.Zod,global.clsx,global.zod_to_json_schema));
})(this, function(exports, react, _a2ui_web_core_v0_9, react_jsx_runtime, _a2ui_web_core_v0_9_basic_catalog, zod, clsx, zod_to_json_schema) {
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) {
					__defProp(to, key, {
						get: ((k) => from[k]).bind(null, key),
						enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
					});
				}
			}
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));

//#endregion
react = __toESM(react);

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
//#region src/react-renderer/a2ui-react/adapter.tsx
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
	/**
	* Creates a React component implementation using the deep generic binder.
	*/
	function createReactComponent(api, RenderComponent) {
		const MemoizedRender = (0, react.memo)(RenderComponent, (prev, next) => {
			if (prev.props !== next.props) return false;
			if (prev.context.componentModel.id !== next.context.componentModel.id) return false;
			if (prev.context.dataContext.path !== next.context.dataContext.path) return false;
			return true;
		});
		const ReactWrapper = ({ context, buildChild }) => {
			const bindingRef = (0, react.useRef)(null);
			if (!bindingRef.current) bindingRef.current = new _a2ui_web_core_v0_9.GenericBinder(context, api.schema);
			else if (bindingRef.current.context !== context) {
				bindingRef.current.dispose();
				bindingRef.current = new _a2ui_web_core_v0_9.GenericBinder(context, api.schema);
			}
			const binding = bindingRef.current;
			const props = (0, react.useSyncExternalStore)((0, react.useCallback)((callback) => {
				const sub = binding.subscribe(callback);
				return () => sub.unsubscribe();
			}, [binding]), (0, react.useCallback)(() => binding.snapshot, [binding]));
			(0, react.useEffect)(() => {
				return () => binding.dispose();
			}, [binding]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoizedRender, {
				props: props || {},
				buildChild,
				context
			});
		};
		return {
			name: api.name,
			schema: api.schema,
			render: ReactWrapper
		};
	}

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/utils.ts
/** Standard leaf margin from the implementation guide. */
	const LEAF_MARGIN = "8px";
	/** Standard internal padding for visually bounded containers. */
	const CONTAINER_PADDING = "16px";
	/** Standard border for cards and inputs. */
	const STANDARD_BORDER = "1px solid #ccc";
	/** Standard border radius. */
	const STANDARD_RADIUS = "8px";
	const mapJustify$2 = (j) => {
		switch (j) {
			case "center": return "center";
			case "end": return "flex-end";
			case "spaceAround": return "space-around";
			case "spaceBetween": return "space-between";
			case "spaceEvenly": return "space-evenly";
			case "start": return "flex-start";
			case "stretch": return "stretch";
			default: return "flex-start";
		}
	};
	const mapAlign$2 = (a) => {
		switch (a) {
			case "start": return "flex-start";
			case "center": return "center";
			case "end": return "flex-end";
			case "stretch": return "stretch";
			default: return "stretch";
		}
	};
	const getBaseLeafStyle = () => ({
		margin: LEAF_MARGIN,
		boxSizing: "border-box"
	});
	const getBaseContainerStyle = () => ({
		margin: LEAF_MARGIN,
		padding: CONTAINER_PADDING,
		border: STANDARD_BORDER,
		borderRadius: STANDARD_RADIUS,
		boxSizing: "border-box"
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Text.tsx
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
	const Text$1 = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TextApi, ({ props }) => {
		var _props$text;
		const text = (_props$text = props.text) !== null && _props$text !== void 0 ? _props$text : "";
		const style = {
			...getBaseLeafStyle(),
			display: "inline-block"
		};
		switch (props.variant) {
			case "h1": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
				style,
				children: text
			});
			case "h2": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
				style,
				children: text
			});
			case "h3": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
				style,
				children: text
			});
			case "h4": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
				style,
				children: text
			});
			case "h5": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", {
				style,
				children: text
			});
			case "caption": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
				style: {
					...style,
					color: "#666",
					textAlign: "left"
				},
				children: text
			});
			default: return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style,
				children: text
			});
		}
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Image.tsx
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
	const Image = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ImageApi, ({ props }) => {
		const mapFit = (fit) => {
			if (fit === "scaleDown") return "scale-down";
			return fit || "fill";
		};
		const style = {
			...getBaseLeafStyle(),
			objectFit: mapFit(props.fit),
			width: "100%",
			height: "auto",
			display: "block"
		};
		if (props.variant === "icon") {
			style.width = "24px";
			style.height = "24px";
		} else if (props.variant === "avatar") {
			style.width = "40px";
			style.height = "40px";
			style.borderRadius = "50%";
		} else if (props.variant === "smallFeature") style.maxWidth = "100px";
		else if (props.variant === "largeFeature") style.maxHeight = "400px";
		else if (props.variant === "header") {
			style.height = "200px";
			style.objectFit = "cover";
		}
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src: props.url,
			alt: props.description || "",
			style
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Icon.tsx
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
	const Icon = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.IconApi, ({ props }) => {
		var _props$name;
		const iconName = typeof props.name === "string" ? props.name : (_props$name = props.name) === null || _props$name === void 0 ? void 0 : _props$name.path;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			className: "material-symbols-outlined",
			style: {
				...getBaseLeafStyle(),
				fontSize: "24px",
				width: "24px",
				height: "24px",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center"
			},
			children: iconName
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Video.tsx
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
	const Video = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.VideoApi, ({ props }) => {
		const style = {
			...getBaseLeafStyle(),
			width: "100%",
			aspectRatio: "16/9"
		};
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
			src: props.url,
			controls: true,
			style
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/AudioPlayer.tsx
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
	const AudioPlayer = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.AudioPlayerApi, ({ props }) => {
		const style = {
			...getBaseLeafStyle(),
			width: "100%"
		};
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				width: "100%"
			},
			children: [props.description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					fontSize: "12px",
					color: "#666"
				},
				children: props.description
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
				src: props.url,
				controls: true,
				style
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/ChildList.tsx
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
	const ChildList$1 = ({ childList, buildChild }) => {
		if (Array.isArray(childList)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: childList.map((item, i) => {
			if (item && typeof item === "object" && "id" in item) {
				const node = item;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(node.id, node.basePath) }, `${node.id}-${i}`);
			}
			if (typeof item === "string") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(item) }, `${item}-${i}`);
			return null;
		}) });
		return null;
	};

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Row.tsx
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
	const Row$1 = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.RowApi, ({ props, buildChild, context }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				flexDirection: "row",
				justifyContent: mapJustify$2(props.justify),
				alignItems: mapAlign$2(props.align),
				width: "100%",
				margin: 0,
				padding: 0
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChildList$1, {
				childList: props.children,
				buildChild,
				context
			})
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Column.tsx
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
	const Column$1 = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ColumnApi, ({ props, buildChild, context }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				justifyContent: mapJustify$2(props.justify),
				alignItems: mapAlign$2(props.align),
				width: "100%",
				margin: 0,
				padding: 0
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChildList$1, {
				childList: props.children,
				buildChild,
				context
			})
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/List.tsx
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
	const List = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ListApi, ({ props, buildChild, context }) => {
		const isHorizontal = props.direction === "horizontal";
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				flexDirection: isHorizontal ? "row" : "column",
				alignItems: mapAlign$2(props.align),
				overflowX: isHorizontal ? "auto" : "hidden",
				overflowY: isHorizontal ? "hidden" : "auto",
				width: "100%",
				margin: 0,
				padding: 0
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChildList$1, {
				childList: props.children,
				buildChild,
				context
			})
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Card.tsx
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
	const Card = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.CardApi, ({ props, buildChild }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				...getBaseContainerStyle(),
				backgroundColor: "#fff",
				boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				width: "100%"
			},
			children: props.child ? buildChild(props.child) : null
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Tabs.tsx
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
	const Tabs = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TabsApi, ({ props, buildChild }) => {
		const [selectedIndex, setSelectedIndex] = (0, react.useState)(0);
		const tabs = props.tabs || [];
		const activeTab = tabs[selectedIndex];
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				width: "100%",
				margin: LEAF_MARGIN
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					borderBottom: "1px solid #ccc",
					marginBottom: "8px"
				},
				children: tabs.map((tab, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					onClick: () => setSelectedIndex(i),
					style: {
						padding: "8px 16px",
						border: "none",
						background: "none",
						borderBottom: selectedIndex === i ? "2px solid var(--a2ui-primary-color, #007bff)" : "none",
						fontWeight: selectedIndex === i ? "bold" : "normal",
						cursor: "pointer",
						color: selectedIndex === i ? "var(--a2ui-primary-color, #007bff)" : "inherit"
					},
					children: tab.title
				}, i))
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: { flex: 1 },
				children: activeTab ? buildChild(activeTab.child) : null
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Divider.tsx
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
	const Divider = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.DividerApi, ({ props }) => {
		const isVertical = props.axis === "vertical";
		const style = {
			margin: LEAF_MARGIN,
			border: "none",
			backgroundColor: "#ccc"
		};
		if (isVertical) {
			style.width = "1px";
			style.height = "100%";
		} else {
			style.width = "100%";
			style.height = "1px";
		}
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style });
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Modal.tsx
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
	const Modal = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ModalApi, ({ props, buildChild }) => {
		const [isOpen, setIsOpen] = (0, react.useState)(false);
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			onClick: () => setIsOpen(true),
			style: { display: "inline-block" },
			children: props.trigger ? buildChild(props.trigger) : null
		}), isOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1e3
			},
			onClick: () => setIsOpen(false),
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					backgroundColor: "#fff",
					padding: "24px",
					borderRadius: "8px",
					maxWidth: "90%",
					maxHeight: "90%",
					overflow: "auto",
					display: "flex",
					flexDirection: "column"
				},
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						justifyContent: "flex-end"
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						onClick: () => setIsOpen(false),
						style: {
							border: "none",
							background: "none",
							fontSize: "20px",
							cursor: "pointer",
							padding: "4px"
						},
						children: "×"
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: { flex: 1 },
					children: props.content ? buildChild(props.content) : null
				})]
			})
		})] });
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Button.tsx
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
	const Button$1 = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ButtonApi, ({ props, buildChild }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			style: {
				margin: LEAF_MARGIN,
				padding: "8px 16px",
				cursor: "pointer",
				border: props.variant === "borderless" ? "none" : "1px solid #ccc",
				backgroundColor: props.variant === "primary" ? "var(--a2ui-primary-color, #007bff)" : props.variant === "borderless" ? "transparent" : "#fff",
				color: props.variant === "primary" ? "#fff" : "inherit",
				borderRadius: "4px",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				boxSizing: "border-box"
			},
			onClick: props.action,
			disabled: props.isValid === false,
			children: props.child ? buildChild(props.child) : null
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/TextField.tsx
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
	const TextField$1 = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TextFieldApi, ({ props }) => {
		const onChange = (e) => {
			props.setValue(e.target.value);
		};
		const isLong = props.variant === "longText";
		const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";
		const style = {
			padding: "8px",
			width: "100%",
			border: STANDARD_BORDER,
			borderRadius: STANDARD_RADIUS,
			boxSizing: "border-box"
		};
		const uniqueId = react.default.useId();
		const hasError = props.validationErrors && props.validationErrors.length > 0;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				width: "100%",
				margin: LEAF_MARGIN
			},
			children: [
				props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					htmlFor: uniqueId,
					style: {
						fontSize: "14px",
						fontWeight: "bold"
					},
					children: props.label
				}),
				isLong ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					id: uniqueId,
					style: {
						...style,
						border: hasError ? "1px solid red" : STANDARD_BORDER
					},
					value: props.value || "",
					onChange
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					id: uniqueId,
					type,
					style: {
						...style,
						border: hasError ? "1px solid red" : STANDARD_BORDER
					},
					value: props.value || "",
					onChange
				}),
				hasError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: {
						fontSize: "12px",
						color: "red"
					},
					children: props.validationErrors[0]
				})
			]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/CheckBox.tsx
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
	const CheckBox = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.CheckBoxApi, ({ props }) => {
		var _props$validationErro;
		const onChange = (e) => {
			props.setValue(e.target.checked);
		};
		const uniqueId = react.default.useId();
		const hasError = props.validationErrors && props.validationErrors.length > 0;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				margin: LEAF_MARGIN
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: "8px"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					id: uniqueId,
					type: "checkbox",
					checked: !!props.value,
					onChange,
					style: {
						cursor: "pointer",
						outline: hasError ? "1px solid red" : "none"
					}
				}), props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					htmlFor: uniqueId,
					style: {
						cursor: "pointer",
						color: hasError ? "red" : "inherit"
					},
					children: props.label
				})]
			}), hasError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					fontSize: "12px",
					color: "red",
					marginTop: "4px"
				},
				children: (_props$validationErro = props.validationErrors) === null || _props$validationErro === void 0 ? void 0 : _props$validationErro[0]
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/ChoicePicker.tsx
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
	const ChoicePicker = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ChoicePickerApi, ({ props, context }) => {
		const [filter, setFilter] = (0, react.useState)("");
		const values = Array.isArray(props.value) ? props.value : [];
		const isMutuallyExclusive = props.variant === "mutuallyExclusive";
		const onToggle = (val) => {
			if (isMutuallyExclusive) props.setValue([val]);
			else {
				const newValues = values.includes(val) ? values.filter((v) => v !== val) : [...values, val];
				props.setValue(newValues);
			}
		};
		const options = (props.options || []).filter((opt) => !props.filterable || filter === "" || String(opt.label).toLowerCase().includes(filter.toLowerCase()));
		const containerStyle = {
			display: "flex",
			flexDirection: "column",
			gap: "8px",
			margin: LEAF_MARGIN,
			width: "100%"
		};
		const listStyle = {
			display: "flex",
			flexDirection: props.displayStyle === "chips" ? "row" : "column",
			flexWrap: props.displayStyle === "chips" ? "wrap" : "nowrap",
			gap: "8px"
		};
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: containerStyle,
			children: [
				props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
					style: { fontSize: "14px" },
					children: props.label
				}),
				props.filterable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Filter options...",
					value: filter,
					onChange: (e) => setFilter(e.target.value),
					style: {
						padding: "4px 8px",
						border: STANDARD_BORDER,
						borderRadius: STANDARD_RADIUS
					}
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: listStyle,
					children: options.map((opt, i) => {
						const isSelected = values.includes(opt.value);
						if (props.displayStyle === "chips") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							onClick: () => onToggle(opt.value),
							style: {
								padding: "4px 12px",
								borderRadius: "16px",
								border: isSelected ? "1px solid var(--a2ui-primary-color, #007bff)" : STANDARD_BORDER,
								backgroundColor: isSelected ? "var(--a2ui-primary-color, #007bff)" : "#fff",
								color: isSelected ? "#fff" : "inherit",
								cursor: "pointer",
								fontSize: "12px"
							},
							children: opt.label
						}, i);
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "8px",
								cursor: "pointer"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: isMutuallyExclusive ? "radio" : "checkbox",
								checked: isSelected,
								onChange: () => onToggle(opt.value),
								name: isMutuallyExclusive ? `choice-${context.componentModel.id}` : void 0
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { fontSize: "14px" },
								children: opt.label
							})]
						}, i);
					})
				})
			]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/Slider.tsx
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
	const Slider = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.SliderApi, ({ props }) => {
		var _props$min, _props$value;
		const onChange = (e) => {
			props.setValue(Number(e.target.value));
		};
		const uniqueId = react.default.useId();
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				margin: LEAF_MARGIN,
				width: "100%"
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between"
				},
				children: [props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					htmlFor: uniqueId,
					style: {
						fontSize: "14px",
						fontWeight: "bold"
					},
					children: props.label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: {
						fontSize: "12px",
						color: "#666"
					},
					children: props.value
				})]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id: uniqueId,
				type: "range",
				min: (_props$min = props.min) !== null && _props$min !== void 0 ? _props$min : 0,
				max: props.max,
				value: (_props$value = props.value) !== null && _props$value !== void 0 ? _props$value : 0,
				onChange,
				style: {
					width: "100%",
					cursor: "pointer"
				}
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/components/DateTimeInput.tsx
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
	const DateTimeInput = createReactComponent(_a2ui_web_core_v0_9_basic_catalog.DateTimeInputApi, ({ props }) => {
		const onChange = (e) => {
			props.setValue(e.target.value);
		};
		const uniqueId = react.default.useId();
		let type = "datetime-local";
		if (props.enableDate && !props.enableTime) type = "date";
		if (!props.enableDate && props.enableTime) type = "time";
		const style = {
			padding: "8px",
			width: "100%",
			border: STANDARD_BORDER,
			borderRadius: STANDARD_RADIUS,
			boxSizing: "border-box"
		};
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				width: "100%",
				margin: LEAF_MARGIN
			},
			children: [props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
				htmlFor: uniqueId,
				style: {
					fontSize: "14px",
					fontWeight: "bold"
				},
				children: props.label
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id: uniqueId,
				type,
				style,
				value: props.value || "",
				onChange,
				min: typeof props.min === "string" ? props.min : void 0,
				max: typeof props.max === "string" ? props.max : void 0
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/basic/index.ts
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
	const basicComponents = [
		Text$1,
		Image,
		Icon,
		Video,
		AudioPlayer,
		Row$1,
		Column$1,
		List,
		Card,
		Tabs,
		Divider,
		Modal,
		Button$1,
		TextField$1,
		CheckBox,
		ChoicePicker,
		Slider,
		DateTimeInput
	];
	const basicCatalog = new _a2ui_web_core_v0_9.Catalog("https://a2ui.org/specification/v0_9/basic_catalog.json", basicComponents, _a2ui_web_core_v0_9_basic_catalog.BASIC_FUNCTIONS);

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/Text.tsx
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
	const TextSchema = zod.z.object({
		text: _a2ui_web_core_v0_9.CommonSchemas.DynamicString,
		variant: zod.z.enum([
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"caption",
			"body"
		]).optional()
	});
	const TextApiDef = {
		name: "Text",
		schema: TextSchema
	};
	const Text = createReactComponent(TextApiDef, ({ props }) => {
		var _props$text;
		const text = (_props$text = props.text) !== null && _props$text !== void 0 ? _props$text : "";
		switch (props.variant) {
			case "h1": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: text });
			case "h2": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: text });
			case "h3": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: text });
			case "h4": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: text });
			case "h5": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: text });
			case "caption": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: text });
			default: return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: text });
		}
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/Button.tsx
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
	const ButtonSchema = zod.z.object({
		child: _a2ui_web_core_v0_9.CommonSchemas.ComponentId,
		action: _a2ui_web_core_v0_9.CommonSchemas.Action,
		variant: zod.z.enum(["primary", "borderless"]).optional()
	});
	const ButtonApiDef = {
		name: "Button",
		schema: ButtonSchema
	};
	const Button = createReactComponent(ButtonApiDef, ({ props, buildChild }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			style: {
				padding: "8px 16px",
				cursor: "pointer",
				border: props.variant === "borderless" ? "none" : "1px solid #ccc",
				backgroundColor: props.variant === "primary" ? "#007bff" : "transparent",
				color: props.variant === "primary" ? "#fff" : "inherit",
				borderRadius: "4px"
			},
			onClick: props.action,
			children: props.child ? buildChild(props.child) : null
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/ChildList.tsx
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
	const ChildList = ({ childList, buildChild }) => {
		if (Array.isArray(childList)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: childList.map((item, i) => {
			if (item && typeof item === "object" && "id" in item) {
				const node = item;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(node.id, node.basePath) }, `${node.id}-${i}`);
			}
			if (typeof item === "string") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.default.Fragment, { children: buildChild(item) }, `${item}-${i}`);
			return null;
		}) });
		return null;
	};

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/Row.tsx
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
	const RowSchema = zod.z.object({
		children: _a2ui_web_core_v0_9.CommonSchemas.ChildList,
		justify: zod.z.enum([
			"center",
			"end",
			"spaceAround",
			"spaceBetween",
			"spaceEvenly",
			"start",
			"stretch"
		]).optional(),
		align: zod.z.enum([
			"start",
			"center",
			"end",
			"stretch"
		]).optional()
	});
	const mapJustify$1 = (j) => {
		switch (j) {
			case "center": return "center";
			case "end": return "flex-end";
			case "spaceAround": return "space-around";
			case "spaceBetween": return "space-between";
			case "spaceEvenly": return "space-evenly";
			case "start": return "flex-start";
			case "stretch": return "stretch";
			default: return "flex-start";
		}
	};
	const mapAlign$1 = (a) => {
		switch (a) {
			case "start": return "flex-start";
			case "center": return "center";
			case "end": return "flex-end";
			case "stretch": return "stretch";
			default: return "stretch";
		}
	};
	const RowApiDef = {
		name: "Row",
		schema: RowSchema
	};
	const Row = createReactComponent(RowApiDef, ({ props, buildChild }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				flexDirection: "row",
				justifyContent: mapJustify$1(props.justify),
				alignItems: mapAlign$1(props.align)
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChildList, {
				childList: props.children,
				buildChild
			})
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/Column.tsx
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
	const ColumnSchema = zod.z.object({
		children: _a2ui_web_core_v0_9.CommonSchemas.ChildList,
		justify: zod.z.enum([
			"start",
			"center",
			"end",
			"spaceBetween",
			"spaceAround",
			"spaceEvenly",
			"stretch"
		]).optional(),
		align: zod.z.enum([
			"center",
			"end",
			"start",
			"stretch"
		]).optional()
	});
	const mapJustify = (j) => {
		switch (j) {
			case "center": return "center";
			case "end": return "flex-end";
			case "spaceAround": return "space-around";
			case "spaceBetween": return "space-between";
			case "spaceEvenly": return "space-evenly";
			case "start": return "flex-start";
			case "stretch": return "stretch";
			default: return "flex-start";
		}
	};
	const mapAlign = (a) => {
		switch (a) {
			case "start": return "flex-start";
			case "center": return "center";
			case "end": return "flex-end";
			case "stretch": return "stretch";
			default: return "stretch";
		}
	};
	const ColumnApiDef = {
		name: "Column",
		schema: ColumnSchema
	};
	const Column = createReactComponent(ColumnApiDef, ({ props, buildChild }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				justifyContent: mapJustify(props.justify),
				alignItems: mapAlign(props.align),
				gap: "8px"
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChildList, {
				childList: props.children,
				buildChild
			})
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/components/TextField.tsx
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
	const TextFieldSchema = zod.z.object({
		label: _a2ui_web_core_v0_9.CommonSchemas.DynamicString,
		value: _a2ui_web_core_v0_9.CommonSchemas.DynamicString,
		variant: zod.z.enum([
			"longText",
			"number",
			"shortText",
			"obscured"
		]).optional(),
		validationRegexp: zod.z.string().optional()
	});
	const TextFieldApiDef = {
		name: "TextField",
		schema: TextFieldSchema
	};
	const TextField = createReactComponent(TextFieldApiDef, ({ props, context }) => {
		const onChange = (e) => {
			if (props.setValue) props.setValue(e.target.value);
		};
		const isLong = props.variant === "longText";
		const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";
		const style = {
			padding: "8px",
			width: "100%",
			border: "1px solid #ccc",
			borderRadius: "4px",
			boxSizing: "border-box"
		};
		const id = `textfield-${context.componentModel.id}`;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: "4px",
				width: "100%"
			},
			children: [props.label && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
				htmlFor: id,
				style: {
					fontSize: "14px",
					fontWeight: "bold"
				},
				children: props.label
			}), isLong ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
				id,
				style,
				value: props.value || "",
				onChange
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id,
				type,
				style,
				value: props.value || "",
				onChange
			})]
		});
	});

//#endregion
//#region src/react-renderer/a2ui-react/catalog/minimal/index.ts
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
	const minimalComponents = [
		Text,
		Button,
		Row,
		Column,
		TextField
	];
	const minimalCatalog = new _a2ui_web_core_v0_9.Catalog("https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json", minimalComponents, [(0, _a2ui_web_core_v0_9.createFunctionImplementation)({
		name: "capitalize",
		returnType: "string",
		schema: zod.z.object({ value: zod.z.unknown() })
	}, (args) => {
		const val = args.value;
		if (typeof val === "string") return val.toUpperCase();
		return val;
	})]);

//#endregion
//#region src/react-renderer/theme/ThemeContext.tsx
/** React context for the A2UI theme. */
	const ThemeContext = (0, react.createContext)(void 0);
	function ThemeProvider({ theme, children }) {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemeContext.Provider, {
			value: theme !== null && theme !== void 0 ? theme : {},
			children
		});
	}
	function useTheme() {
		const theme = (0, react.useContext)(ThemeContext);
		if (!theme) throw new Error("useTheme must be used within a ThemeProvider or A2UIProvider");
		return theme;
	}
	function useThemeOptional() {
		return (0, react.useContext)(ThemeContext);
	}

//#endregion
//#region src/react-renderer/core/A2UIProvider.tsx
/**
	* Context for stable actions (never changes reference, prevents re-renders).
	*/
	const A2UIActionsContext = (0, react.createContext)(null);
	/**
	* Context for reactive state (changes trigger re-renders).
	*/
	const A2UIStateContext = (0, react.createContext)(null);
	/**
	* Provider component that sets up the A2UI v0.9 context for descendant components.
	* Uses a two-context architecture for performance:
	* - A2UIActionsContext: Stable actions that never change (no re-renders)
	* - A2UIStateContext: Reactive state that triggers re-renders when needed
	*/
	function A2UIProvider({ onAction, theme, catalog, children }) {
		const onActionRef = (0, react.useRef)(onAction !== null && onAction !== void 0 ? onAction : null);
		onActionRef.current = onAction !== null && onAction !== void 0 ? onAction : null;
		const processorRef = (0, react.useRef)(null);
		if (!processorRef.current) processorRef.current = new _a2ui_web_core_v0_9.MessageProcessor([catalog !== null && catalog !== void 0 ? catalog : basicCatalog], (action) => {
			if (onActionRef.current) {
				var _action$name, _action$surfaceId, _action$timestamp;
				const message = { userAction: {
					name: (_action$name = action === null || action === void 0 ? void 0 : action.name) !== null && _action$name !== void 0 ? _action$name : "unknown",
					surfaceId: (_action$surfaceId = action === null || action === void 0 ? void 0 : action.surfaceId) !== null && _action$surfaceId !== void 0 ? _action$surfaceId : "default",
					sourceComponentId: action === null || action === void 0 ? void 0 : action.sourceComponentId,
					context: action === null || action === void 0 ? void 0 : action.context,
					timestamp: (_action$timestamp = action === null || action === void 0 ? void 0 : action.timestamp) !== null && _action$timestamp !== void 0 ? _action$timestamp : (/* @__PURE__ */ new Date()).toISOString()
				} };
				onActionRef.current(message);
			}
		});
		const processor = processorRef.current;
		const [version, setVersion] = (0, react.useState)(0);
		const [error, setError] = (0, react.useState)(null);
		const actionsRef = (0, react.useRef)(null);
		if (!actionsRef.current) actionsRef.current = {
			processMessages: (messages) => {
				try {
					processor.processMessages(messages);
				} catch (err) {
					console.warn("[A2UI] processMessages error:", err);
					setError(err instanceof Error ? err.message : String(err));
					return;
				}
				setError(null);
				setVersion((v) => v + 1);
			},
			dispatch: (message) => {
				if (onActionRef.current) onActionRef.current(message);
			},
			getSurface: (surfaceId) => {
				return processor.model.getSurface(surfaceId);
			},
			clearSurfaces: () => {
				const surfaces = processor.model.surfacesMap;
				for (const [id] of surfaces) processor.processMessages([{
					version: "v0.9",
					deleteSurface: { surfaceId: id }
				}]);
				setVersion((v) => v + 1);
			}
		};
		const actions = actionsRef.current;
		const stateValue = (0, react.useMemo)(() => ({
			version,
			error
		}), [version, error]);
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(A2UIActionsContext.Provider, {
			value: actions,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(A2UIStateContext.Provider, {
				value: stateValue,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThemeProvider, {
					theme,
					children
				})
			})
		});
	}
	/**
	* Hook to access stable A2UI actions (won't cause re-renders).
	*/
	function useA2UIActions() {
		const actions = (0, react.useContext)(A2UIActionsContext);
		if (!actions) throw new Error("useA2UIActions must be used within an A2UIProvider");
		return actions;
	}
	/**
	* Hook to subscribe to A2UI state changes.
	*/
	function useA2UIState() {
		const state = (0, react.useContext)(A2UIStateContext);
		if (!state) throw new Error("useA2UIState must be used within an A2UIProvider");
		return state;
	}
	/**
	* Hook to access the full A2UI context (actions + state).
	*/
	function useA2UIContext() {
		const actions = useA2UIActions();
		const state = useA2UIState();
		return (0, react.useMemo)(() => ({
			...actions,
			version: state.version,
			onAction: null
		}), [actions, state.version]);
	}
	/** @deprecated Use useA2UIContext instead. */
	const useA2UIStore = useA2UIContext;
	/**
	* Hook to access the current A2UI error state.
	*/
	function useA2UIError() {
		var _state$error;
		const state = (0, react.useContext)(A2UIStateContext);
		return (_state$error = state === null || state === void 0 ? void 0 : state.error) !== null && _state$error !== void 0 ? _state$error : null;
	}
	/** @deprecated Use useA2UIContext() or useA2UI() directly instead. */
	function useA2UIStoreSelector(selector) {
		return selector(useA2UIContext());
	}

//#endregion
//#region src/react-renderer/hooks/useA2UI.ts
/**
	* Main API hook for A2UI v0.9. Provides methods to process messages
	* and access surface state.
	*/
	function useA2UI() {
		const actions = useA2UIActions();
		const state = useA2UIState();
		return {
			processMessages: actions.processMessages,
			getSurface: actions.getSurface,
			clearSurfaces: actions.clearSurfaces,
			version: state.version
		};
	}

//#endregion
//#region src/react-renderer/lib/utils.ts
/**
	* Utility function to merge class names.
	*/
	function cn(...inputs) {
		return (0, clsx.clsx)(inputs);
	}

//#endregion
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
		const { getSurface, version } = useA2UI();
		const surface = getSurface(surfaceId);
		if (!surface) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: fallback });
		const actualLoadingFallback = loadingFallback !== null && loadingFallback !== void 0 ? loadingFallback : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DefaultLoadingFallback, {});
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: cn("a2ui-surface", className),
			"data-surface-id": surfaceId,
			"data-version": version,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
				fallback: actualLoadingFallback,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(A2uiSurface, { surface })
			})
		});
	});

//#endregion
//#region src/react-renderer/catalog-utils.ts
	const BASIC_CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";
	/**
	* Context description used to identify the A2UI component schema in RunAgentInput.context.
	* Must match the constant in @ag-ui/a2ui-middleware so the middleware can overwrite
	* a frontend-provided schema with a server-side one.
	*/
	const A2UI_SCHEMA_CONTEXT_DESCRIPTION = "A2UI Component Schema — available components for generating UI surfaces. Use these component names and properties when creating A2UI operations.";
	/**
	* Check whether a catalog is a superset of the basic catalog
	* (i.e., it contains all basic components by name).
	*/
	function extendsBasicCatalog(catalog) {
		for (const name of basicCatalog.components.keys()) if (!catalog.components.has(name)) return false;
		return true;
	}
	/**
	* Return the names of components in a catalog that are not in the basic catalog.
	*/
	function getCustomComponentNames(catalog) {
		const custom = [];
		for (const name of catalog.components.keys()) if (!basicCatalog.components.has(name)) custom.push(name);
		return custom;
	}
	/**
	* Build a context string describing the available A2UI catalog and custom components.
	* Custom components (those not in the basic catalog) are described using their
	* JSON Schema representation, matching the canonical A2UI catalog format.
	*/
	function buildCatalogContextValue(catalog) {
		const resolved = catalog !== null && catalog !== void 0 ? catalog : basicCatalog;
		const lines = [];
		lines.push("Available A2UI catalog:");
		if (resolved.id === BASIC_CATALOG_ID) {
			lines.push(`- ${resolved.id} (basic catalog)`);
			return lines.join("\n");
		}
		const isSuperset = extendsBasicCatalog(resolved);
		const customNames = getCustomComponentNames(resolved);
		lines.push(`- ${resolved.id}`);
		if (isSuperset) lines.push("  Extends the basic catalog with all standard components plus:");
		else {
			lines.push("  Custom catalog (does NOT include all basic components).");
			lines.push("  Custom components:");
		}
		for (const name of customNames) {
			const comp = resolved.components.get(name);
			if (!comp) continue;
			const jsonSchema = (0, zod_to_json_schema.zodToJsonSchema)(comp.schema);
			lines.push(`  - ${name}:`);
			lines.push(`    ${JSON.stringify(jsonSchema, null, 2).split("\n").join("\n    ")}`);
		}
		return lines.join("\n");
	}
	/**
	* Extract component schemas from a catalog in the A2UI v0.9 inline catalog
	* format.  This mirrors `generateInlineCatalog` from `@a2ui/web_core` so
	* the schema the LLM sees matches the spec and the flat wire format:
	*
	*   { "Column": { "allOf": [
	*       { "$ref": "common_types.json#/$defs/ComponentCommon" },
	*       { "properties": { "component": {"const":"Column"}, "gap": ..., "children": ... },
	*         "required": ["component"] }
	*   ]}}
	*
	* When sent via `useAgentContext` with `A2UI_SCHEMA_CONTEXT_DESCRIPTION`,
	* the middleware can optionally overwrite it with a server-side schema.
	*/
	function extractCatalogComponentSchemas(catalog) {
		const resolved = catalog !== null && catalog !== void 0 ? catalog : basicCatalog;
		const components = {};
		for (const [name, comp] of resolved.components) {
			var _zodSchema$properties, _zodSchema$required;
			const zodSchema = (0, zod_to_json_schema.zodToJsonSchema)(comp.schema, { target: "jsonSchema2019-09" });
			components[name] = { allOf: [{ $ref: "common_types.json#/$defs/ComponentCommon" }, {
				properties: {
					component: { const: name },
					...(_zodSchema$properties = zodSchema.properties) !== null && _zodSchema$properties !== void 0 ? _zodSchema$properties : {}
				},
				required: ["component", ...(_zodSchema$required = zodSchema.required) !== null && _zodSchema$required !== void 0 ? _zodSchema$required : []]
			}] };
		}
		return {
			catalogId: resolved.id,
			components
		};
	}

//#endregion
//#region src/react-renderer/create-catalog.tsx
/**
	* Create an A2UI catalog from definitions and renderers.
	*
	* Definitions are platform-agnostic (Zod schemas + descriptions).
	* Renderers are platform-specific (React components).
	* TypeScript enforces that renderers match definitions exactly.
	*
	* @example
	* ```tsx
	* // schema.ts (platform-agnostic)
	* export const demoCatalogDefinitions = {
	*   Card: {
	*     description: "A card container",
	*     props: z.object({ title: z.string(), child: z.string().optional() }),
	*   },
	* } satisfies CatalogDefinitions;
	*
	* // catalog.tsx (React renderers)
	* export const demoCatalog = createCatalog(demoCatalogDefinitions, {
	*   Card: ({ props, children }) => (
	*     <div>{props.title}{props.child && children(props.child)}</div>
	*   ),
	* });
	* ```
	*/
	function createCatalog(definitions, renderers, options) {
		var _options$catalogId;
		const catalogId = (_options$catalogId = options === null || options === void 0 ? void 0 : options.catalogId) !== null && _options$catalogId !== void 0 ? _options$catalogId : "copilotkit://custom-catalog";
		const includeBasic = (options === null || options === void 0 ? void 0 : options.includeBasicCatalog) === true;
		const customComponents = [];
		for (const [name, def] of Object.entries(definitions)) {
			const api = {
				name,
				schema: def.props
			};
			const renderer = renderers[name];
			const wrapped = createReactComponent(api, ({ props, buildChild, context }) => {
				const Render = renderer;
				const dispatch = (action) => context.dispatchAction(action);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Render, {
					props,
					children: buildChild,
					dispatch
				});
			});
			customComponents.push(wrapped);
		}
		return new _a2ui_web_core_v0_9.Catalog(catalogId, includeBasic ? [...Array.from(basicCatalog.components.values()), ...customComponents] : customComponents, includeBasic ? Array.from(basicCatalog.functions.values()) : []);
	}
	/**
	* Extract a JSON-serializable schema from catalog definitions.
	* Suitable for passing to the runtime's `a2ui.schema` config.
	*/
	function extractSchema(definitions) {
		return Object.entries(definitions).map(([name, def]) => ({
			name,
			description: def.description,
			props: zodSchemaToSimpleObject(def.props)
		}));
	}
	function zodSchemaToSimpleObject(schema) {
		const shape = schema.shape;
		const properties = {};
		for (const [key, value] of Object.entries(shape)) {
			var _zodValue$_def$typeNa, _zodValue$_def;
			const zodValue = value;
			properties[key] = {
				type: (_zodValue$_def$typeNa = (_zodValue$_def = zodValue._def) === null || _zodValue$_def === void 0 ? void 0 : _zodValue$_def.typeName) !== null && _zodValue$_def$typeNa !== void 0 ? _zodValue$_def$typeNa : "unknown",
				...zodValue.description ? { description: zodValue.description } : {}
			};
		}
		return {
			type: "object",
			properties
		};
	}
	/**
	* @deprecated Use `createCatalog(definitions, renderers)` instead.
	*/
	function createA2UICatalog(components, options) {
		const definitions = {};
		const renderers = {};
		for (const [name, def] of Object.entries(components)) {
			definitions[name] = {
				props: def.props,
				description: def.description
			};
			renderers[name] = def.render;
		}
		return createCatalog(definitions, renderers, options);
	}
	/**
	* @deprecated Use `extractSchema(definitions)` instead.
	*/
	function extractA2UISchema(components) {
		const definitions = {};
		for (const [name, def] of Object.entries(components)) definitions[name] = {
			props: def.props,
			description: def.description
		};
		return extractSchema(definitions);
	}

//#endregion
//#region src/react-renderer/styles/index.ts
/**
	* v0.9: Styles are now handled by a2ui-react components internally.
	* These functions are kept as no-ops for backward compatibility.
	*/
	function injectStyles() {}
	function removeStyles() {}

//#endregion
//#region src/react-renderer/index.ts
	function registerDefaultCatalog() {}
	function initializeDefaultCatalog() {}
	const defaultTheme = {};
	const litTheme = defaultTheme;

//#endregion
//#region src/a2ui-types.ts
/** Default surface ID when none is specified */
	const DEFAULT_SURFACE_ID = "default";

//#endregion
//#region src/index.ts
	const viewerTheme = {};

//#endregion
exports.A2UIProvider = A2UIProvider;
exports.A2UIRenderer = A2UIRenderer;
exports.A2UI_SCHEMA_CONTEXT_DESCRIPTION = A2UI_SCHEMA_CONTEXT_DESCRIPTION;
Object.defineProperty(exports, 'Catalog', {
  enumerable: true,
  get: function () {
    return _a2ui_web_core_v0_9.Catalog;
  }
});
exports.DEFAULT_SURFACE_ID = DEFAULT_SURFACE_ID;
exports.ThemeProvider = ThemeProvider;
exports.basicCatalog = basicCatalog;
exports.buildCatalogContextValue = buildCatalogContextValue;
exports.cn = cn;
exports.createA2UICatalog = createA2UICatalog;
exports.createCatalog = createCatalog;
exports.createReactComponent = createReactComponent;
exports.defaultTheme = defaultTheme;
exports.extendsBasicCatalog = extendsBasicCatalog;
exports.extractA2UISchema = extractA2UISchema;
exports.extractCatalogComponentSchemas = extractCatalogComponentSchemas;
exports.extractSchema = extractSchema;
exports.getCustomComponentNames = getCustomComponentNames;
exports.initializeDefaultCatalog = initializeDefaultCatalog;
exports.injectStyles = injectStyles;
exports.litTheme = litTheme;
exports.registerDefaultCatalog = registerDefaultCatalog;
exports.removeStyles = removeStyles;
exports.useA2UI = useA2UI;
exports.useA2UIActions = useA2UIActions;
exports.useA2UIContext = useA2UIContext;
exports.useA2UIError = useA2UIError;
exports.useA2UIState = useA2UIState;
exports.useA2UIStore = useA2UIStore;
exports.useA2UIStoreSelector = useA2UIStoreSelector;
exports.useTheme = useTheme;
exports.useThemeOptional = useThemeOptional;
exports.viewerTheme = viewerTheme;
});
//# sourceMappingURL=index.umd.js.map