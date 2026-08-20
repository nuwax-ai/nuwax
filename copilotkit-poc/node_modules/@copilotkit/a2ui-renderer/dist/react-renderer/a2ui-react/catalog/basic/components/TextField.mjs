import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS } from "../utils.mjs";
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";

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
const TextField = createReactComponent(TextFieldApi, ({ props }) => {
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
	const uniqueId = React.useId();
	const hasError = props.validationErrors && props.validationErrors.length > 0;
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "4px",
			width: "100%",
			margin: LEAF_MARGIN
		},
		children: [
			props.label && /* @__PURE__ */ jsx("label", {
				htmlFor: uniqueId,
				style: {
					fontSize: "14px",
					fontWeight: "bold"
				},
				children: props.label
			}),
			isLong ? /* @__PURE__ */ jsx("textarea", {
				id: uniqueId,
				style: {
					...style,
					border: hasError ? "1px solid red" : STANDARD_BORDER
				},
				value: props.value || "",
				onChange
			}) : /* @__PURE__ */ jsx("input", {
				id: uniqueId,
				type,
				style: {
					...style,
					border: hasError ? "1px solid red" : STANDARD_BORDER
				},
				value: props.value || "",
				onChange
			}),
			hasError && /* @__PURE__ */ jsx("span", {
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
export { TextField };
//# sourceMappingURL=TextField.mjs.map