const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const Divider = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.DividerApi, ({ props }) => {
	const isVertical = props.axis === "vertical";
	const style = {
		margin: require_utils.LEAF_MARGIN,
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
exports.Divider = Divider;
//# sourceMappingURL=Divider.cjs.map