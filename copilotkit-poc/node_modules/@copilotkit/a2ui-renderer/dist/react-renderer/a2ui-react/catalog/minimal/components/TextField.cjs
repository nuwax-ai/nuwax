const require_runtime = require('../../../../../_virtual/_rolldown/runtime.cjs');
const require_adapter = require('../../../adapter.cjs');
let react = require("react");
react = require_runtime.__toESM(react);
let _a2ui_web_core_v0_9 = require("@a2ui/web_core/v0_9");
let react_jsx_runtime = require("react/jsx-runtime");
let zod = require("zod");

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
const TextField = require_adapter.createReactComponent(TextFieldApiDef, ({ props, context }) => {
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
exports.TextField = TextField;
//# sourceMappingURL=TextField.cjs.map