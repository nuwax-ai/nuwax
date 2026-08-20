import { createReactComponent } from "../../../adapter.mjs";
import { LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS } from "../utils.mjs";
import React, { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ChoicePickerApi } from "@a2ui/web_core/v0_9/basic_catalog";

//#region src/react-renderer/a2ui-react/catalog/basic/components/ChoicePicker.tsx
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
const ChoicePicker = createReactComponent(ChoicePickerApi, ({ props, context }) => {
	const [filter, setFilter] = useState("");
	const values = Array.isArray(props.value) ? props.value : [];
	const isMutuallyExclusive = props.variant === "mutuallyExclusive";
	const onToggle = (val) => {
		if (isMutuallyExclusive) props.setValue([val]);
		else {
			const newValues = values.includes(val) ? values.filter((v) => v !== val) : [...values, val];
			props.setValue(newValues);
		}
	};
	const options = (props.options || []).filter((opt) => !props.filterable || filter === "" || String(opt.label).toLowerCase().includes(filter.toLowerCase()));
	const containerStyle = {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		margin: LEAF_MARGIN,
		width: "100%"
	};
	const listStyle = {
		display: "flex",
		flexDirection: props.displayStyle === "chips" ? "row" : "column",
		flexWrap: props.displayStyle === "chips" ? "wrap" : "nowrap",
		gap: "8px"
	};
	return /* @__PURE__ */ jsxs("div", {
		style: containerStyle,
		children: [
			props.label && /* @__PURE__ */ jsx("strong", {
				style: { fontSize: "14px" },
				children: props.label
			}),
			props.filterable && /* @__PURE__ */ jsx("input", {
				type: "text",
				placeholder: "Filter options...",
				value: filter,
				onChange: (e) => setFilter(e.target.value),
				style: {
					padding: "4px 8px",
					border: STANDARD_BORDER,
					borderRadius: STANDARD_RADIUS
				}
			}),
			/* @__PURE__ */ jsx("div", {
				style: listStyle,
				children: options.map((opt, i) => {
					const isSelected = values.includes(opt.value);
					if (props.displayStyle === "chips") return /* @__PURE__ */ jsx("button", {
						onClick: () => onToggle(opt.value),
						style: {
							padding: "4px 12px",
							borderRadius: "16px",
							border: isSelected ? "1px solid var(--a2ui-primary-color, #007bff)" : STANDARD_BORDER,
							backgroundColor: isSelected ? "var(--a2ui-primary-color, #007bff)" : "#fff",
							color: isSelected ? "#fff" : "inherit",
							cursor: "pointer",
							fontSize: "12px"
						},
						children: opt.label
					}, i);
					return /* @__PURE__ */ jsxs("label", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "8px",
							cursor: "pointer"
						},
						children: [/* @__PURE__ */ jsx("input", {
							type: isMutuallyExclusive ? "radio" : "checkbox",
							checked: isSelected,
							onChange: () => onToggle(opt.value),
							name: isMutuallyExclusive ? `choice-${context.componentModel.id}` : void 0
						}), /* @__PURE__ */ jsx("span", {
							style: { fontSize: "14px" },
							children: opt.label
						})]
					}, i);
				})
			})
		]
	});
});

//#endregion
export { ChoicePicker };
//# sourceMappingURL=ChoicePicker.mjs.map