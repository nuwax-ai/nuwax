const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const Text = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TextApi, ({ props }) => {
	const text = props.text ?? "";
	const style = {
		...require_utils.getBaseLeafStyle(),
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
exports.Text = Text;
//# sourceMappingURL=Text.cjs.map