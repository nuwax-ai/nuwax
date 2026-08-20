const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const DateTimeInput = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.DateTimeInputApi, ({ props }) => {
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
		border: require_utils.STANDARD_BORDER,
		borderRadius: require_utils.STANDARD_RADIUS,
		boxSizing: "border-box"
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "4px",
			width: "100%",
			margin: require_utils.LEAF_MARGIN
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
exports.DateTimeInput = DateTimeInput;
//# sourceMappingURL=DateTimeInput.cjs.map