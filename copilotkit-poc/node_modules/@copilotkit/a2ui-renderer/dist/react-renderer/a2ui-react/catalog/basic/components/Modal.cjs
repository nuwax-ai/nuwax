const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const Modal = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.ModalApi, ({ props, buildChild }) => {
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
exports.Modal = Modal;
//# sourceMappingURL=Modal.cjs.map