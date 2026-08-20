const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const Tabs = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TabsApi, ({ props, buildChild }) => {
	const [selectedIndex, setSelectedIndex] = (0, react.useState)(0);
	const tabs = props.tabs || [];
	const activeTab = tabs[selectedIndex];
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			width: "100%",
			margin: require_utils.LEAF_MARGIN
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
exports.Tabs = Tabs;
//# sourceMappingURL=Tabs.cjs.map