import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS } from "../utils.mjs";
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { DateTimeInputApi } from "@a2ui/web_core/v0_9/basic_catalog";

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
const DateTimeInput = createReactComponent(DateTimeInputApi, ({ props }) => {
	const onChange = (e) => {
		props.setValue(e.target.value);
	};
	const uniqueId = React.useId();
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
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "4px",
			width: "100%",
			margin: LEAF_MARGIN
		},
		children: [props.label && /* @__PURE__ */ jsx("label", {
			htmlFor: uniqueId,
			style: {
				fontSize: "14px",
				fontWeight: "bold"
			},
			children: props.label
		}), /* @__PURE__ */ jsx("input", {
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
export { DateTimeInput };
//# sourceMappingURL=DateTimeInput.mjs.map