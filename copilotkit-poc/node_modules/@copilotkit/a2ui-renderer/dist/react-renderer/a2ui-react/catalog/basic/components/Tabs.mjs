import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN } from "../utils.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { TabsApi } from "@a2ui/web_core/v0_9/basic_catalog";

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
const Tabs = createReactComponent(TabsApi, ({ props, buildChild }) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const tabs = props.tabs || [];
	const activeTab = tabs[selectedIndex];
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			width: "100%",
			margin: LEAF_MARGIN
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				borderBottom: "1px solid #ccc",
				marginBottom: "8px"
			},
			children: tabs.map((tab, i) => /* @__PURE__ */ jsx("button", {
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
		}), /* @__PURE__ */ jsx("div", {
			style: { flex: 1 },
			children: activeTab ? buildChild(activeTab.child) : null
		})]
	});
});

//#endregion
export { Tabs };
//# sourceMappingURL=Tabs.mjs.map