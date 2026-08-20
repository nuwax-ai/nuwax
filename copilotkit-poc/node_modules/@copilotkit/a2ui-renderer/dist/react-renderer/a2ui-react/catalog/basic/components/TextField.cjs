const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
const require_utils = require('../utils.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
let _a2ui_web_core_v0_9_basic_catalog = require("@a2ui/web_core/v0_9/basic_catalog");

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
const TextField = require_adapter.createReactComponent(_a2ui_web_core_v0_9_basic_catalog.TextFieldApi, ({ props }) => {
	const onChange = (e) => {
		props.setValue(e.target.value);
	};
	const isLong = props.variant === "longText";
	const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";
	const style = {
		padding: "8px",
		width: "100%",
		border: require_utils.STANDARD_BORDER,
		borderRadius: require_utils.STANDARD_RADIUS,
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
			margin: require_utils.LEAF_MARGIN
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
					border: hasError ? "1px solid red" : require_utils.STANDARD_BORDER
				},
				value: props.value || "",
				onChange
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				id: uniqueId,
				type,
				style: {
					...style,
					border: hasError ? "1px solid red" : require_utils.STANDARD_BORDER
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
exports.TextField = TextField;
//# sourceMappingURL=TextField.cjs.map